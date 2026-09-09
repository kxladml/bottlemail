# bottlemail - Project Walkthrough & Verification Report

## Summary of Accomplishments

We have designed, built, and verified **bottlemail**, a web application inspired by The Unsent Project, built with an early-2000s brutalist monochrome aesthetic where unsent letters are addressed to **email addresses** instead of receiver first names.

---

## Key Features Implemented

1. **Anonymous Sending (No Registration Needed)**:
   - Senders can immediately compose a letter or draw a sketch without creating an account or logging in.
2. **AES-256-GCM Encryption + HMAC-SHA256 Blind Indexing**:
   - Stored emails are cryptographically encrypted using AES-256-GCM.
   - Blind indexing with HMAC-SHA256 allows exact query lookups (`WHERE recipient_hash = ?`) when recipients check their inbox, without ever exposing plaintext emails.
   - Public API endpoints strictly exclude recipient emails and hashes from responses.
3. **Passwordless OTP Login & Recipient Inbox**:
   - Recipients enter their email -> receive a 6-digit OTP -> unlock their private bottlemail inbox to read all letters addressed to them.
   - Includes a development helper preview banner for instant local testing without needing third-party email providers.
4. **Notebook Page Constraint & Styling**:
   - Letters are strictly limited to the capacity of a single physical notebook page (~500 characters) with a real-time capacity progress meter.
   - Curated paper colors (Plain White, Manila Parchment, College Lined, Legal Yellow, Engineering Graph, Vintage Kraft, Midnight Slate) with high contrast black/dark ink lines.
5. **Basic Sketch & Drawing Canvas**:
   - Minimalist drawing tool with fine, medium, and thick pen options, eraser, undo, and clear functions.
   - Exports lightweight vector/raster data with touch and mouse support.
6. **Multi-Layer Safety & Content Censors**:
   - Anti-doxxing filter blocking phone numbers, personal emails, and sensitive identifiers from letter bodies.
   - Blacklist and phonetic filtering for hate speech, slurs, and severe harassment.
   - Crisis intervention response providing 24/7 helpline resources (988, findahelpline.com).
7. **2000s Web Aesthetic**:
   - High-contrast black and white styling, 1px/2px borders, retro hard drop shadows (`box-shadow: 2px 2px 0px #000`), marquee ticker, and custom SVG bottle vectors.

---

## Verification Results

### 1. Automated Test Suite (`node scripts/test-suite.mjs`)
- **Cryptography**: AES-256-GCM roundtrip encryption/decryption verified; HMAC-SHA256 blind indexing verified.
- **Safety Censors**: Phone numbers and email doxxing blocked; hate speech blocked; profanity masked.
- **Database Privacy**: Public queries verified to ensure zero leak of `recipient_hash`, `recipient_encrypted`, or raw email.
- **OTP Logic**: 6-digit passcode generation, expiration, and rate-limiting verified.
- **Status**: **100% Passed**.

### 2. Live HTTP API Tests
- **GET `/api/letters`**: Returns public letters and total bottle count with pagination and format filtering.
- **POST `/api/letters` (Clean)**: Successfully cast into the sea (`200 OK`).
- **POST `/api/letters` (PII Phone)**: Courteously rejected with `400 Bad Request`.
- **POST `/api/letters` (PII Email)**: Courteously rejected with `400 Bad Request`.
- **POST `/api/auth/send-otp`**: Generates OTP code for recipient.
- **POST `/api/auth/verify-otp`**: Verifies 6-digit OTP and establishes HTTP-only session cookie.
- **GET `/api/inbox`**: Returns letters addressed to `demo@bottlemail.com`.

---

## Hosting & Domain Guide

### Zero-Cost Hosting
- **Vercel** + **Turso** (LibSQL edge database, 9GB free) or **Supabase** (PostgreSQL free tier).
- Alternatively: **Railway**, **Render**, or **Cloudflare Pages**.

### Domain Name & Wordplay Suggestions
- `bottl.email` (clever domain hack using `.email`)
- `bottlemail.me` / `bottlemail.cc`
- `bottlepost.xyz` / `bottlepost.net`
- `driftingbottles.com`

### MCP Requirements
- **None required** for runtime or hosting.
- Optional MCPs (Gemini/Claude MCP) can be added for automated AI moderation if needed in the future.
