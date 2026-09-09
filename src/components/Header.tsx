'use client';

import React from 'react';
import { Mail, Plus, Inbox, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenComposer: () => void;
  onOpenAuth: () => void;
  onOpenInbox: () => void;
  isAuthenticated: boolean;
}

export default function Header({
  onOpenComposer,
  onOpenAuth,
  onOpenInbox,
  isAuthenticated,
}: HeaderProps) {
  return (
    <header className="border-b-2 border-black bg-white sticky top-0 z-40">
      {/* 2000s Top Navigation Bar */}
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo & Vector Bottle Glyph */}
        <div className="flex items-center gap-2.5">
          {/* Custom SVG Message in a Bottle Vector Icon */}
          <div className="w-8 h-8 border border-black flex items-center justify-center bg-white shadow-retro-sm shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Bottle Neck & Cork */}
              <rect x="10" y="2" width="4" height="4" fill="#000" />
              <path d="M10 6 L14 6" />
              {/* Bottle Body */}
              <path d="M9 7 C8 8, 7 9, 7 11 L7 20 C7 21, 8 22, 9 22 L15 22 C16 22, 17 21, 17 20 L17 11 C17 9, 16 8, 15 7 Z" />
              {/* Rolled Scroll inside the bottle */}
              <line x1="10" y1="13" x2="14" y2="13" />
              <line x1="10" y1="16" x2="14" y2="16" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base tracking-tight font-mono uppercase">
                BOTTLEMAIL
              </h1>
              <span className="text-[10px] bg-black text-white px-1 font-bold font-mono">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-gray-600 font-mono hidden sm:block">
              unsent letters addressed to emails • encrypted & anonymous
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <button
              onClick={onOpenInbox}
              className="btn-retro text-xs flex items-center gap-1.5 bg-gray-100"
            >
              <Inbox size={13} />
              <span>[ My Inbox ]</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn-retro text-xs flex items-center gap-1.5"
            >
              <Mail size={13} />
              <span>[ Check My Bottles ]</span>
            </button>
          )}

          <button
            onClick={onOpenComposer}
            className="btn-retro-black text-xs flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>[ + Write Letter ]</span>
          </button>
        </div>
      </div>
    </header>
  );
}
