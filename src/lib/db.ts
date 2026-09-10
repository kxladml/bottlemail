import { createClient, Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';

let client: Client;

function getClient(): Client {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL || 'file:data/bottlemail.db';
  const authToken = process.env.TURSO_AUTH_TOKEN;

  // If local file, ensure data directory exists
  if (url.startsWith('file:')) {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  client = createClient({
    url,
    authToken,
  });

  return client;
}

let tablesInitialized = false;

export async function initDb(): Promise<void> {
  if (tablesInitialized) return;
  const db = getClient();

  await db.batch([
    `CREATE TABLE IF NOT EXISTS letters (
      id TEXT PRIMARY KEY,
      recipient_hash TEXT NOT NULL,
      recipient_encrypted TEXT NOT NULL,
      content_type TEXT NOT NULL,
      content_text TEXT,
      drawing_data TEXT,
      paper_style TEXT NOT NULL DEFAULT 'white',
      font_style TEXT NOT NULL DEFAULT 'mono',
      created_at INTEGER NOT NULL,
      is_reported INTEGER NOT NULL DEFAULT 0
    );`,
    `CREATE INDEX IF NOT EXISTS idx_letters_recipient_hash ON letters(recipient_hash);`,
    `CREATE INDEX IF NOT EXISTS idx_letters_created_at ON letters(created_at DESC);`,
    `CREATE TABLE IF NOT EXISTS otp_codes (
      email_hash TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      email_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS idx_sessions_email_hash ON sessions(email_hash);`
  ], 'write');

  tablesInitialized = true;
}

export interface PublicLetter {
  id: string;
  content_type: 'text' | 'draw';
  content_text: string | null;
  drawing_data: string | null;
  paper_style: string;
  font_style: string;
  created_at: number;
}

export async function getPublicLetters(limit = 40, offset = 0, filter?: 'all' | 'text' | 'draw'): Promise<PublicLetter[]> {
  await initDb();
  const db = getClient();

  let query = `
    SELECT id, content_type, content_text, drawing_data, paper_style, font_style, created_at
    FROM letters
    WHERE is_reported = 0
  `;
  const args: any[] = [];

  if (filter === 'text') {
    query += ` AND content_type = 'text'`;
  } else if (filter === 'draw') {
    query += ` AND content_type = 'draw'`;
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  args.push(limit, offset);

  const res = await db.execute({ sql: query, args });
  return res.rows.map((row) => ({
    id: String(row.id),
    content_type: row.content_type as 'text' | 'draw',
    content_text: row.content_text ? String(row.content_text) : null,
    drawing_data: row.drawing_data ? String(row.drawing_data) : null,
    paper_style: String(row.paper_style),
    font_style: String(row.font_style),
    created_at: Number(row.created_at),
  }));
}

export async function getTotalLetterCount(): Promise<number> {
  await initDb();
  const db = getClient();
  const res = await db.execute('SELECT COUNT(*) as count FROM letters WHERE is_reported = 0');
  const count = res.rows[0]?.count;
  return count !== undefined ? Number(count) : 0;
}

export async function getLetterById(id: string): Promise<PublicLetter | null> {
  await initDb();
  const db = getClient();
  const res = await db.execute({
    sql: 'SELECT id, content_type, content_text, drawing_data, paper_style, font_style, created_at FROM letters WHERE id = ? AND is_reported = 0',
    args: [id],
  });

  const row = res.rows[0];
  if (!row) return null;

  return {
    id: String(row.id),
    content_type: row.content_type as 'text' | 'draw',
    content_text: row.content_text ? String(row.content_text) : null,
    drawing_data: row.drawing_data ? String(row.drawing_data) : null,
    paper_style: String(row.paper_style),
    font_style: String(row.font_style),
    created_at: Number(row.created_at),
  };
}

export async function insertLetter(letter: {
  id: string;
  recipient_hash: string;
  recipient_encrypted: string;
  content_type: 'text' | 'draw';
  content_text: string | null;
  drawing_data: string | null;
  paper_style: string;
  font_style: string;
  created_at: number;
}): Promise<void> {
  await initDb();
  const db = getClient();
  await db.execute({
    sql: `INSERT INTO letters (id, recipient_hash, recipient_encrypted, content_type, content_text, drawing_data, paper_style, font_style, created_at, is_reported)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    args: [
      letter.id,
      letter.recipient_hash,
      letter.recipient_encrypted,
      letter.content_type,
      letter.content_text,
      letter.drawing_data,
      letter.paper_style,
      letter.font_style,
      letter.created_at,
    ],
  });
}

export async function getInboxLetters(recipientHash: string): Promise<PublicLetter[]> {
  await initDb();
  const db = getClient();
  const res = await db.execute({
    sql: `SELECT id, content_type, content_text, drawing_data, paper_style, font_style, created_at
          FROM letters
          WHERE recipient_hash = ?
          ORDER BY created_at DESC`,
    args: [recipientHash],
  });

  return res.rows.map((row) => ({
    id: String(row.id),
    content_type: row.content_type as 'text' | 'draw',
    content_text: row.content_text ? String(row.content_text) : null,
    drawing_data: row.drawing_data ? String(row.drawing_data) : null,
    paper_style: String(row.paper_style),
    font_style: String(row.font_style),
    created_at: Number(row.created_at),
  }));
}

export async function saveOtp(emailHash: string, code: string, expiresInMs = 10 * 60 * 1000): Promise<void> {
  await initDb();
  const db = getClient();
  const now = Date.now();
  const expiresAt = now + expiresInMs;

  await db.execute({
    sql: `INSERT INTO otp_codes (email_hash, code, expires_at, attempts, created_at)
          VALUES (?, ?, ?, 0, ?)
          ON CONFLICT(email_hash) DO UPDATE SET
            code = excluded.code,
            expires_at = excluded.expires_at,
            attempts = 0,
            created_at = excluded.created_at`,
    args: [emailHash, code, expiresAt, now],
  });
}

export async function verifyOtp(emailHash: string, inputCode: string): Promise<{ success: boolean; reason?: string }> {
  await initDb();
  const db = getClient();
  const res = await db.execute({
    sql: 'SELECT * FROM otp_codes WHERE email_hash = ?',
    args: [emailHash],
  });

  const row = res.rows[0];
  if (!row) {
    return { success: false, reason: 'No verification code requested for this email' };
  }

  const now = Date.now();
  if (now > Number(row.expires_at)) {
    await db.execute({ sql: 'DELETE FROM otp_codes WHERE email_hash = ?', args: [emailHash] });
    return { success: false, reason: 'Verification code has expired. Please request a new code.' };
  }

  if (Number(row.attempts) >= 5) {
    await db.execute({ sql: 'DELETE FROM otp_codes WHERE email_hash = ?', args: [emailHash] });
    return { success: false, reason: 'Too many incorrect attempts. Please request a new code.' };
  }

  if (String(row.code) !== inputCode.trim()) {
    await db.execute({
      sql: 'UPDATE otp_codes SET attempts = attempts + 1 WHERE email_hash = ?',
      args: [emailHash],
    });
    return { success: false, reason: 'Invalid 6-digit code. Please check and try again.' };
  }

  await db.execute({ sql: 'DELETE FROM otp_codes WHERE email_hash = ?', args: [emailHash] });
  return { success: true };
}

export async function createSession(token: string, emailHash: string, expiresInMs = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  await initDb();
  const db = getClient();
  const expiresAt = Date.now() + expiresInMs;
  await db.execute({
    sql: 'INSERT INTO sessions (token, email_hash, expires_at) VALUES (?, ?, ?)',
    args: [token, emailHash, expiresAt],
  });
}

export async function getSession(token: string): Promise<{ emailHash: string } | null> {
  await initDb();
  const db = getClient();
  const res = await db.execute({
    sql: 'SELECT * FROM sessions WHERE token = ?',
    args: [token],
  });

  const row = res.rows[0];
  if (!row) return null;

  if (Date.now() > Number(row.expires_at)) {
    await db.execute({ sql: 'DELETE FROM sessions WHERE token = ?', args: [token] });
    return null;
  }

  return { emailHash: String(row.email_hash) };
}

export async function deleteSession(token: string): Promise<void> {
  await initDb();
  const db = getClient();
  await db.execute({ sql: 'DELETE FROM sessions WHERE token = ?', args: [token] });
}
