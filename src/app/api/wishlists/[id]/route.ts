import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { verifyToken } from '@/app/lib/jwt';
import { nanoid } from 'nanoid';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb();
    const { id: wishlistId } = await params;
    
    // Get the wishlist
    const wishlist = await db.collection('wishlists').findOne({
      _id: new ObjectId(wishlistId),
    });
    
    if (!wishlist) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      );
    }
    
    // If wishlist doesn't have a share token, generate one
    if (!wishlist.shareToken) {
      const shareToken = nanoid(32);
      await db.collection('wishlists').updateOne(
        { _id: new ObjectId(wishlistId) },
        { 
          $set: { 
            shareToken,
            updatedAt: new Date()
          }
        }
      );
      wishlist.shareToken = shareToken;
    }
    
    // Check for view permissions
    const userId = await getUserIdFromToken();
    const cookieStore = await cookies();
    const ownerTokenCookie = cookieStore.get(`owner_${wishlistId}`)?.value;
    
    // Get share token from URL if present
    const url = new URL(request.url);
    const shareToken = url.searchParams.get('token');
    
    // Determine if the user has edit rights
    const canEdit = 
      // Authenticated user is the creator
      (userId && wishlist.userId === userId) ||
      // Anonymous creator with valid owner token
      (!userId && wishlist.ownerToken && ownerTokenCookie === wishlist.ownerToken) ||
      // Public editable wishlist
      (wishlist.allowEdits);
      
    // Determine if user can view
    const canView = 
      canEdit || 
      wishlist.isPublic ||
      (shareToken && shareToken === wishlist.shareToken);
      
    if (!canView) {
      return NextResponse.json(
        { error: 'You do not have permission to view this wishlist' },
        { status: 403 }
      );
    }
    
    // Add user permissions to the response
    return NextResponse.json({
      ...wishlist,
      _id: wishlist._id.toString(),
      userPermissions: {
        canEdit,
        isOwner: (userId && wishlist.userId === userId) || 
                (!userId && wishlist.ownerToken && ownerTokenCookie === wishlist.ownerToken),
      }
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb();
    const wishlistId = params.id;
    const body = await request.json();
    
    // Check for edit permissions
    const userId = await getUserIdFromToken();
    const cookieStore = await cookies();
    const ownerTokenCookie = cookieStore.get(`owner_${wishlistId}`)?.value;
    
    // Get the wishlist to check permissions
    const wishlist = await db.collection('wishlists').findOne({
      _id: new ObjectId(wishlistId),
    });
    
    if (!wishlist) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      );
    }
    
    // Check if user has edit rights
    const canEdit = 
      // Authenticated user is the creator
      (userId && wishlist.userId === userId) ||
      // Anonymous creator with valid owner token
      (!userId && wishlist.ownerToken && ownerTokenCookie === wishlist.ownerToken) ||
      // Public editable wishlist
      (wishlist.allowEdits);
      
    if (!canEdit) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this wishlist' },
        { status: 403 }
      );
    }
    
    // Handle claiming a wishlist when a user signs in
    if (userId && !wishlist.userId && body.claimWishlist) {
      await db.collection('wishlists').updateOne(
        { _id: new ObjectId(wishlistId) },
        { 
          $set: { 
            userId,
            ownerToken: null, // Remove the temporary token
            updatedAt: new Date(),
          }
        }
      );
      
      // Return updated wishlist
      const updatedWishlist = await db.collection('wishlists').findOne({
        _id: new ObjectId(wishlistId),
      });
      
      if (!updatedWishlist) {
        return NextResponse.json(
          { error: 'Failed to retrieve updated wishlist' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        ...updatedWishlist,
        _id: updatedWishlist._id.toString(),
        userPermissions: {
          canEdit: true,
          isOwner: true,
        }
      });
    }
    
    // Regular update operation
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.allowEdits !== undefined) updateData.allowEdits = body.allowEdits;
    
    // Only the actual owner can change these settings
    const isOwner = (userId && wishlist.userId === userId) || 
      (!userId && wishlist.ownerToken && ownerTokenCookie === wishlist.ownerToken);
      
    if (!isOwner && (body.isPublic !== undefined || body.allowEdits !== undefined)) {
      return NextResponse.json(
        { error: 'Only the wishlist owner can change privacy settings' },
        { status: 403 }
      );
    }
    
    await db.collection('wishlists').updateOne(
      { _id: new ObjectId(wishlistId) },
      { $set: updateData }
    );
    
    // Return updated wishlist
    const updatedWishlist = await db.collection('wishlists').findOne({
      _id: new ObjectId(wishlistId),
    });
    
    if (!updatedWishlist) {
      return NextResponse.json(
        { error: 'Failed to retrieve updated wishlist' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      ...updatedWishlist,
      _id: updatedWishlist._id.toString(),
      userPermissions: {
        canEdit,
        isOwner,
      }
    });
  } catch (error) {
    console.error('Error updating wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to update wishlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb();
    const wishlistId = params.id;
    
    // Check for delete permissions (only owner can delete)
    const userId = await getUserIdFromToken();
    const cookieStore = await cookies();
    const ownerTokenCookie = cookieStore.get(`owner_${wishlistId}`)?.value;
    
    // Get the wishlist to check permissions
    const wishlist = await db.collection('wishlists').findOne({
      _id: new ObjectId(wishlistId),
    });
    
    if (!wishlist) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the owner
    const isOwner = (userId && wishlist.userId === userId) || 
      (!userId && wishlist.ownerToken && ownerTokenCookie === wishlist.ownerToken);
      
    if (!isOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this wishlist' },
        { status: 403 }
      );
    }
    
    // Delete the wishlist
    await db.collection('wishlists').deleteOne({
      _id: new ObjectId(wishlistId),
    });
    
    return NextResponse.json({
      message: 'Wishlist deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete wishlist' },
      { status: 500 }
    );
  }
} 