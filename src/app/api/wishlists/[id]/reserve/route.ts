import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';

interface Reservation {
  itemId: string;
  reserverId: string;
  reserverEmail: string | null;
  reservedAt: Date;
  passphrase?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { itemId, reserverEmail, passphrase } = await request.json();
    
    if (!itemId) {
      return NextResponse.json(
        { error: "Item id required" },
        { status: 400 }
      );
    }

    // Get or create reserverId from cookie
    const cookieStore = await cookies();
    let reserverId = cookieStore.get('reserverId')?.value;
    
    if (!reserverId) {
      reserverId = nanoid();
      // Set cookie with 1 year expiry
      const response = NextResponse.json({ 
        message: "Item reserved",
        reserverId,
        passphrase: passphrase || null
      });
      
      response.cookies.set('reserverId', reserverId, {
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        path: '/',
        sameSite: 'lax'
      });
      
      return response;
    }
    
    const db = await getDb();
    
    // Check if item is already reserved
    const existingReservation = await db.collection("wishlists").findOne({
      _id: new ObjectId(params.id),
      "reservations.itemId": itemId
    });

    if (existingReservation) {
      return NextResponse.json(
        { error: "Item is already reserved" },
        { status: 409 }
      );
    }

    // Add reservation
    const result = await db.collection("wishlists").updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $push: { 
          reservations: { 
            itemId, 
            reserverId,
            reserverEmail: reserverEmail || null,
            passphrase: passphrase || null,
            reservedAt: new Date() 
          } 
        } 
      } as any
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Wishlist not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Item reserved",
      reserverId,
      passphrase: passphrase || null
    });
  } catch (error) {
    console.error("Error reserving item:", error);
    return NextResponse.json(
      { error: "Failed to reserve item" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const reserverId = cookieStore.get('reserverId')?.value;

    if (!reserverId) {
      return NextResponse.json({ reservations: [] });
    }

    const db = await getDb();
    const wishlist = await db.collection("wishlists").findOne(
      { _id: new ObjectId(params.id) },
      { projection: { reservations: 1 } }
    );

    if (!wishlist) {
      return NextResponse.json(
        { error: "Wishlist not found" },
        { status: 404 }
      );
    }

    // Filter reservations to only show the user's own reservations
    const userReservations = wishlist.reservations?.filter(
      (r: Reservation) => r.reserverId === reserverId
    ) || [];

    return NextResponse.json({ reservations: userReservations });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
} 