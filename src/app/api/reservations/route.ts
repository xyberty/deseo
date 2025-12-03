import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { cookies } from 'next/headers';
import { verifyToken } from '@/app/lib/jwt';

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

// Helper to get reserver ID from cookie
async function getReserverId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('reserverId')?.value || null;
}

export async function GET() {
  try {
    // Get authentication info
    const userId = await getUserIdFromToken();
    const reserverId = await getReserverId();
    
    // If neither authenticated nor has reservations, return empty
    if (!userId && !reserverId) {
      return NextResponse.json({
        reservations: []
      });
    }
    
    const db = await getDb();
    const cookieStore = await cookies();
    
    // First, find all wishlists that have reservations from this user
    // We need to check both authenticated user email and anonymous reserver ID
    const pipeline = [
      {
        $match: {
          $or: [
            { "reservations.reserverId": reserverId },
            { "reservations.reserverEmail": userId }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          items: 1,
          userId: 1,
          ownerToken: 1,
          isPublic: 1,
          isArchived: { $ifNull: ["$isArchived", false] },
          reservations: {
            $ifNull: [
              {
                $filter: {
                  input: "$reservations",
                  as: "reservation",
                  cond: {
                    $or: [
                      { $eq: ["$$reservation.reserverId", reserverId] },
                      { $eq: ["$$reservation.reserverEmail", userId] }
                    ]
                  }
                }
              },
              []
            ]
          }
        }
      },
      {
        $project: {
          wishlistId: "$_id",
          title: 1,
          userId: 1,
          ownerToken: 1,
          isPublic: 1,
          isArchived: 1,
          items: {
            $filter: {
              input: "$items",
              as: "item",
              cond: {
                $in: [
                  "$$item.id",
                  {
                    $map: {
                      input: "$reservations",
                      as: "reservation",
                      in: "$$reservation.itemId"
                    }
                  }
                ]
              }
            }
          }
        }
      }
    ];
    
    const userReservations = await db
      .collection('wishlists')
      .aggregate(pipeline)
      .toArray();
    
    // Filter reservations to only include:
    // 1. Wishlists the user can view (owner, or public and not archived)
    // 2. Wishlists with at least one reserved item
    const accessibleReservations = userReservations
      .filter(wishlist => {
        // Check if user is the owner
        // For authenticated users: check if userId matches
        // For anonymous users: check if owner token cookie matches
        const wishlistId = wishlist.wishlistId.toString();
        const ownerTokenCookie = cookieStore.get(`owner_${wishlistId}`)?.value;
        const isOwner = 
          (userId && wishlist.userId === userId) ||
          (!userId && wishlist.ownerToken && ownerTokenCookie === wishlist.ownerToken);
        
        // Check if user can view (owner or public and not archived)
        const canView = isOwner || (wishlist.isPublic && !wishlist.isArchived);
        
        // Only include if user can view AND has at least one reserved item
        return canView && wishlist.items && wishlist.items.length > 0;
      })
      .map(wishlist => ({
        wishlistId: wishlist.wishlistId.toString(),
        title: wishlist.title,
        items: wishlist.items
      }));
    
    return NextResponse.json({
      reservations: accessibleReservations
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
} 