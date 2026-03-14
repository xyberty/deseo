import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revokeSession } from '@/app/lib/sessions';

// Force Node.js runtime (required for MongoDB driver)
export const runtime = 'nodejs';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    // Revoke the session in the DB so the token is immediately invalidated,
    // even if the cookie were somehow replayed before it expires.
    if (token) {
      await revokeSession(token);
    }

    const response = NextResponse.json({ message: 'Signed out successfully' });

    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Error signing out:', error);
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    );
  }
}
