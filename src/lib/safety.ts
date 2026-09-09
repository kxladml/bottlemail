/**
 * Bottlemail Content Safety & Censorship Engine
 * Filters profanity, slurs, harassment, hate speech, and PII (doxxing protection).
 */

// Phone number regex (handles US, international, spaced, hyphenated, dotted)
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;

// Email regex to prevent doxxing or posting emails inside letter bodies
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Credit card / SSN regex
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
const CC_REGEX = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;

// High-severity slurs, hate speech, explicit abuse, threats
const PROHIBITED_WORDS = [
  // Racial / ethnic / homophobic / transphobic slurs
  'nigger', 'nigga', 'faggot', 'fag', 'kike', 'chink', 'spic', 'wetback', 'gook',
  'tranny', 'dyke', 'retard', 'retarded', 'coon',
  // Direct abuse and threats
  'kill yourself', 'kys', 'hang yourself', 'commit suicide', 'slit your',
  'shoot up', 'die in a fire', 'rape', 'rapist',
  // Explicit extreme terms
  'child porn', 'cp', 'pedo', 'pedophile', 'behead', 'terrorist attack'
];

// Mild/moderate profanity to censor or warn (can be soft-censored with asterisks or blocked)
const PROFANITY_LIST = [
  'fuck', 'fucking', 'fucked', 'fucker', 'motherfucker',
  'shit', 'bitch', 'bitches', 'cunt', 'asshole', 'dick', 'pussy',
  'cock', 'whore', 'slut', 'bastard', 'twat'
];

// Crisis / self-harm keywords
const CRISIS_KEYWORDS = [
  'kill myself', 'want to die', 'end my life', 'commit suicide',
  'hang myself', 'slit my wrists', 'take all my pills', 'overdose and die'
];

export interface ModerationResult {
  isSafe: boolean;
  reason?: string;
  category?: 'pii' | 'slur' | 'harassment' | 'crisis' | 'length';
  censoredText?: string;
  crisisSupport?: boolean;
}

/**
 * Normalizes text to defeat simple leetspeak substitutions
 */
function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/(\w)\1{2,}/g, '$1$1') // collapse repeated characters
    .replace(/[\s\-_.~]/g, '');     // collapse spaces and punctuation
}

/**
 * Checks text against all safety and moderation rules
 */
export function checkContentSafety(text: string): ModerationResult {
  if (!text || text.trim().length === 0) {
    return { isSafe: true, censoredText: text };
  }

  // 1. Check for Self-Harm / Crisis Intervention
  const lowerText = text.toLowerCase();
  for (const crisis of CRISIS_KEYWORDS) {
    if (lowerText.includes(crisis)) {
      return {
        isSafe: false,
        reason: 'If you or someone you know is going through a painful moment, please know there is support. Free, confidential support is available 24/7. Text or call 988 (USA/Canada) or visit https://findahelpline.com worldwide.',
        category: 'crisis',
        crisisSupport: true,
      };
    }
  }

  // 2. Check for PII: Email addresses inside letter body
  if (EMAIL_REGEX.test(text)) {
    return {
      isSafe: false,
      reason: 'For privacy and anti-doxxing safety, personal email addresses cannot be included in the public letter body.',
      category: 'pii',
    };
  }

  // 3. Check for PII: Phone numbers (match 10+ digits formatted like phone numbers)
  const phoneMatches = text.match(PHONE_REGEX);
  if (phoneMatches) {
    for (const match of phoneMatches) {
      // Filter out harmless short numbers (years like 2024, or times)
      const digitsOnly = match.replace(/\D/g, '');
      if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
        return {
          isSafe: false,
          reason: 'For privacy and anti-doxxing safety, phone numbers cannot be included in public letters.',
          category: 'pii',
        };
      }
    }
  }

  // 4. Check for PII: SSN or Credit Card numbers
  if (SSN_REGEX.test(text) || CC_REGEX.test(text)) {
    return {
      isSafe: false,
      reason: 'For security reasons, sensitive identification or card numbers cannot be posted.',
      category: 'pii',
    };
  }

  // 5. Check for Severe Slurs, Hate Speech, Extreme Abuse
  const normalized = normalizeForMatching(text);
  for (const slur of PROHIBITED_WORDS) {
    const slurNormalized = normalizeForMatching(slur);
    if (normalized.includes(slurNormalized) || lowerText.includes(slur)) {
      return {
        isSafe: false,
        reason: 'This letter contains words or phrases that violate our community standards against hate speech, slurs, or targeted harassment.',
        category: 'slur',
      };
    }
  }

  // 6. Profanity Censor (Mask profanities with asterisks to keep letters family/general audience safe)
  let cleanedText = text;
  for (const word of PROFANITY_LIST) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    cleanedText = cleanedText.replace(regex, (match) => {
      if (match.length <= 2) return '**';
      return match[0] + '*'.repeat(match.length - 2) + match[match.length - 1];
    });
  }

  return {
    isSafe: true,
    censoredText: cleanedText,
  };
}
