import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

// Helper function to build update object, only including defined fields
// Empty strings are converted to null to clear optional fields
function buildUpdateObject(data: {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  url?: string;
  imageUrl?: string;
}) {
  const update: Record<string, unknown> = {
    "items.$.updatedAt": new Date(),
    updatedAt: new Date()
  };

  if (data.name !== undefined) update["items.$.name"] = data.name;
  if (data.description !== undefined) update["items.$.description"] = data.description || null;
  if (data.price !== undefined) update["items.$.price"] = data.price;
  if (data.currency !== undefined) update["items.$.currency"] = data.currency;
  if (data.url !== undefined) update["items.$.url"] = data.url || null;
  if (data.imageUrl !== undefined) update["items.$.imageUrl"] = data.imageUrl || null;

  return update;
}

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

    const { name, description, price, currency, url, imageUrl } = await request.json();

    // First, check if the wishlist exists and has the item
    const wishlistId = new ObjectId(id);
    const wishlist = await db.collection("wishlists").findOne({ _id: wishlistId });
    
    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }
    
    // Check if wishlist is archived
    if (wishlist.isArchived) {
      return NextResponse.json(
        { error: 'Cannot edit items in an archived wishlist. Please unarchive it first.' },
        { status: 403 }
      );
    }

    const update = buildUpdateObject({ name, description, price, currency, url, imageUrl });

    const result = await db.collection("wishlists").updateOne(
      { _id: wishlistId, "items.id": itemId },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Wishlist or item not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Item updated successfully" });
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;

  if (!id || !itemId) {
    return NextResponse.json({ error: "Invalid wishlist or item ID" }, { status: 400 });
  }

  try {
    const db = await getDb();

    const { name, description, price, currency, url, imageUrl } = await request.json();

    // First, check if the wishlist exists and has the item
    const wishlistId = new ObjectId(id);
    const wishlist = await db.collection("wishlists").findOne({ _id: wishlistId });
    
    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }
    
    // Check if wishlist is archived
    if (wishlist.isArchived) {
      return NextResponse.json(
        { error: 'Cannot edit items in an archived wishlist. Please unarchive it first.' },
        { status: 403 }
      );
    }

    const update = buildUpdateObject({ name, description, price, currency, url, imageUrl });

    const result = await db.collection("wishlists").updateOne(
      { _id: wishlistId, "items.id": itemId },
      { $set: update }
    );

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
  { params }: { params: Promise<{ id: string; itemId: string }> }
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
    
    // Check if wishlist is archived
    const wishlist = await db.collection('wishlists').findOne({
      _id: new ObjectId(id),
    });

    if (!wishlist) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      );
    }

    if (wishlist.isArchived) {
      return NextResponse.json(
        { error: 'Cannot delete items from an archived wishlist. Please unarchive it first.' },
        { status: 403 }
      );
    }
    
    const result = await db.collection('wishlists').updateOne(
      { _id: new ObjectId(id) },
      { 
        $pull: { items: { id: itemId } },
        $set: { updatedAt: new Date() }
      } as any // eslint-disable-line @typescript-eslint/no-explicit-any
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