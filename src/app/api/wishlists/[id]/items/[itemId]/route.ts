import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { WishlistItem } from "@/app/types/wishlist";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;

  if (!id || !itemId) {
    return NextResponse.json({ error: "Invalid wishlist or item ID" }, { status: 400 });
  }

  try {
    const db = await getDb();
    
    // Log the raw IDs
    console.log('Raw IDs:', { id, itemId });

    const { name, description, price, url, imageUrl } = await request.json();

    // Log the query parameters
    console.log('Query params:', {
      wishlistId: id,
      itemId,
      updateData: { name, description, price, url, imageUrl }
    });

    // First, check if the wishlist exists and has the item
    const wishlistId = new ObjectId(id);
    const wishlist = await db.collection("wishlists").findOne({ _id: wishlistId });
    console.log('Found wishlist:', wishlist ? 'yes' : 'no');
    if (wishlist) {
      console.log('Items in wishlist:', wishlist.items.map((item: any) => item.id));
      console.log('Looking for item with ID:', itemId);
      const itemExists = wishlist.items.some((item: any) => item.id === itemId);
      console.log('Item exists in wishlist:', itemExists);
    }

    const result = await db.collection("wishlists").updateOne(
      { _id: wishlistId, "items.id": itemId },
      {
        $set: {
          "items.$.name": name,
          "items.$.description": description,
          "items.$.price": price,
          "items.$.url": url,
          "items.$.imageUrl": imageUrl,
          "items.$.updatedAt": new Date(),
          updatedAt: new Date()
        }
      }
    );

    console.log('Update result:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Wishlist or item not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Item updated successfully" });
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const { id, itemId } = await params;

  if (!id || !itemId) {
    return NextResponse.json(
      { error: 'Invalid wishlist or item ID' },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    const result = await db.collection('wishlists').updateOne(
      { _id: new ObjectId(id) },
      { 
        $pull: { items: { id: itemId } },
        $set: { updatedAt: new Date() }
      } as any
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
} 