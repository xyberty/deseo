import nodemailer from 'nodemailer';

// Create a reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to,
      subject,
      text,
      html,
    });

    return info;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

export async function sendMagicLink(email: string, magicLink: string) {
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

  return sendEmail({
    to: email,
    subject: "Sign in to Deseo App",
    text: `Click here to sign in: ${magicLink}`,
    html: emailHtml,
  });
} 