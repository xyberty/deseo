import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { WishlistItem } from '@/app/types/wishlist';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb();
    const { id } = await params;
    const item = await request.json() as WishlistItem;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid wishlist ID' },
        { status: 400 }
      );
    }

    const result = await db.collection('wishlists').updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { items: item },
        $set: { updatedAt: new Date() },
      } as any
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding item:', error);
    return NextResponse.json(
      { error: 'Failed to add item' },
      { status: 500 }
    );
  }
} 