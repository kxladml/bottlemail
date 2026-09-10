export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('bottlemail_session');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false });
    }

    const session = await getSession(sessionCookie.value);
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false });
  }
}
