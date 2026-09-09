'use client';

import React from 'react';
import { PublicLetter } from '@/lib/db';
import { PenTool, FileText } from 'lucide-react';

interface LetterCardProps {
  letter: PublicLetter;
  onClick: () => void;
}

const PAPER_CLASS_MAP: Record<string, string> = {
  white: 'paper-style-white',
  manila: 'paper-style-manila',
  ruled: 'paper-style-ruled',
  yellow: 'paper-style-yellow',
  grid: 'paper-style-grid',
  kraft: 'paper-style-kraft',
  slate: 'paper-style-slate',
};

function formatDriftTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'just drifted ashore';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function LetterCard({ letter, onClick }: LetterCardProps) {
  const paperClass = PAPER_CLASS_MAP[letter.paper_style] || 'paper-style-white';
  const isSlate = letter.paper_style === 'slate';

  return (
    <article
      onClick={onClick}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group cursor-pointer border border-black p-4 relative flex flex-col justify-between transition-all duration-100 hover:-translate-y-1 hover:shadow-retro-lg shadow-retro ${paperClass} min-h-[170px] max-h-[320px] overflow-hidden`}
    >
      {/* Ruled notebook line decoration */}
      {letter.paper_style === 'ruled' && <div className="notebook-margin-line" />}

      {/* Header Info */}
      <div className="flex items-center justify-between text-[10px] font-mono border-b border-black/20 pb-1.5 mb-2 pl-4 sm:pl-5">
        <span className="font-bold tracking-wider uppercase opacity-75">
          To: [undisclosed email]
        </span>
        <span className="opacity-60 flex items-center gap-1">
          {letter.content_type === 'draw' ? <PenTool size={10} /> : <FileText size={10} />}
          {formatDriftTime(letter.created_at)}
        </span>
      </div>

      {/* Main Content Preview */}
      <div className="flex-1 overflow-hidden pl-4 sm:pl-5 my-1">
        {letter.content_type === 'text' ? (
          <p
            className={`font-mono text-xs sm:text-sm leading-relaxed line-clamp-5 whitespace-pre-wrap break-words ${
              isSlate ? 'text-zinc-100' : 'text-zinc-900'
            }`}
          >
            {letter.content_text}
          </p>
        ) : (
          <div className="w-full h-32 flex items-center justify-center overflow-hidden bg-white/10 rounded-none border border-black/10">
            {letter.drawing_data ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={letter.drawing_data}
                alt="Unsent sketch"
                className="max-h-full max-w-full object-contain filter"
              />
            ) : (
              <span className="text-xs text-gray-400">[Empty sketch]</span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="mt-2 pt-1.5 border-t border-black/15 flex items-center justify-between text-[9px] font-mono opacity-50 pl-4 sm:pl-5">
        <span>BOTTLE #{letter.id.slice(0, 6)}</span>
        <span className="group-hover:opacity-100 font-bold group-hover:underline">
          Read bottle →
        </span>
      </div>
    </article>
  );
}
