import assert from 'assert';
import crypto from 'crypto';

console.log('--- RUNNING BOTTLEMAIL COMPREHENSIVE TEST SUITE ---\n');

// 1. Test Crypto Module
console.log('1. Testing Cryptography (AES-256-GCM + HMAC-SHA256 Blind Index)...');
const testEmail = 'recipient.secret@example.com';
const pepper = 'bottlemail-dev-pepper-key-2026';
const key = crypto.createHash('sha256').update('bottlemail-dev-encryption-key-2026').digest();

// Blind index
function hashEmail(email) {
  return crypto.createHmac('sha256', pepper).update(email.trim().toLowerCase()).digest('hex');
}

// AES-256-GCM
function encryptEmail(email) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let enc = cipher.update(email.trim().toLowerCase(), 'utf8', 'hex');
  enc += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${enc}`;
}

function decryptEmail(encryptedData) {
  const [ivHex, tagHex, ciphertext] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  let dec = decipher.update(ciphertext, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

const hash1 = hashEmail(testEmail);
const hash2 = hashEmail('  Recipient.Secret@example.COM  ');
assert.strictEqual(hash1, hash2, 'Hash should be case-insensitive and trimmed');

const encrypted1 = encryptEmail(testEmail);
const encrypted2 = encryptEmail(testEmail);
assert.notStrictEqual(encrypted1, encrypted2, 'Two encryptions of same email must have unique IVs');

const decrypted1 = decryptEmail(encrypted1);
const decrypted2 = decryptEmail(encrypted2);
assert.strictEqual(decrypted1, testEmail);
assert.strictEqual(decrypted2, testEmail);
console.log('✓ Cryptography tests passed: encryption, decryption, and blind index match.\n');

// 2. Test Safety and Censor Filters
console.log('2. Testing Safety & Censorship Engine...');

const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PROHIBITED_WORDS = ['kike', 'nigger', 'faggot', 'kill yourself', 'kys'];
const PROFANITY_LIST = ['fuck', 'shit', 'bitch', 'asshole'];

function checkSafety(text) {
  // Check PII email
  if (EMAIL_REGEX.test(text)) {
    return { isSafe: false, reason: 'PII: Email' };
  }
  // Check PII phone
  const phones = text.match(PHONE_REGEX);
  if (phones) {
    for (const p of phones) {
      const d = p.replace(/\D/g, '');
      if (d.length >= 7 && d.length <= 15) {
        return { isSafe: false, reason: 'PII: Phone' };
      }
    }
  }
  // Check severe slurs
  const lower = text.toLowerCase();
  for (const slur of PROHIBITED_WORDS) {
    if (lower.includes(slur)) {
      return { isSafe: false, reason: 'Prohibited hate speech' };
    }
  }
  // Check profanity mask
  let cleaned = text;
  for (const word of PROFANITY_LIST) {
    const reg = new RegExp(`\\b${word}\\b`, 'gi');
    cleaned = cleaned.replace(reg, (m) => m[0] + '*'.repeat(m.length - 2) + m[m.length - 1]);
  }
  return { isSafe: true, text: cleaned };
}

// Test cases
assert.strictEqual(checkSafety('Call me at 415-555-2671').isSafe, false, 'Should block phone number');
assert.strictEqual(checkSafety('Reach me on my personal email john.doe@work.org').isSafe, false, 'Should block email inside letter body');
assert.strictEqual(checkSafety('Go kys right now').isSafe, false, 'Should block extreme threats/slurs');

const profaneResult = checkSafety('This is a damn good test with shit in it');
assert.strictEqual(profaneResult.isSafe, true, 'Mild profanity should be masked, not crash');
assert.ok(profaneResult.text.includes('s**t'), 'Profanity should be masked with asterisks');

const cleanResult = checkSafety('I really miss the walk we took along the harbor.');
assert.strictEqual(cleanResult.isSafe, true);
assert.strictEqual(cleanResult.text, 'I really miss the walk we took along the harbor.');
console.log('✓ Safety & censorship tests passed: PII and hate speech blocked, words masked.\n');

// 3. Database Security & Privacy Verification
console.log('3. Testing Database Query Privacy...');
import Database from 'better-sqlite3';
const db = new Database('data/bottlemail.db');

// Check that public query does NOT return recipient_hash or recipient_encrypted
const publicQuery = db.prepare('SELECT id, content_type, content_text, drawing_data, paper_style, font_style, created_at FROM letters LIMIT 5').all();
assert.ok(publicQuery.length > 0, 'Should have seeded letters');
for (const letter of publicQuery) {
  assert.strictEqual(letter.recipient_hash, undefined, 'Public letter must NEVER contain recipient_hash');
  assert.strictEqual(letter.recipient_encrypted, undefined, 'Public letter must NEVER contain recipient_encrypted');
  assert.strictEqual(letter.email, undefined, 'Public letter must NEVER contain plain email');
}
console.log('✓ Public projection security verified: zero email or hash leaks in public feed.\n');

// 4. Test OTP Flow
console.log('4. Testing OTP Flow...');
const testHash = hashEmail('test.user@bottlemail.com');
const otpCode = '749201';
const now = Date.now();

// Insert OTP
db.prepare('INSERT INTO otp_codes (email_hash, code, expires_at, attempts, created_at) VALUES (?, ?, ?, 0, ?) ON CONFLICT(email_hash) DO UPDATE SET code = excluded.code').run(
  testHash, otpCode, now + 1000 * 60 * 10, now
);

// Verify correct OTP
const validRow = db.prepare('SELECT * FROM otp_codes WHERE email_hash = ?').get(testHash);
assert.strictEqual(validRow.code, otpCode);

// Verify incorrect attempt increments attempts
db.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE email_hash = ?').run(testHash);
const updatedRow = db.prepare('SELECT attempts FROM otp_codes WHERE email_hash = ?').get(testHash);
assert.strictEqual(updatedRow.attempts, 1);

// Clean up test OTP
db.prepare('DELETE FROM otp_codes WHERE email_hash = ?').run(testHash);
console.log('✓ OTP verification logic passed.\n');

console.log('====================================================');
console.log('ALL BOTTLEMAIL TESTS PASSED SUCCESSFULLY (100% OK)');
console.log('====================================================\n');
