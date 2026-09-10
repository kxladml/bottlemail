export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { hashEmail, generateOtp, normalizeEmail } from '@/lib/crypto';
import { saveOtp } from '@/lib/db';
import nodemailer from 'nodemailer';

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

    await saveOtp(emailHash, otp);

    const emailSubject = 'Your bottlemail code: ' + otp;
    const emailHtml = `
      <div style="font-family: ui-monospace, 'Courier New', monospace; padding: 24px; border: 2px solid #000; max-width: 440px; background: #fff; color: #000;">
        <div style="border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 16px; letter-spacing: 1px; text-transform: uppercase;">[+] BOTTLEMAIL ARCHIVE</h2>
        </div>
        <p style="font-size: 13px; line-height: 1.5;">A bottle has drifted ashore for your email address.</p>
        <p style="font-size: 12px; color: #555;">Use this one-time passcode (OTP) to unlock your private inbox:</p>
        <div style="border: 2px solid #000; background: #f4f4f5; padding: 14px; text-align: center; font-size: 26px; font-weight: bold; letter-spacing: 8px; margin: 16px 0;">
          ${otp}
        </div>
        <p style="font-size: 11px; color: #777; margin-top: 16px; border-top: 1px dashed #aaa; padding-top: 8px;">
          Valid for 10 minutes. If you did not request this, you can safely ignore this message.
        </p>
      </div>
    `;

    let emailDispatched = false;

    // 1. Resend API
    if (process.env.RESEND_API_KEY) {
      try {
        const fromEmail = process.env.EMAIL_FROM || 'bottlemail <onboarding@resend.dev>';
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [normalized],
            subject: emailSubject,
            text: `Your 6-digit bottlemail verification code is: ${otp}\n\nExpires in 10 minutes.`,
            html: emailHtml,
          }),
        });
        if (res.ok) emailDispatched = true;
        else console.error('Resend error:', await res.text());
      } catch (err) {
        console.error('Resend dispatch error:', err);
      }
    }

    // 2. Brevo API (formerly Sendinblue)
    if (!emailDispatched && process.env.BREVO_API_KEY) {
      try {
        const fromEmail = process.env.EMAIL_FROM || 'letters@tossbottle.online';
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
          },
          body: JSON.stringify({
            sender: { name: 'bottlemail', email: fromEmail },
            to: [{ email: normalized }],
            subject: emailSubject,
            htmlContent: emailHtml,
          }),
        });
        if (res.ok) {
          emailDispatched = true;
        } else {
          const errText = await res.text();
          console.error('Brevo API error response:', errText);
        }
      } catch (err) {
        console.error('Brevo dispatch error:', err);
      }
    }

    // 3. Hostinger or Custom SMTP (nodemailer)
    if (!emailDispatched && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 465,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || `bottlemail <${process.env.SMTP_USER}>`,
          to: normalized,
          subject: emailSubject,
          text: `Your 6-digit bottlemail verification code is: ${otp}\n\nExpires in 10 minutes.`,
          html: emailHtml,
        });
        emailDispatched = true;
      } catch (err) {
        console.error('SMTP dispatch error:', err);
      }
    }

    // Security: NEVER return devOtp in production
    const isDevOnly = process.env.NODE_ENV === 'development' && process.env.ENABLE_DEV_OTP === 'true';

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email address.',
      devOtp: isDevOnly ? otp : undefined,
    });
  } catch (error: any) {
    console.error('Error in send-otp:', error);
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
  }
}
