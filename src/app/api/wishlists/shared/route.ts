import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { cookies } from 'next/headers';
import { verifyToken } from '@/app/lib/jwt';

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

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromToken();
    const db = await getDb();
    
    // Get all cookies to check for owner tokens
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const ownerTokens = allCookies
      .filter(cookie => cookie.name.startsWith('owner_'))
      .map(cookie => cookie.value);
    
    // Build the query to find shared wishlists
    const query: any = {
      isPublic: true,
      $nor: [
        // Not owned by authenticated user
        ...(userId ? [{ userId }] : []),
        // Not owned by anonymous users with valid owner tokens
        ...(ownerTokens.length > 0 ? [{ ownerToken: { $in: ownerTokens } }] : [])
      ]
    };
    
    // Get wishlists that are public and not owned by the user
    const sharedWishlists = await db
      .collection('wishlists')
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray();
    
    return NextResponse.json({
      shared: sharedWishlists
    });
  } catch (error) {
    console.error('Error fetching shared wishlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared wishlists' },
      { status: 500 }
    );
  }
} 