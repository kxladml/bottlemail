export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('bottlemail_session');
    if (sessionCookie && sessionCookie.value) {
      await deleteSession(sessionCookie.value);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('bottlemail_session');
    return response;
  } catch (error) {
    return NextResponse.json({ success: true });
  }
}
