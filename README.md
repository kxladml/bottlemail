# bottlemail 🍾✉️

> An anonymous early-2000s monochrome sanctuary inspired by **The Unsent Project**, where letters are cast into the ocean addressed to **email addresses** instead of recipient names.

---

## 🌊 Core Philosophy & How It Works

1. **Anonymous Sending (No Account Required)**:
   - Anyone can write a letter or draw a sketch to any email address.
   - Senders never need to register, provide an account, or log in.
2. **Encrypted & Private**:
   - Recipient emails are encrypted using **AES-256-GCM** and indexed using an **HMAC-SHA256 blind index**.
   - The email is **strictly never displayed** on the public homepage feed.
3. **Public Homepage Feed**:
   - Letters drift openly at sea for anyone to browse, read, search, and reflect upon.
4. **Email OTP Login (Private Inbox)**:
   - Recipients can enter their email and verify ownership via a **6-digit OTP code** to unlock their private bottle inbox containing all letters ever sent to them.
5. **Physical Notebook Page Constraint**:
   - Letters are strictly constrained to the capacity of a single physical notebook page (~500 characters) to encourage concise, meaningful words.
6. **Text & Drawing Modes**:
   - Writers can compose text or use a minimalist sketchpad (fine pen, medium pen, marker, eraser, ink tints).
7. **Curated Paper Styles**:
   - Authentic stationery choices (Plain White, Manila Parchment, College Lined, Legal Yellow, Engineering Graph, Vintage Kraft, Midnight Slate) calibrated for high-contrast ink legibility.
8. **Multi-Layered Safety Censors**:
   - Prevents doxxing (blocks phone numbers, emails, physical addresses, and sensitive identification from letter bodies).
   - Blocks hate speech, slurs, and severe harassment.
   - Provides supportive crisis hotline resources (988 / findahelpline.com).

---

## 🎨 UI / UX Aesthetic

- **Early 2000s Brutalist Monochrome Web 1.0**:
  - High-contrast black (`#000000`) and white (`#ffffff`).
  - Monospaced / typewriter typography (`Courier New`, `Menlo`, `Monaco`).
  - Crisp `1px` and `2px` borders with hard retro drop shadows (`box-shadow: 2px 2px 0px #000`).
  - Pure SVG vector line art (no heavy images or external tracking scripts).
  - Fast, responsive, and lightweight on mobile, tablet, and desktop.

---

## 🚀 Quick Start

### 1. Requirements
- Node.js 18+ (tested on Node v20 LTS)
- npm / yarn / pnpm

### 2. Install & Seed
```bash
# Clone or enter directory
cd bottlemail

# Install dependencies
npm install

# Seed the ocean with sample nostalgic letters
npm run seed
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

### 5. Run Automated Tests
```bash
node scripts/test-suite.mjs
```

---

## 🔐 Cryptography & Privacy Design

To prevent leaks even in the event of a full database breach:
- **Blind Indexing**: We compute `recipient_hash = HMAC-SHA256(normalized_email, PEPPER_KEY)`. This enables fast `O(1)` query lookup (`WHERE recipient_hash = ?`) when recipients log in, without having to decrypt the database or store plain emails.
- **Encrypted Storage**: The email payload is stored encrypted with `AES-256-GCM` using a 256-bit key and unique cryptographic initialization vector (IV) + authentication tag per record.
- **Public API Isolation**: Public API responses (`/api/letters`) completely exclude both the `recipient_hash` and `recipient_encrypted` fields.

---

## 🛡️ Content Safety & Censorship Engine

Located in `src/lib/safety.ts`:
- **PII Anti-Doxxing Filter**: Scans for phone numbers (`\d{3}[-.\s]?\d{3}[-.\s]?\d{4}`), email addresses in the body, and SSN/card numbers.
- **Hate Speech & Slur Blacklist**: Normalized phonetic matching against slurs, harassment, and violent threats.
- **Crisis Intervention**: Empathetic safety interceptor linking users to 24/7 confidential helplines (988 Lifeline, findahelpline.com).
- **Family-Safe Profanity Masking**: Filters casual profanities (`s**t`, `f**k`) in acceptable contexts.

---

## 🌐 Free Hosting Alternatives & Setup

You can host bottlemail for **$0/month** on several modern developer platforms:

### Option A: Vercel + Turso / Supabase (Recommended)
1. Push this repository to GitHub.
2. Go to [Vercel](https://vercel.com) and click **Import Project**.
3. For a zero-cost serverless database:
   - Use **Turso** (LibSQL/SQLite at the edge with 9GB free storage) or **Supabase** (PostgreSQL free tier).
4. Add environment variables in Vercel settings:
   - `APP_ENCRYPTION_KEY` (32-byte hex string)
   - `APP_PEPPER_KEY` (random secret string)

### Option B: Railway / Render (Single Container)
- Deploy as a Node.js container with a persistent volume for `data/bottlemail.db`.
- Both Railway and Render offer free tiers or trial credits.

### Option C: Cloudflare Pages + D1
- Deploy Next.js on Cloudflare Pages using Cloudflare D1 (free distributed SQLite).

---

## 🏷️ Domain Name & Wordplay Ideas

If you are looking for memorable, poetic, or wordplay domain names:
- **`bottlemail.me`** or **`bottlemail.cc`** (clean and classic)
- **`bottl.email`** (smart domain hack using the `.email` TLD!)
- **`bottlepost.xyz`** or **`bottlepost.net`** (referencing the nautical term *bottle post*)
- **`driftingbottles.com`** (evocative and memorable)
- **`unsentbottles.com`** (direct nod to The Unsent Project)
- **`driftmail.link`** (short and modern)

---

## 🤖 MCP (Model Context Protocol) Clarification

**Do you require any MCPs to host or run bottlemail?**
- **No.** The entire bottlemail application runs on native Next.js, standard Node.js cryptography, and SQLite. It has **zero dependencies on MCP servers** to build, run, or deploy.
- **Optional MCP Extensions** (if you choose to add them later):
  - **Gemini API / Claude MCP**: Can be used for advanced semantic AI moderation to catch subtle emotional distress or complex harassment patterns that regex filters might miss.
  - **Resend / SendGrid Email MCP**: For automating transactional OTP email delivery in production.
