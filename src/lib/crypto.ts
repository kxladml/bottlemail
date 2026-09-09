import crypto from 'crypto';

// Default fallback keys for development (in production, set via process.env)
const ENCRYPTION_KEY = process.env.APP_ENCRYPTION_KEY
  ? Buffer.from(process.env.APP_ENCRYPTION_KEY, 'hex')
  : crypto.createHash('sha256').update('bottlemail-dev-encryption-key-2026').digest();

const PEPPER_KEY = process.env.APP_PEPPER_KEY || 'bottlemail-dev-pepper-key-2026';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * Normalizes email by trimming and lowercasing
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Creates a blind index hash of the email using HMAC-SHA256.
 * This allows queryable lookups (WHERE recipient_hash = ?) without storing or exposing raw emails.
 */
export function hashEmail(email: string): string {
  const normalized = normalizeEmail(email);
  return crypto.createHmac('sha256', PEPPER_KEY).update(normalized).digest('hex');
}

/**
 * Encrypts an email using AES-256-GCM.
 * Output format: iv:tag:ciphertext (all hex-encoded)
 */
export function encryptEmail(email: string): string {
  const normalized = normalizeEmail(email);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(normalized, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

/**
 * Decrypts an encrypted email string (iv:tag:ciphertext).
 */
export function decryptEmail(encryptedData: string): string {
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted email format');
  }

  const [ivHex, tagHex, ciphertext] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generates a cryptographically secure 6-digit OTP
 */
export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Generates a secure random session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
