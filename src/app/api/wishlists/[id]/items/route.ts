import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { WishlistItem } from '@/app/types/wishlist';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await params;
    const { name, description, price, url, imageUrl } = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid wishlist ID' },
        { status: 400 }
      );
    }

    const newItem: WishlistItem = {
      id: crypto.randomUUID(),
      name,
      description,
      price: price ? Number(price) : undefined,
      url,
      imageUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('wishlists').updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { items: newItem },
        $set: { updatedAt: new Date() },
      } as any
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, item: newItem });
  } catch (error) {
    console.error('Error adding item:', error);
    return NextResponse.json(
      { error: 'Failed to add item' },
      { status: 500 }
    );
  }
} 