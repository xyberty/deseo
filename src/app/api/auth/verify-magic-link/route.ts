import { NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/jwt';
import { getDb } from '@/app/lib/mongodb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: "Token is required" },
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
    
    // Handle specific JWT errors
    if (error instanceof Error) {
      if (error.message === 'Token has expired') {
        return NextResponse.json(
          { error: "This magic link has expired. Please request a new one." },
          { status: 400 }
        );
      }
      if (error.message === 'Invalid token') {
        return NextResponse.json(
          { error: "Invalid magic link. Please request a new one." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to verify magic link" },
      { status: 500 }
    );
  }
} 