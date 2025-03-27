import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';

interface Reservation {
  itemId: string;
  reserverEmail: string | null;
  reservedAt: Date;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { itemId, reserverEmail } = await request.json();
    if (!itemId) {
      return NextResponse.json(
        { error: "Item id required" },
        { status: 400 }
      );
    }
    
    const db = await getDb();
    
    const result = await db.collection("wishlists").updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $push: { 
          reservations: { 
            itemId, 
            reserverEmail: reserverEmail || null, 
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

    return NextResponse.json({ message: "Item reserved" });
  } catch (error) {
    console.error("Error reserving item:", error);
    return NextResponse.json(
      { error: "Failed to reserve item" },
      { status: 500 }
    );
  }
} 