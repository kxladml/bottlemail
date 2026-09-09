# Implementation Plan: bottlemail

bottlemail is a retro early-2000s monochrome web application inspired by The Unsent Project, where users cast letters into the digital ocean directed to email addresses instead of recipient first names.

- **Senders** do not need an account; anyone can write an anonymous letter (text or simple sketch) constrained to a physical notebook page size.
- **Recipients** can log in with their email address via a 6-digit OTP code to inspect their private bottlemail inbox and read all letters sent to them.
- **Homepage** shows the public archive of letters drifting at sea, with recipient emails strictly hidden and encrypted in the database using AES-256-GCM + HMAC-SHA256 blind indexing.
- **Safety**: Multi-layer censorship engine preventing hate speech, harassment, profanity, and personal identifiable information (PII such as phone numbers, emails, or addresses in letter bodies) to protect privacy and prevent doxxing.
- **UI/UX**: Fast, responsive, early-2000s black-and-white aesthetic with 1px borders, crisp typography, clean vector icons, and carefully calibrated paper tints that preserve ink legibility.

---

## User Review Required

> [!IMPORTANT]
> **Email Encryption & Blind Indexing Strategy**:
> To ensure recipient emails are never exposed even in a complete database breach:
> 1. We store `recipient_hash = HMAC-SHA256(email, PEPPER_KEY)` to allow fast index lookup when recipients log in.
> 2. We store `recipient_encrypted = AES-256-GCM(email, ENCRYPTION_KEY)` with a cryptographic initialization vector and authentication tag.
> 3. The raw email is NEVER stored in plaintext. Public API responses completely omit both fields.

> [!NOTE]
> **OTP Verification for Development vs. Production**:
> For local development and testing, generated 6-digit OTPs are logged to the console and displayed in a developer helper modal so you can test the inbox flow instantly without configuring an email service. In production, this connects to free email delivery providers (e.g. Resend, Brevo, or SendGrid with generous free tiers).

---

## Proposed Implementation Architecture

### 1. Stack Selection
- **Framework**: Next.js 14+ (App Router, TypeScript, React 18, Tailwind CSS customized for authentic 2000s brutalist monochrome style).
- **Icons & Graphics**: Pure SVG vector icons (bottles, envelopes, fountain pen, seals). Zero heavy image files.
- **Database**: SQLite with standard schema, zero external dependencies required for local run, plug-and-play with free cloud hosting (Supabase, Turso, Neon).
- **Security**: Node.js native `crypto` module (AES-256-GCM for encryption, HMAC-SHA256 for blind search index).

### 2. Core Features Breakdown
1. **Homepage Feed (The Drifting Ocean)**:
   - Masonry layout of unsent letters.
   - Shows letter note card, paper background styling, date, letter counter, and reading dialog.
   - Recipient emails are completely absent from public payloads.
   - Search letters by text query & filter by format (All / Text / Sketch).
2. **Notebook Page Letter Composer**:
   - Single notebook page constraint with realistic lined/grid paper appearance.
   - Text Mode: typewriter/monospace, ~500 character limit with visual page capacity indicator.
   - Draw Mode: Minimalist HTML5 canvas (fine pen, medium pen, marker, eraser, undo, clear).
   - Curated paper colors: Classic White, Manila Parchment, College Lined, Blueprint Grid, Dotted Kraft, Dark Slate. All tested for high-contrast ink legibility.
   - Free anonymous sending: no login or registration required.
3. **Safety & Moderation Engine**:
   - PII detection (phone numbers, email addresses, SSNs in body text).
   - Slur, profanity, and harassment prevention with helpful feedback.
   - Crisis / mental health support resources banner.
4. **OTP Login & Recipient Inbox**:
   - Passwordless login: Enter email -> receive 6-digit OTP -> verify.
   - Session stored in HTTP-only secure cookie.
   - Private inbox querying `recipient_hash`. Shows all letters addressed to that email.
5. **Free Hosting & Domain Guide**:
   - Vercel / Cloudflare Pages / Railway deployment guides.
   - Free database setup (Turso / Supabase).
   - Creative domain name options (`bottlemail.me`, `bottl.email`, `bottlepost.xyz`).
   - MCP clarification (why MCPs aren't strictly required for hosting, and how optional AI MCPs can be added).

---

## Verification Plan

### Automated Tests
- Database CRUD tests for letter creation, query by blind index, and public projection (ensuring recipient emails are stripped).
- Cryptographic tests verifying AES-256-GCM roundtrip decryption and HMAC-SHA256 hash consistency.
- Safety filter unit tests verifying PII detection (phone numbers, emails) and profanity filtering.
- OTP expiry and rate-limiting tests.

### Manual Verification
1. **Send a Letter as Anonymous**:
   - Write a text letter and send to `test@example.com`.
   - Verify it appears on the public homepage feed without the email.
2. **Draw a Letter**:
   - Create a hand-drawn sketch note using the canvas tools and send to `test@example.com`.
   - Verify the sketch renders sharply on the card and in full modal.
3. **Safety Censor Verification**:
   - Try posting phone numbers or prohibited words; verify courteous rejection.
4. **OTP Login & Inbox Verification**:
   - Click "Check My Bottles", enter `test@example.com`, verify OTP.
   - Inspect the inbox to verify both letters arrive and are readable.
5. **Responsiveness & 2000s Visual Verification**:
   - Test on desktop and mobile viewports, verify crisp borders and typography.
