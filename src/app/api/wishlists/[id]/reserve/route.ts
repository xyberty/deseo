import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';

interface Reservation {
  itemId: string;
  reserverId: string;
  reserverEmail: string | null;
  displayName: string | null;
  reservedAt: Date;
  passphrase?: string;
  allowDisclosure: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { itemId, reserverEmail, displayName, passphrase, allowDisclosure } = await request.json();
    const { id } = await params;
    
    if (!itemId) {
      return NextResponse.json(
        { error: "Item id required" },
        { status: 400 }
      );
    }

    // Get or create reserverId from cookie, but do NOT return early.
    const cookieStore = await cookies();
    let reserverId = cookieStore.get('reserverId')?.value;
    let shouldSetCookie = false;
    if (!reserverId) {
      reserverId = nanoid();
      shouldSetCookie = true;
    }
    
    const db = await getDb();
    
    // Check if item is already reserved
    const existingReservation = await db.collection("wishlists").findOne({
      _id: new ObjectId(id),
      "reservations.itemId": itemId
    });

    if (existingReservation) {
      const conflictResponse = NextResponse.json(
        { error: "Item is already reserved" },
        { status: 409 }
      );
      if (shouldSetCookie && reserverId) {
        conflictResponse.cookies.set('reserverId', reserverId, {
          expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          path: '/',
          sameSite: 'lax'
        });
      }
      return conflictResponse;
    }

    // Add reservation
    const reservationData = {
      itemId, 
      reserverId,
      reserverEmail: reserverEmail || null,
      displayName: displayName || null,
      passphrase: passphrase || null,
      allowDisclosure: allowDisclosure,
      reservedAt: new Date() 
    };

    const result = await db.collection("wishlists").updateOne(
      { _id: new ObjectId(id) },
      { 
        $push: { 
          reservations: reservationData
        } 
      } as any
    );
    
    if (result.matchedCount === 0) {
      const notFoundResponse = NextResponse.json(
        { error: "Wishlist not found" },
        { status: 404 }
      );
      if (shouldSetCookie && reserverId) {
        notFoundResponse.cookies.set('reserverId', reserverId, {
          expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          path: '/',
          sameSite: 'lax'
        });
      }
      return notFoundResponse;
    }

    // Verify the reservation was added
    const updatedWishlist = await db.collection("wishlists").findOne(
      { _id: new ObjectId(id) },
      { projection: { reservations: 1 } }
    );
    
    const successResponse = NextResponse.json({ 
      message: "Item reserved",
      reserverId,
      passphrase: passphrase || null
    });
    if (shouldSetCookie && reserverId) {
      successResponse.cookies.set('reserverId', reserverId, {
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        path: '/',
        sameSite: 'lax'
      });
    }
    return successResponse;
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

    const { id } = await params;
    const db = await getDb();
    const wishlist = await db.collection("wishlists").findOne(
      { _id: new ObjectId(id) },
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