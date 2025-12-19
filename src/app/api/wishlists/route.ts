import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';
import { verifyToken } from '@/app/lib/jwt';
import { getServerBaseUrl } from '@/app/lib/constants';

// Force Node.js runtime (required for jsonwebtoken)
export const runtime = 'nodejs';

// Helper to extract user ID from auth token
async function getUserIdFromToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = verifyToken(token);
    return decoded.email; // Using email as user ID for simplicity
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { title, description, currency, items = [] } = body;
    
    // Try to get authenticated user ID
    const userId = await getUserIdFromToken();
    
    // Generate tokens
    const ownerToken = nanoid(32);  // Temporary token for anonymous creators
    const shareToken = nanoid(32);  // Permanent token for sharing
    
    const wishlist = {
      title,
      description,
      currency: currency || 'USD', // Default to USD if not provided
      items,
      userId: userId || null,
      ownerToken: userId ? null : ownerToken, // Only set for anonymous users
      shareToken, // Always set a share token
      isPublic: false,      // Default to private
      allowEdits: false,    // Default to no public edits
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('wishlists').insertOne(wishlist);
    
    // Get base URL from request or env var
    // For Request type, we can use the request.url directly
    const requestUrl = new URL(request.url);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${requestUrl.protocol}//${requestUrl.host}` || getServerBaseUrl();
    
    // Create response with wishlist data
    const response = NextResponse.json({
      id: result.insertedId.toString(),
      ...wishlist,
      shareUrl: `${baseUrl}/wishlist/${result.insertedId.toString()}?token=${shareToken}`,
    });
    
    // If it's an anonymous user, set the owner token in a cookie
    if (!userId) {
      // Set a cookie to identify the owner
      response.cookies.set(`owner_${result.insertedId.toString()}`, ownerToken, {
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
    }
    
    return response;
  } catch (error) {
    console.error('Error creating wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to create wishlist' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = await getDb();
    
    // Try to get authenticated user ID
    const userId = await getUserIdFromToken();
    
    // Get all cookies to check for owner tokens
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const ownerTokens = allCookies
      .filter(cookie => cookie.name.startsWith('owner_'))
      .map(cookie => cookie.value);
    
    // Build the query conditions for wishlists
    const ownershipConditions = [
      // Wishlists owned by authenticated user
      ...(userId ? [{ userId }] : []),
      // Wishlists owned by anonymous users with valid owner tokens
      ...(ownerTokens.length > 0 ? [{ ownerToken: { $in: ownerTokens } }] : [])
    ];
    
    // If no ownership conditions, return empty arrays (user has no wishlists)
    if (ownershipConditions.length === 0) {
      return NextResponse.json({
        created: [],
        archived: [],
      });
    }
    
    // Build the base query with ownership conditions
    const baseQuery = {
      $or: ownershipConditions
    };
    
    // Get active wishlists (exclude archived)
    const activeQuery = {
      $and: [
        baseQuery,
        {
          $or: [
            { isArchived: { $exists: false } },
            { isArchived: false }
          ]
        }
      ]
    };
    
    const createdWishlists = await db
      .collection('wishlists')
      .find(activeQuery)
      .sort({ updatedAt: -1 })
      .toArray();
    
    // Get archived wishlists
    const archivedQuery = {
      $and: [
        baseQuery,
        { isArchived: true }
      ]
    };
    
    const archivedWishlists = await db
      .collection('wishlists')
      .find(archivedQuery)
      .sort({ updatedAt: -1 })
      .toArray();
      
    return NextResponse.json({
      created: createdWishlists,
      archived: archivedWishlists,
    });
  } catch (error) {
    console.error('Error fetching wishlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlists' },
      { status: 500 }
    );
  }
} 