import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';

// Force Node.js runtime
export const runtime = 'nodejs';

// GET: Debug endpoint to check if a short code exists
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const shortCode = searchParams.get('code');
    
    if (!shortCode) {
      return NextResponse.json(
        { error: 'Missing code parameter. Use ?code=YOUR_CODE' },
        { status: 400 }
      );
    }
    
    // Find the short link
    const shortLink = await db.collection('shortLinks').findOne({
      shortCode: shortCode,
    });
    
    if (!shortLink) {
      // Check if there are any similar codes (case-insensitive)
      const similarCodes = await db.collection('shortLinks')
        .find({
          shortCode: { $regex: new RegExp(shortCode, 'i') }
        })
        .limit(5)
        .toArray();
      
      return NextResponse.json({
        exists: false,
        message: 'Short code not found',
        searchedCode: shortCode,
        similarCodes: similarCodes.map(sl => sl.shortCode),
      });
    }
    
    // Get wishlist info
    const wishlistId = typeof shortLink.wishlistId === 'string' 
      ? shortLink.wishlistId 
      : shortLink.wishlistId.toString();
    
    const wishlist = await db.collection('wishlists').findOne({
      _id: new ObjectId(wishlistId),
    });
    
    return NextResponse.json({
      exists: true,
      shortCode: shortLink.shortCode,
      wishlistId: shortLink.wishlistId,
      wishlistExists: !!wishlist,
      wishlistTitle: wishlist?.title,
      shareToken: shortLink.shareToken ? 'exists' : 'missing',
      customCode: shortLink.customCode || false,
      createdAt: shortLink.createdAt,
    });
  } catch (error) {
    console.error('Error debugging short link:', error);
    return NextResponse.json(
      { error: 'Failed to debug short link', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

