import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { ObjectId, type WithId, type Document } from 'mongodb';
import { cookies } from 'next/headers';
import { verifyToken } from '@/app/lib/jwt';
import { nanoid, customAlphabet } from 'nanoid';

// Force Node.js runtime
export const runtime = 'nodejs';

// Custom alphabet for short codes (URL-safe, no ambiguous characters)
const shortCodeAlphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const generateShortCode = customAlphabet(shortCodeAlphabet, 6); // 6 chars = ~56 billion combinations

// Helper to extract user ID from auth token
async function getUserIdFromToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = verifyToken(token);
    return decoded.email;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// Validate short code format
function isValidShortCode(code: string): boolean {
  // 3-20 characters, alphanumeric only, URL-safe
  const regex = /^[a-zA-Z0-9_-]{3,20}$/;
  return regex.test(code);
}

// Reserved codes that shouldn't be used
const RESERVED_CODES = ['api', 's', 'wishlist', 'dashboard', 'create', 'auth', 'admin', 'user'];

// GET: Get short link for a wishlist
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wishlistId: string }> }
) {
  try {
    const db = await getDb();
    const { wishlistId } = await params;
    
    // Verify ownership
    const userId = await getUserIdFromToken();
    const cookieStore = await cookies();
    const ownerTokenCookie = cookieStore.get(`owner_${wishlistId}`)?.value;
    
    const wishlist = await db.collection('wishlists').findOne({
      _id: new ObjectId(wishlistId),
    });
    
    if (!wishlist) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      );
    }
    
    const isOwner = (userId && wishlist.userId === userId) || 
      (!userId && wishlist.ownerToken && ownerTokenCookie === wishlist.ownerToken);
    
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get or create short link
    let shortLink: WithId<Document> | null = await db.collection('shortLinks').findOne({
      wishlistId: wishlistId,
    });
    
    if (!shortLink) {
      // Generate a new short code
      let shortCode: string;
      let attempts = 0;
      do {
        shortCode = generateShortCode();
        attempts++;
        if (attempts > 10) {
          return NextResponse.json(
            { error: 'Failed to generate unique short code' },
            { status: 500 }
          );
        }
      } while (await db.collection('shortLinks').findOne({ shortCode }));
      
      // Ensure share token exists
      if (!wishlist.shareToken) {
        const shareToken = nanoid(32);
        await db.collection('wishlists').updateOne(
          { _id: new ObjectId(wishlistId) },
          { $set: { shareToken, updatedAt: new Date() } }
        );
        wishlist.shareToken = shareToken;
      }
      
      const newShortLink = {
        shortCode,
        wishlistId: wishlistId,
        shareToken: wishlist.shareToken,
        customCode: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = await db.collection('shortLinks').insertOne(newShortLink);
      // Fetch the inserted document to get the _id
      shortLink = await db.collection('shortLinks').findOne({
        _id: result.insertedId,
      });
    }
    
    if (!shortLink) {
      return NextResponse.json(
        { error: 'Failed to create short link' },
        { status: 500 }
      );
    }
    
    // Use request URL to get the correct port, or fall back to env var
    const requestUrl = new URL(request.url);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${requestUrl.protocol}//${requestUrl.host}`;
    const shortUrl = `${baseUrl}/s/${shortLink.shortCode}`;
    
    return NextResponse.json({
      shortCode: shortLink.shortCode,
      shortUrl,
      customCode: shortLink.customCode || false,
      createdAt: shortLink.createdAt,
    });
  } catch (error) {
    console.error('Error fetching short link:', error);
    return NextResponse.json(
      { error: 'Failed to fetch short link' },
      { status: 500 }
    );
  }
}

// POST: Create or update short link (with optional custom code)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ wishlistId: string }> }
) {
  try {
    const db = await getDb();
    const { wishlistId } = await params;
    const body = await request.json();
    const { customCode } = body;
    
    // Verify ownership
    const userId = await getUserIdFromToken();
    const cookieStore = await cookies();
    const ownerTokenCookie = cookieStore.get(`owner_${wishlistId}`)?.value;
    
    const wishlist = await db.collection('wishlists').findOne({
      _id: new ObjectId(wishlistId),
    });
    
    if (!wishlist) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      );
    }
    
    const isOwner = (userId && wishlist.userId === userId) || 
      (!userId && wishlist.ownerToken && ownerTokenCookie === wishlist.ownerToken);
    
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Ensure share token exists
    if (!wishlist.shareToken) {
      const shareToken = nanoid(32);
      await db.collection('wishlists').updateOne(
        { _id: new ObjectId(wishlistId) },
        { $set: { shareToken, updatedAt: new Date() } }
      );
      wishlist.shareToken = shareToken;
    }
    
    // If custom code provided, validate it
    if (customCode) {
      // Validate format
      if (!isValidShortCode(customCode)) {
        return NextResponse.json(
          { error: 'Invalid short code format. Must be 3-20 alphanumeric characters.' },
          { status: 400 }
        );
      }
      
      // Check if reserved
      if (RESERVED_CODES.includes(customCode.toLowerCase())) {
        return NextResponse.json(
          { error: 'This short code is reserved and cannot be used.' },
          { status: 400 }
        );
      }
      
      // Check if already taken (by another wishlist)
      const existing = await db.collection('shortLinks').findOne({
        shortCode: customCode,
        wishlistId: { $ne: wishlistId }, // Allow updating own wishlist's code
      });
      
      if (existing) {
        return NextResponse.json(
          { error: 'This short code is already taken. Please choose another.' },
          { status: 409 }
        );
      }
    }
    
    // Get existing short link or create new one
    const existingShortLink = await db.collection('shortLinks').findOne({
      wishlistId: wishlistId,
    });
    
    const shortCode = customCode || (existingShortLink?.shortCode) || generateShortCode();
    
    // Double-check uniqueness if generating new code
    if (!customCode && !existingShortLink) {
      let attempts = 0;
      let finalCode = shortCode;
      while (await db.collection('shortLinks').findOne({ shortCode: finalCode })) {
        finalCode = generateShortCode();
        attempts++;
        if (attempts > 10) {
          return NextResponse.json(
            { error: 'Failed to generate unique short code' },
            { status: 500 }
          );
        }
      }
    }
    
    const shortLinkData = {
      shortCode,
      wishlistId: wishlistId,
      shareToken: wishlist.shareToken,
      customCode: !!customCode,
      updatedAt: new Date(),
      ...(existingShortLink ? {} : { createdAt: new Date() }),
    };
    
    if (existingShortLink) {
      await db.collection('shortLinks').updateOne(
        { _id: existingShortLink._id },
        { $set: shortLinkData }
      );
    } else {
      await db.collection('shortLinks').insertOne(shortLinkData);
    }
    
    // Use request URL to get the correct port, or fall back to env var
    const requestUrl = new URL(request.url);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${requestUrl.protocol}//${requestUrl.host}`;
    const shortUrl = `${baseUrl}/s/${shortCode}`;
    
    return NextResponse.json({
      shortCode,
      shortUrl,
      customCode: !!customCode,
      message: existingShortLink ? 'Short link updated' : 'Short link created',
    });
  } catch (error) {
    console.error('Error creating/updating short link:', error);
    return NextResponse.json(
      { error: 'Failed to create/update short link' },
      { status: 500 }
    );
  }
}

