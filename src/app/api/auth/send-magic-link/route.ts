import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { signToken } from '@/app/lib/jwt';
import nodemailer from 'nodemailer';
import { rateLimit } from '@/app/lib/rate-limit';

// Create a rate limiter that allows 5 requests per 15 minutes
const limiter = rateLimit({
  interval: 60 * 1000 * 15, // 15 minutes
  uniqueTokenPerInterval: 500,
});

export async function POST(request: Request) {
  try {
    // Apply rate limiting
    await limiter.check(5, "send-magic-link");
  } catch (error) {
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

    // Setup email transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email template
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to Deseo App!</h1>
        <p>Click the button below to sign in to your account:</p>
        <a href="${magicLink}" 
           style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          Sign In
        </a>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 15 minutes. If you didn't request this email, you can safely ignore it.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: '"Deseo App" <no-reply@deseo.app>',
      to: email,
      subject: "Sign in to Deseo App",
      text: `Click here to sign in: ${magicLink}`,
      html: emailHtml,
    });

    return NextResponse.json({ message: "Magic link sent successfully" });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: "Failed to send magic link" },
      { status: 500 }
    );
  }
} 