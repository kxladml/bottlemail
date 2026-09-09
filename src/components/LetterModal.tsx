'use client';

import React from 'react';
import { PublicLetter } from '@/lib/db';
import { X, Lock, Calendar, Share2, Check } from 'lucide-react';

interface LetterModalProps {
  letter: PublicLetter | null;
  onClose: () => void;
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

export default function LetterModal({ letter, onClose }: LetterModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!letter) return null;

  const paperClass = PAPER_CLASS_MAP[letter.paper_style] || 'paper-style-white';
  const isSlate = letter.paper_style === 'slate';
  const formattedDate = new Date(letter.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?bottle=${letter.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-none flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="window-retro w-full max-w-xl my-auto animate-in fade-in zoom-in-95 duration-100">
        {/* Title Bar */}
        <div className="window-header">
          <div className="flex items-center gap-2">
            <span>BOTTLE_{letter.id.slice(0, 8).toUpperCase()}.TXT</span>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-red-600 px-1 text-white text-xs font-bold border border-white"
          >
            <X size={12} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 bg-white space-y-4">
          {/* Metadata Banner */}
          <div className="border border-black p-2.5 bg-gray-50 flex flex-wrap items-center justify-between text-[11px] font-mono gap-2">
            <div className="flex items-center gap-1.5 text-gray-700">
              <Lock size={12} className="text-black" />
              <span>To: <strong className="text-black">[Encrypted Recipient Email]</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <Calendar size={12} />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Notebook Page View */}
          <div className={`notebook-page min-h-[300px] p-6 sm:p-8 ${paperClass} relative`}>
            {letter.paper_style === 'ruled' && <div className="notebook-margin-line" />}

            <div className="pl-6 sm:pl-8">
              {letter.content_type === 'text' ? (
                <div
                  className={`font-mono text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    isSlate ? 'text-zinc-100' : 'text-zinc-900'
                  }`}
                >
                  {letter.content_text}
                </div>
              ) : (
                <div className="w-full flex items-center justify-center">
                  {letter.drawing_data ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={letter.drawing_data}
                      alt="Letter drawing"
                      className="max-h-[360px] max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-gray-400 font-mono">[No drawing data]</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-black text-xs">
            <button
              onClick={handleCopyLink}
              className="btn-retro text-xs"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-green-600" /> Link Copied
                </>
              ) : (
                <>
                  <Share2 size={13} /> Copy Bottle Link
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="btn-retro-black text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
