import { NextResponse } from 'next/server';
import { signToken } from '@/app/lib/jwt';
import { sendMagicLink } from '@/app/lib/email';
import { rateLimit } from '@/app/lib/rate-limit';

// Force Node.js runtime (required for jsonwebtoken)
export const runtime = 'nodejs';

// Create a rate limiter that allows 5 requests per 15 minutes
const limiter = rateLimit({
  interval: 60 * 1000 * 15, // 15 minutes
  uniqueTokenPerInterval: 500,
});

export async function POST(request: Request) {
  try {
    // Apply rate limiting
    await limiter.check(5, "send-magic-link");
  } catch {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  try {
    const { email } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const token = signToken({ email });
    const magicLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify-magic-link?token=${token}`;

    await sendMagicLink(email, magicLink);

    return NextResponse.json({ message: "Magic link sent successfully" });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: "Failed to send magic link" },
      { status: 500 }
    );
  }
} 