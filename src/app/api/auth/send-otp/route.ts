export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { hashEmail, generateOtp, normalizeEmail } from '@/lib/crypto';
import { saveOtp } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
    }

    const normalized = normalizeEmail(email);
    const emailHash = hashEmail(normalized);
    const otp = generateOtp();

    // Save to database with 10-minute expiry
    saveOtp(emailHash, otp);

    // In a production app with SMTP/Resend configured, we would send an actual email here:
    // await sendEmailWithResend(normalized, otp);
    console.log(`\n========================================`);
    console.log(`[BOTTLEMAIL OTP AUTH]`);
    console.log(`Recipient: ${normalized}`);
    console.log(`6-digit Code: ${otp}`);
    console.log(`Expires in: 10 minutes`);
    console.log(`========================================\n`);

    return NextResponse.json({
      success: true,
      message: 'Verification code generated.',
      // Providing devOtp in the response allows instant preview/testing without external mail services
      devOtp: otp,
    });
  } catch (error: any) {
    console.error('Error in send-otp:', error);
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
  }
}
