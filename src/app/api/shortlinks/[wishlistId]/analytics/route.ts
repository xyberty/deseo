import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { verifyToken } from '@/app/lib/jwt';

// Force Node.js runtime
export const runtime = 'nodejs';

// Helper to extract user ID from auth token
async function getUserIdFromToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = verifyToken(token);
    return decoded.email;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// GET: Get analytics for a wishlist's short link
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wishlistId: string }> }
) {
  try {
    const db = await getDb();
    const { wishlistId } = await params;
    
    // Verify ownership
    const userId = await getUserIdFromToken();
    const cookieStore = await cookies();
    const ownerTokenCookie = cookieStore.get(`owner_${wishlistId}`)?.value;
    
    const wishlist = await db.collection('wishlists').findOne({
      _id: new ObjectId(wishlistId),
    });
    
    if (!wishlist) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      );
    }
    
    const isOwner = (userId && wishlist.userId === userId) || 
      (!userId && wishlist.ownerToken && ownerTokenCookie === wishlist.ownerToken);
    
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get short link
    const shortLink = await db.collection('shortLinks').findOne({
      wishlistId: wishlistId,
    });
    
    if (!shortLink) {
      return NextResponse.json({
        shortCode: null,
        totalClicks: 0,
        clicksByDate: [],
        recentClicks: [],
      });
    }
    
    // Get all clicks for this short code
    const allClicks = await db.collection('shortLinkClicks')
      .find({ shortCode: shortLink.shortCode })
      .sort({ clickedAt: -1 })
      .toArray();
    
    // Calculate clicks by date
    const clicksByDateMap = new Map<string, number>();
    allClicks.forEach(click => {
      const date = new Date(click.clickedAt).toISOString().split('T')[0]; // YYYY-MM-DD
      clicksByDateMap.set(date, (clicksByDateMap.get(date) || 0) + 1);
    });
    
    const clicksByDate = Array.from(clicksByDateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Get recent clicks (last 20)
    const recentClicks = allClicks.slice(0, 20).map(click => ({
      clickedAt: click.clickedAt,
      referer: click.referer,
      userAgent: click.userAgent,
    }));
    
    return NextResponse.json({
      shortCode: shortLink.shortCode,
      totalClicks: allClicks.length,
      clicksByDate,
      recentClicks,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

