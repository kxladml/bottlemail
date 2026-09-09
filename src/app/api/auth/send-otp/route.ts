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

    // If Resend API Key is provided, send real email
    if (process.env.RESEND_API_KEY) {
      try {
        const fromEmail = process.env.EMAIL_FROM || 'bottlemail <onboarding@resend.dev>';
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [normalized],
            subject: 'Your bottlemail verification code: ' + otp,
            text: `Your 6-digit bottlemail verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
            html: `
              <div style="font-family: ui-monospace, 'Courier New', monospace; padding: 24px; border: 2px solid #000; max-width: 440px; background: #fff; color: #000;">
                <div style="border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px;">
                  <h2 style="margin: 0; font-size: 16px; letter-spacing: 1px; text-transform: uppercase;">[+] BOTTLEMAIL ARCHIVE</h2>
                </div>
                <p style="font-size: 13px; line-height: 1.5;">Letters have washed ashore for your email address.</p>
                <p style="font-size: 12px; color: #555;">Use this one-time passcode (OTP) to unlock your private inbox:</p>
                <div style="border: 2px solid #000; background: #f4f4f5; padding: 14px; text-align: center; font-size: 26px; font-weight: bold; letter-spacing: 8px; margin: 16px 0;">
                  ${otp}
                </div>
                <p style="font-size: 11px; color: #777; margin-top: 16px; border-top: 1px dashed #aaa; pt: 8px;">
                  Valid for 10 minutes. If you did not request this, you can safely ignore this message.
                </p>
              </div>
            `,
          }),
        });

        if (!emailRes.ok) {
          const errData = await emailRes.text();
          console.error('Resend API error:', errData);
        }
      } catch (mailErr) {
        console.error('Error dispatching via Resend:', mailErr);
      }
    }

    console.log(`\n========================================`);
    console.log(`[BOTTLEMAIL OTP AUTH]`);
    console.log(`Recipient: ${normalized}`);
    console.log(`6-digit Code: ${otp}`);
    console.log(`Expires in: 10 minutes`);
    console.log(`========================================\n`);

    // In local development or when no Resend key is set, expose devOtp for instant testing
    const showDevOtp = !process.env.RESEND_API_KEY || process.env.NODE_ENV !== 'production';

    return NextResponse.json({
      success: true,
      message: 'Verification code generated.',
      devOtp: showDevOtp ? otp : undefined,
    });
  } catch (error: any) {
    console.error('Error in send-otp:', error);
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
  }
}
