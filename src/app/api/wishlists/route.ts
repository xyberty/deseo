import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { Wishlist } from '@/app/types/wishlist';

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { title, description, items = [] } = body;

    const wishlist: Omit<Wishlist, '_id'> = {
      title,
      description,
      items,
      userId: `temp_${crypto.randomUUID()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('wishlists').insertOne(wishlist as any);
    
    return NextResponse.json({
      id: result.insertedId,
      ...wishlist,
    });
  } catch (error) {
    console.error('Error creating wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to create wishlist' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // If no userId is provided, return all wishlists
    // In a production app, you would want to implement proper authentication
    const query = userId ? { userId } : {};
    
    const wishlists = await db
      .collection('wishlists')
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json(wishlists);
  } catch (error) {
    console.error('Error fetching wishlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlists' },
      { status: 500 }
    );
  }
} 