import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/sessions';

// Force Node.js runtime (required for MongoDB driver)
export const runtime = 'nodejs';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    // Verify against the DB sessions collection instead of decoding a JWT.
    // This means expiry is enforced server-side regardless of cookie maxAge,
    // and sessions can be revoked instantly on sign-out.
    const session = await getSession(token);

    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({ authenticated: true, email: session.email });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json({ authenticated: false });
  }
}
