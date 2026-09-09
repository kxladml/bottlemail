import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'bottlemail.db');

// Global singleton to prevent multiple instances in development and build workers
declare global {
  // eslint-disable-next-line no-var
  var __bottlemailDb: Database.Database | undefined;
}

function getDatabase(): Database.Database {
  if (global.__bottlemailDb) {
    return global.__bottlemailDb;
  }

  const db = new Database(dbPath, { timeout: 10000 });
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 10000');

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS letters (
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
      );

      CREATE INDEX IF NOT EXISTS idx_letters_recipient_hash ON letters(recipient_hash);
      CREATE INDEX IF NOT EXISTS idx_letters_created_at ON letters(created_at DESC);

      CREATE TABLE IF NOT EXISTS otp_codes (
        email_hash TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        email_hash TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_email_hash ON sessions(email_hash);
    `);
  } catch (err: any) {
    if (err.code !== 'SQLITE_BUSY') {
      console.warn('Database initialization note:', err.message);
    }
  }

  global.__bottlemailDb = db;
  return db;
}

const db = getDatabase();

export interface LetterRecord {
  id: string;
  recipient_hash: string;
  recipient_encrypted: string;
  content_type: 'text' | 'draw';
  content_text: string | null;
  drawing_data: string | null;
  paper_style: string;
  font_style: string;
  created_at: number;
  is_reported: number;
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

export function getPublicLetters(limit = 40, offset = 0, filter?: 'all' | 'text' | 'draw'): PublicLetter[] {
  const conn = getDatabase();
  let query = `
    SELECT id, content_type, content_text, drawing_data, paper_style, font_style, created_at
    FROM letters
    WHERE is_reported = 0
  `;
  const params: any[] = [];

  if (filter === 'text') {
    query += ` AND content_type = 'text'`;
  } else if (filter === 'draw') {
    query += ` AND content_type = 'draw'`;
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  return conn.prepare(query).all(...params) as PublicLetter[];
}

export function getTotalLetterCount(): number {
  const conn = getDatabase();
  const row = conn.prepare('SELECT COUNT(*) as count FROM letters WHERE is_reported = 0').get() as { count: number };
  return row?.count || 0;
}

export function insertLetter(letter: {
  id: string;
  recipient_hash: string;
  recipient_encrypted: string;
  content_type: 'text' | 'draw';
  content_text: string | null;
  drawing_data: string | null;
  paper_style: string;
  font_style: string;
  created_at: number;
}): void {
  const conn = getDatabase();
  const stmt = conn.prepare(`
    INSERT INTO letters (id, recipient_hash, recipient_encrypted, content_type, content_text, drawing_data, paper_style, font_style, created_at, is_reported)
    VALUES (@id, @recipient_hash, @recipient_encrypted, @content_type, @content_text, @drawing_data, @paper_style, @font_style, @created_at, 0)
  `);
  stmt.run(letter);
}

export function getInboxLetters(recipientHash: string): PublicLetter[] {
  const conn = getDatabase();
  const stmt = conn.prepare(`
    SELECT id, content_type, content_text, drawing_data, paper_style, font_style, created_at
    FROM letters
    WHERE recipient_hash = ?
    ORDER BY created_at DESC
  `);
  return stmt.all(recipientHash) as PublicLetter[];
}

export function saveOtp(emailHash: string, code: string, expiresInMs = 10 * 60 * 1000): void {
  const conn = getDatabase();
  const now = Date.now();
  const expiresAt = now + expiresInMs;

  const stmt = conn.prepare(`
    INSERT INTO otp_codes (email_hash, code, expires_at, attempts, created_at)
    VALUES (?, ?, ?, 0, ?)
    ON CONFLICT(email_hash) DO UPDATE SET
      code = excluded.code,
      expires_at = excluded.expires_at,
      attempts = 0,
      created_at = excluded.created_at
  `);
  stmt.run(emailHash, code, expiresAt, now);
}

export function verifyOtp(emailHash: string, inputCode: string): { success: boolean; reason?: string } {
  const conn = getDatabase();
  const row = conn.prepare('SELECT * FROM otp_codes WHERE email_hash = ?').get(emailHash) as any;
  if (!row) {
    return { success: false, reason: 'No verification code requested for this email' };
  }

  const now = Date.now();
  if (now > row.expires_at) {
    conn.prepare('DELETE FROM otp_codes WHERE email_hash = ?').run(emailHash);
    return { success: false, reason: 'Verification code has expired. Please request a new code.' };
  }

  if (row.attempts >= 5) {
    conn.prepare('DELETE FROM otp_codes WHERE email_hash = ?').run(emailHash);
    return { success: false, reason: 'Too many incorrect attempts. Please request a new code.' };
  }

  if (row.code !== inputCode.trim()) {
    conn.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE email_hash = ?').run(emailHash);
    return { success: false, reason: 'Invalid 6-digit code. Please check and try again.' };
  }

  conn.prepare('DELETE FROM otp_codes WHERE email_hash = ?').run(emailHash);
  return { success: true };
}

export function createSession(token: string, emailHash: string, expiresInMs = 7 * 24 * 60 * 60 * 1000): void {
  const conn = getDatabase();
  const expiresAt = Date.now() + expiresInMs;
  conn.prepare('INSERT INTO sessions (token, email_hash, expires_at) VALUES (?, ?, ?)').run(token, emailHash, expiresAt);
}

export function getSession(token: string): { emailHash: string } | null {
  const conn = getDatabase();
  const row = conn.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as any;
  if (!row) return null;

  if (Date.now() > row.expires_at) {
    conn.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }

  return { emailHash: row.email_hash };
}

export function deleteSession(token: string): void {
  const conn = getDatabase();
  conn.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}


export function getLetterById(id: string): PublicLetter | null {
  const conn = getDatabase();
  const row = conn.prepare(
    "SELECT id, content_type, content_text, drawing_data, paper_style, font_style, created_at FROM letters WHERE id = ? AND is_reported = 0"
  ).get(id) as PublicLetter | undefined;
  return row || null;
}

export default db;
