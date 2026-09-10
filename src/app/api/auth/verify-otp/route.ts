export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { hashEmail, generateSessionToken, normalizeEmail } from '@/lib/crypto';
import { verifyOtp, createSession } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and 6-digit code are required' }, { status: 400 });
    }

    const normalized = normalizeEmail(email);
    const emailHash = hashEmail(normalized);

    const verification = await verifyOtp(emailHash, code);
    if (!verification.success) {
      return NextResponse.json({ error: verification.reason || 'Invalid code' }, { status: 401 });
    }

    const token = generateSessionToken();
    await createSession(token, emailHash);

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
    });

    response.cookies.set('bottlemail_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Error in verify-otp:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
