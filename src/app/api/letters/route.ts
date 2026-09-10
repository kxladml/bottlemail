export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getPublicLetters, getTotalLetterCount, insertLetter, getLetterById } from '@/lib/db';
import { hashEmail, encryptEmail, normalizeEmail } from '@/lib/crypto';
import { checkContentSafety } from '@/lib/safety';
import crypto from 'crypto';

const MAX_NOTEBOOK_CHARS = 500;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const letterId = searchParams.get('id');
    if (letterId) {
      const letter = await getLetterById(letterId);
      if (!letter) {
        return NextResponse.json({ error: 'Bottle not found or was swallowed by the sea' }, { status: 404 });
      }
      return NextResponse.json({ letter });
    }

    const filter = (searchParams.get('filter') as 'all' | 'text' | 'draw') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    const letters = await getPublicLetters(limit, offset, filter);
    const totalCount = await getTotalLetterCount();

    return NextResponse.json({
      letters,
      totalCount,
      limit,
      offset,
      hasMore: offset + letters.length < totalCount,
    });
  } catch (error: any) {
    console.error('Error fetching letters:', error);
    return NextResponse.json({ error: 'Failed to fetch letters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientEmail, contentType, contentText, drawingData, paperStyle, fontStyle } = body;

    if (!recipientEmail || typeof recipientEmail !== 'string') {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    }

    const normalizedRecipient = normalizeEmail(recipientEmail);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedRecipient)) {
      return NextResponse.json({ error: 'Please enter a valid recipient email address' }, { status: 400 });
    }

    if (contentType !== 'text' && contentType !== 'draw') {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    let sanitizedText: string | null = null;
    let sanitizedDrawing: string | null = null;

    if (contentType === 'text') {
      if (!contentText || typeof contentText !== 'string' || contentText.trim().length === 0) {
        return NextResponse.json({ error: 'Letter text cannot be empty' }, { status: 400 });
      }

      if (contentText.length > MAX_NOTEBOOK_CHARS) {
        return NextResponse.json({
          error: `Letter exceeds a single notebook page capacity (maximum ${MAX_NOTEBOOK_CHARS} characters). Please condense your thoughts.`
        }, { status: 400 });
      }

      const safety = checkContentSafety(contentText);
      if (!safety.isSafe) {
        return NextResponse.json({
          error: safety.reason,
          category: safety.category,
          crisisSupport: safety.crisisSupport,
        }, { status: 400 });
      }

      sanitizedText = safety.censoredText || contentText.trim();
    } else {
      if (!drawingData || typeof drawingData !== 'string' || !drawingData.startsWith('data:image/')) {
        return NextResponse.json({ error: 'Please draw something on the page before sending' }, { status: 400 });
      }

      if (drawingData.length > 350000) {
        return NextResponse.json({ error: 'Drawing data exceeds page size limits' }, { status: 400 });
      }

      sanitizedDrawing = drawingData;
    }

    const recipientHash = hashEmail(normalizedRecipient);
    const recipientEncrypted = encryptEmail(normalizedRecipient);

    const letterId = crypto.randomUUID();
    const now = Date.now();

    await insertLetter({
      id: letterId,
      recipient_hash: recipientHash,
      recipient_encrypted: recipientEncrypted,
      content_type: contentType,
      content_text: sanitizedText,
      drawing_data: sanitizedDrawing,
      paper_style: paperStyle || 'white',
      font_style: fontStyle || 'mono',
      created_at: now,
    });

    return NextResponse.json({
      success: true,
      message: 'Your bottle has been cast into the ocean.',
      letterId,
    });
  } catch (error: any) {
    console.error('Error creating letter:', error);
    return NextResponse.json({ error: 'Failed to cast letter into bottlemail' }, { status: 500 });
  }
}
