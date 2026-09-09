'use client';

import React from 'react';
import { Shield, Heart, Anchor, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t-2 border-black bg-white mt-16 text-xs font-mono">
      {/* Safety & Helpline Strip */}
      <div className="border-b border-black bg-gray-50 py-3 px-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-gray-700">
            <Shield size={14} className="text-black shrink-0" />
            <span>
              <strong>Safety & Censor Policy:</strong> Letters with phone numbers, emails in text, or hate speech are automatically rejected.
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Heart size={14} className="text-black shrink-0" />
            <span>
              Need to talk? <strong>Call or text 988</strong> (USA/Canada) or{' '}
              <a
                href="https://findahelpline.com"
                target="_blank"
                rel="noreferrer"
                className="underline hover:bg-black hover:text-white"
              >
                findahelpline.com
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Info */}
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="font-bold text-sm uppercase mb-2 flex items-center gap-1.5">
            <Anchor size={14} />
            <span>BOTTLEMAIL</span>
          </div>
          <p className="text-gray-600 leading-relaxed text-[11px]">
            An Unsent Project clone where letters are directed to email addresses instead of first names.
            Senders remain completely anonymous. Recipient emails are encrypted using AES-256-GCM.
          </p>
        </div>

        <div>
          <div className="font-bold text-sm uppercase mb-2">How It Works</div>
          <ul className="space-y-1.5 text-gray-600 text-[11px]">
            <li>1. Write what you never got the chance to say to an email.</li>
            <li>2. The bottle drifts freely on the homepage (email strictly hidden).</li>
            <li>3. The recipient can log in with their email &amp; OTP to discover their letters.</li>
          </ul>
        </div>

        <div>
          <div className="font-bold text-sm uppercase mb-2">2000s Web Badge</div>
          <div className="space-y-2 text-[11px]">
            <div className="inline-block border border-black px-2 py-1 bg-gray-100 font-bold">
              [ BEST VIEWED IN ANY BROWSER ]
            </div>
            <div>
              <span className="text-gray-500">BOTTLES SERVED: </span>
              <span className="font-bold border border-black bg-black text-white px-1.5 py-0.5 tracking-widest">
                001429
              </span>
            </div>
            <p className="text-[10px] text-gray-500">
              No trackers • No ads • Fast monochrome aesthetic
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-black py-3 px-4 text-center text-[10px] text-gray-500 bg-gray-50">
        bottlemail © {new Date().getFullYear()} • Encrypted digital drift.
      </div>
    </footer>
  );
}
