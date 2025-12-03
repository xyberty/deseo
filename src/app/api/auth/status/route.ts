import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/app/lib/jwt';

// Force Node.js runtime (required for jsonwebtoken)
export const runtime = 'nodejs';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ authenticated: false });
    }
    
    try {
      verifyToken(token);
      return NextResponse.json({ authenticated: true });
    } catch {
      // Token is invalid or expired
      return NextResponse.json({ authenticated: false });
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json({ authenticated: false });
  }
}

