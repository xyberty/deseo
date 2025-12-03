import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';
import { headers } from 'next/headers';

// Force Node.js runtime
export const runtime = 'nodejs';

// GET: Redirect short code to full wishlist URL with tracking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const resolvedParams = await params;
    const shortCode = resolvedParams.shortCode;
    
    const db = await getDb();
    
    // Find the short link (case-sensitive match)
    const shortLink = await db.collection('shortLinks').findOne({
      shortCode: shortCode,
    });
    
    if (!shortLink) {
      // Redirect to home page or show 404
      return NextResponse.redirect(
        new URL('/', request.url),
        302
      );
    }
    
    // Verify wishlist still exists
    let wishlistId: string;
    try {
      // wishlistId might be stored as string or ObjectId
      wishlistId = typeof shortLink.wishlistId === 'string' 
        ? shortLink.wishlistId 
        : shortLink.wishlistId.toString();
      
      const wishlist = await db.collection('wishlists').findOne({
        _id: new ObjectId(wishlistId),
      });
      
      if (!wishlist) {
        return NextResponse.redirect(
          new URL('/', request.url),
          302
        );
      }
    } catch (error) {
      console.error('[Short Link Redirect] Error finding wishlist:', error);
      return NextResponse.redirect(
        new URL('/', request.url),
        302
      );
    }
    
    // Track the click
    const headersList = await headers();
    const referer = headersList.get('referer') || undefined;
    const userAgent = headersList.get('user-agent') || undefined;
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || 
                      headersList.get('x-real-ip') || 
                      undefined;
    
    await db.collection('shortLinkClicks').insertOne({
      shortCode: shortCode,
      wishlistId: wishlistId,
      clickedAt: new Date(),
      referer,
      userAgent,
      ipAddress, // Note: Consider privacy implications in production
    });
    
    // Build the full URL with share token
    // Use the request URL's origin to preserve the correct port
    const requestUrl = new URL(request.url);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${requestUrl.protocol}//${requestUrl.host}`;
    const fullUrl = `${baseUrl}/wishlist/${wishlistId}?token=${shortLink.shareToken}`;
    
    // Redirect to the full wishlist URL
    return NextResponse.redirect(fullUrl, 302);
  } catch (error) {
    console.error('[Short Link Redirect] Error redirecting short link:', error);
    // On error, redirect to home
    return NextResponse.redirect(
      new URL('/', request.url),
      302
    );
  }
}

