import { NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/jwt';
import { getDb } from '@/app/lib/mongodb';
import { cookies } from 'next/headers';
import type { Db } from 'mongodb';

// Force Node.js runtime (required for jsonwebtoken)
export const runtime = 'nodejs';

// Helper function to migrate anonymous wishlists to authenticated user
async function migrateAnonymousWishlists(db: Db, userId: string) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    // Get all owner tokens from cookies
    const ownerTokens = allCookies
      .filter(cookie => cookie.name.startsWith('owner_'))
      .map(cookie => cookie.value);
    
    if (ownerTokens.length === 0) {
      return; // No anonymous wishlists to migrate
    }
    
    // Find wishlists with matching owner tokens
    const wishlistsToMigrate = await db.collection('wishlists').find({
      ownerToken: { $in: ownerTokens },
      userId: null, // Only migrate wishlists that aren't already assigned
    }).toArray();
    
    if (wishlistsToMigrate.length === 0) {
      return; // No wishlists to migrate
    }
    
    // Migrate wishlists: set userId and clear ownerToken
    const wishlistIds = wishlistsToMigrate.map((w) => w._id);
    await db.collection('wishlists').updateMany(
      { _id: { $in: wishlistIds } },
      {
        $set: {
          userId,
          updatedAt: new Date(),
        },
        $unset: {
          ownerToken: '',
        },
      }
    );
  } catch (error) {
    console.error('Error migrating anonymous wishlists:', error);
    // Don't throw - migration failure shouldn't block authentication
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: "Token is required" },
      { status: 400 }
    );
  }

  try {
    const decoded = verifyToken(token);
    const email = decoded.email;

    const db = await getDb();
    
    // Check if user exists; if not, create one (lazy registration)
    const existingUser = await db.collection("users").findOne({ email });
    if (!existingUser) {
      await db.collection("users").insertOne({ 
        email, 
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      // Update last login
      await db.collection("users").updateOne(
        { email },
        { $set: { lastLogin: new Date(), updatedAt: new Date() } }
      );
    }

    // Migrate anonymous wishlists to authenticated user
    await migrateAnonymousWishlists(db, email);

    // Create response with redirect to home page
    // Use the request URL to preserve the current domain (staging or production)
    const requestUrl = new URL(request.url);
    const redirectUrl = new URL('/', `${requestUrl.protocol}//${requestUrl.host}`);
    const response = NextResponse.redirect(redirectUrl);

    // Set secure cookie with proper attributes
    // Use secure cookies if the request is HTTPS (works for staging and production)
    const isSecure = requestUrl.protocol === 'https:' || process.env.NODE_ENV === "production";
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Magic link verification error:", error);
    
    // Handle specific JWT errors
    if (error instanceof Error) {
      if (error.message === 'Token has expired') {
        return NextResponse.json(
          { error: "This magic link has expired. Please request a new one." },
          { status: 400 }
        );
      }
      if (error.message === 'Invalid token') {
        return NextResponse.json(
          { error: "Invalid magic link. Please request a new one." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to verify magic link" },
      { status: 500 }
    );
  }
} 