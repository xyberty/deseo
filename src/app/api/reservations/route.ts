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

// Helper to get reserver ID from cookie
async function getReserverId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('reserverId')?.value || null;
}

export async function GET(request: Request) {
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
    
    // Format the response
    const formattedReservations = userReservations.map(wishlist => ({
      wishlistId: wishlist.wishlistId.toString(),
      title: wishlist.title,
      items: wishlist.items
    }));
    
    return NextResponse.json({
      reservations: formattedReservations
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
} 