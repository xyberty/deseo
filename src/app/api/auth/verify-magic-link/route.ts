import { NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/jwt';
import { getDb } from '@/app/lib/mongodb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 400 }
    );
  }

  try {
    const decoded = verifyToken(token);
    const email = decoded.email;

    const db = await getDb();
    
    // Check if user exists; if not, create one (lazy registration)
    const existingUser = await db.collection("users").findOne({ email });
    if (!existingUser) {
      await db.collection("users").insertOne({ 
        email, 
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      // Update last login
      await db.collection("users").updateOne(
        { email },
        { $set: { lastLogin: new Date(), updatedAt: new Date() } }
      );
    }

    // Create response with redirect
    const response = NextResponse.redirect(new URL('/dashboard', request.url));

    // Set secure cookie with proper attributes
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Magic link verification error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid or expired token" },
      { status: 400 }
    );
  }
} 