'use client';

import React, { useState } from 'react';
import { Send, X, AlertCircle, Info, Sparkles } from 'lucide-react';
import DrawingCanvas from './DrawingCanvas';

interface LetterComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onLetterCreated: () => void;
}

const MAX_CHARS = 500;

const PAPER_OPTIONS = [
  { id: 'white', name: 'Plain White', bgClass: 'paper-style-white', color: '#ffffff' },
  { id: 'manila', name: 'Manila Parchment', bgClass: 'paper-style-manila', color: '#fbf7ee' },
  { id: 'ruled', name: 'Lined Notebook', bgClass: 'paper-style-ruled', color: '#f6f9fc' },
  { id: 'yellow', name: 'Legal Yellow', bgClass: 'paper-style-yellow', color: '#fdfbf0' },
  { id: 'grid', name: 'Graph Paper', bgClass: 'paper-style-grid', color: '#f8f9fa' },
  { id: 'kraft', name: 'Vintage Kraft', bgClass: 'paper-style-kraft', color: '#f3ece1' },
  { id: 'slate', name: 'Midnight Slate', bgClass: 'paper-style-slate', color: '#18181b', isDark: true },
];

export default function LetterComposer({ isOpen, onClose, onLetterCreated }: LetterComposerProps) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [contentType, setContentType] = useState<'text' | 'draw'>('text');
  const [contentText, setContentText] = useState('');
  const [drawingData, setDrawingData] = useState<string | null>(null);
  const [paperStyle, setPaperStyle] = useState('ruled');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [crisisInfo, setCrisisInfo] = useState(false);

  if (!isOpen) return null;

  const currentPaper = PAPER_OPTIONS.find((p) => p.id === paperStyle) || PAPER_OPTIONS[2];
  const charPercent = Math.min(100, Math.round((contentText.length / MAX_CHARS) * 100));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setCrisisInfo(false);

    if (!recipientEmail.trim()) {
      setErrorMsg('Please enter a recipient email address.');
      return;
    }

    if (contentType === 'text' && !contentText.trim()) {
      setErrorMsg('Please write your letter before casting the bottle.');
      return;
    }

    if (contentType === 'draw' && !drawingData) {
      setErrorMsg('Please draw something on the page before sending.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          contentType,
          contentText: contentType === 'text' ? contentText : null,
          drawingData: contentType === 'draw' ? drawingData : null,
          paperStyle,
          fontStyle: 'mono',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to send letter');
        if (data.crisisSupport) {
          setCrisisInfo(true);
        }
        setIsSubmitting(false);
        return;
      }

      // Success
      setIsSubmitting(false);
      onLetterCreated();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Network error occurred while casting your letter. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-none flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="window-retro w-full max-w-2xl my-auto animate-in fade-in zoom-in-95 duration-100">
        {/* Retro Title Bar */}
        <div className="window-header">
          <div className="flex items-center gap-2">
            <span>[+] NEW LETTER // CAST_INTO_SEA.EXE</span>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-red-600 px-1 text-white text-xs font-bold border border-white"
          >
            <X size={12} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 bg-white space-y-4">
          {/* Recipient Email */}
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-black">
                To (Recipient Email Address):
              </label>
              <span className="text-[10px] text-gray-500 font-mono">
                [Encrypted with AES-256 // Never shown publicly]
              </span>
            </div>
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="e.g. someone.i.loved@domain.com or oldfriend@school.edu"
              className="w-full text-xs font-mono px-3 py-2 border border-black focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />
            <p className="text-[11px] text-gray-600 mt-1">
              They don&apos;t know you wrote this. If they ever log into bottlemail with this email, this letter will be waiting in their bottle inbox.
            </p>
          </div>

          {/* Mode & Paper Selector Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-b border-black py-2 text-xs">
            {/* Mode Toggle */}
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs uppercase mr-1">Format:</span>
              <button
                type="button"
                onClick={() => setContentType('text')}
                className={`px-3 py-1 text-xs border border-black font-bold ${
                  contentType === 'text' ? 'bg-black text-white' : 'bg-white text-black'
                }`}
              >
                Text Letter
              </button>
              <button
                type="button"
                onClick={() => setContentType('draw')}
                className={`px-3 py-1 text-xs border border-black font-bold ${
                  contentType === 'draw' ? 'bg-black text-white' : 'bg-white text-black'
                }`}
              >
                Draw / Sketch
              </button>
            </div>

            {/* Paper Color Swatches */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs uppercase mr-1">Paper:</span>
              {PAPER_OPTIONS.map((paper) => (
                <button
                  key={paper.id}
                  type="button"
                  onClick={() => setPaperStyle(paper.id)}
                  style={{ backgroundColor: paper.color }}
                  className={`w-6 h-6 border border-black relative ${
                    paperStyle === paper.id ? 'ring-2 ring-black ring-offset-1 scale-110' : 'opacity-80'
                  }`}
                  title={paper.name}
                />
              ))}
            </div>
          </div>

          {/* The Notebook Page */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-gray-700">Notebook Page View:</span>
              {contentType === 'text' && (
                <span className={`text-[11px] font-mono ${charPercent > 90 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                  {contentText.length} / {MAX_CHARS} chars ({charPercent}% of page full)
                </span>
              )}
            </div>

            <div
              className={`notebook-page w-full min-h-[300px] p-4 sm:p-6 ${currentPaper.bgClass} transition-colors`}
            >
              {/* Ruled Notebook Margin Line */}
              {paperStyle === 'ruled' && <div className="notebook-margin-line" />}

              {contentType === 'text' ? (
                <div className="relative">
                  <textarea
                    rows={9}
                    maxLength={MAX_CHARS}
                    value={contentText}
                    onChange={(e) => setContentText(e.target.value)}
                    placeholder="Write what you never got the chance to say..."
                    className={`w-full bg-transparent resize-none focus:outline-none text-sm font-mono leading-relaxed pl-8 sm:pl-10 placeholder-gray-400 ${
                      currentPaper.isDark ? 'text-zinc-100' : 'text-black'
                    }`}
                  />
                </div>
              ) : (
                <DrawingCanvas
                  isDarkPaper={!!currentPaper.isDark}
                  onDrawingChange={(data) => setDrawingData(data)}
                />
              )}
            </div>
          </div>

          {/* Error & Crisis Alert Banner */}
          {errorMsg && (
            <div className="border-2 border-black bg-white p-3 text-xs space-y-2">
              <div className="flex items-start gap-2 text-red-600 font-bold">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p>{errorMsg}</p>
                </div>
              </div>
              {crisisInfo && (
                <div className="bg-gray-100 p-2 border border-black text-[11px] text-black">
                  <strong>Helpline Support Available 24/7:</strong>
                  <p>In the US/Canada, call or text <strong>988</strong>.</p>
                  <p>In the UK, call <strong>111</strong>. In Australia, call <strong>13 11 14</strong>.</p>
                  <p>Worldwide directory: <a href="https://findahelpline.com" target="_blank" rel="noreferrer" className="underline font-bold">findahelpline.com</a></p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-black">
            <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1">
              <Info size={13} />
              <span>Free & anonymous. No registration required to send.</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn-retro text-xs"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-retro-black text-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send size={13} />
                {isSubmitting ? 'Casting Bottle...' : 'Cast Bottle Into Sea'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
