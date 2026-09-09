import Database from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'bottlemail.db'));

// Initialize schema
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

const PEPPER_KEY = process.env.APP_PEPPER_KEY || 'bottlemail-dev-pepper-key-2026';
const ENCRYPTION_KEY = process.env.APP_ENCRYPTION_KEY
  ? Buffer.from(process.env.APP_ENCRYPTION_KEY, 'hex')
  : crypto.createHash('sha256').update('bottlemail-dev-encryption-key-2026').digest();

function hashEmail(email) {
  return crypto.createHmac('sha256', PEPPER_KEY).update(email.trim().toLowerCase()).digest('hex');
}

function encryptEmail(email) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let enc = cipher.update(email.trim().toLowerCase(), 'utf8', 'hex');
  enc += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${enc}`;
}

// Clear existing seed data if resetting
db.prepare('DELETE FROM letters').run();

// Generate a minimalist sample drawing data URI (a small cute bottle SVG data URI)
const sampleBottleSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect x="135" y="40" width="30" height="20" fill="none" stroke="black" stroke-width="4"/><path d="M135 60 C120 75, 110 90, 110 110 L110 170 C110 180, 120 185, 130 185 L170 185 C180 185, 190 180, 190 170 L190 110 C190 90, 180 75, 165 60 Z" fill="none" stroke="black" stroke-width="4"/><line x1="125" y1="130" x2="175" y2="130" stroke="black" stroke-width="3" stroke-dasharray="4,4"/><text x="150" y="155" font-family="monospace" font-size="14" text-anchor="middle" fill="black">wish you were here</text></svg>`;

const sampleHeartSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><path d="M150 160 C100 120, 70 90, 70 60 C70 35, 95 20, 120 20 C135 20, 145 30, 150 40 C155 30, 165 20, 180 20 C205 20, 230 35, 230 60 C230 90, 200 120, 150 160 Z" fill="none" stroke="black" stroke-width="4"/><text x="150" y="105" font-family="monospace" font-size="12" text-anchor="middle" fill="black">to the one who got away</text></svg>`;

const sampleLetters = [
  {
    email: 'demo@bottlemail.com',
    type: 'text',
    text: "I still listen to the songs you added to our shared playlist in 2018. I wonder if you still remember why you put track 4 there.",
    paper: 'ruled',
    drawing: null,
    timeAgo: 1000 * 60 * 30,
  },
  {
    email: 'demo@bottlemail.com',
    type: 'draw',
    text: null,
    paper: 'grid',
    drawing: sampleBottleSvg,
    timeAgo: 1000 * 60 * 75,
  },
  {
    email: 'demo@bottlemail.com',
    type: 'text',
    text: "You told me you were proud of me once on the subway platform before your train arrived. It kept me going for three years.",
    paper: 'manila',
    drawing: null,
    timeAgo: 1000 * 60 * 120,
  },
  {
    email: 'sarah.m@university.edu',
    type: 'text',
    text: "I never said congratulations when you got accepted. I was selfishly scared you would move across the country. I'm sorry.",
    paper: 'yellow',
    drawing: null,
    timeAgo: 1000 * 60 * 60 * 5,
  },
  {
    email: 'alex_photo@gmail.com',
    type: 'draw',
    text: null,
    paper: 'white',
    drawing: sampleHeartSvg,
    timeAgo: 1000 * 60 * 60 * 8,
  },
  {
    email: 'quietnights@yahoo.com',
    type: 'text',
    text: "Sometimes I type your name into the search bar just to see if you still have the same icon. I never click send.",
    paper: 'slate',
    drawing: null,
    timeAgo: 1000 * 60 * 60 * 24,
  },
  {
    email: 'artstudent99@gmail.com',
    type: 'text',
    text: "The coffee shop down the street closed down last Tuesday. It made me realize how much time has actually passed since we sat there studying for midterms.",
    paper: 'white',
    drawing: null,
    timeAgo: 1000 * 60 * 60 * 36,
  },
  {
    email: 'demo@bottlemail.com',
    type: 'text',
    text: "I hope you are happy, genuinely. Even if I am not the one who gets to hear about it anymore.",
    paper: 'kraft',
    drawing: null,
    timeAgo: 1000 * 60 * 60 * 48,
  },
  {
    email: 'stranger@drift.net',
    type: 'text',
    text: "To whoever reads this in the morning: breathe. Whatever is weighing heavily on your chest right now will soften with time.",
    paper: 'ruled',
    drawing: null,
    timeAgo: 1000 * 60 * 60 * 72,
  }
];

const insertStmt = db.prepare(`
  INSERT INTO letters (id, recipient_hash, recipient_encrypted, content_type, content_text, drawing_data, paper_style, font_style, created_at, is_reported)
  VALUES (@id, @recipient_hash, @recipient_encrypted, @content_type, @content_text, @drawing_data, @paper_style, @font_style, @created_at, 0)
`);

const now = Date.now();
for (const letter of sampleLetters) {
  insertStmt.run({
    id: crypto.randomUUID(),
    recipient_hash: hashEmail(letter.email),
    recipient_encrypted: encryptEmail(letter.email),
    content_type: letter.type,
    content_text: letter.text,
    drawing_data: letter.drawing,
    paper_style: letter.paper,
    font_style: 'mono',
    created_at: now - letter.timeAgo,
  });
}

console.log(`Successfully seeded ${sampleLetters.length} letters!`);
console.log(`Demo inbox ready for: demo@bottlemail.com`);
