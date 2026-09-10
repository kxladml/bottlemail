export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSession, getInboxLetters } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('bottlemail_session');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Please log in to view your inbox' }, { status: 401 });
    }

    const session = await getSession(sessionCookie.value);
    if (!session) {
      return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
    }

    const letters = await getInboxLetters(session.emailHash);

    return NextResponse.json({
      letters,
      count: letters.length,
    });
  } catch (error: any) {
    console.error('Error fetching inbox:', error);
    return NextResponse.json({ error: 'Failed to retrieve inbox' }, { status: 500 });
  }
}
