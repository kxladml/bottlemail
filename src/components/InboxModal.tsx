'use client';

import React, { useEffect, useState } from 'react';
import { PublicLetter } from '@/lib/db';
import LetterCard from './LetterCard';
import LetterModal from './LetterModal';
import { X, LogOut, Inbox, RefreshCw } from 'lucide-react';

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function InboxModal({ isOpen, onClose, onLogout }: InboxModalProps) {
  const [letters, setLetters] = useState<PublicLetter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState<PublicLetter | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchInbox = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/inbox');
      if (!res.ok) {
        if (res.status === 401) {
          onLogout();
          return;
        }
        throw new Error('Failed to load inbox');
      }
      const data = await res.json();
      setLetters(data.letters || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not fetch inbox messages.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInbox();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-none flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <div className="window-retro w-full max-w-4xl my-auto animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] flex flex-col">
          {/* Title Bar */}
          <div className="window-header shrink-0">
            <div className="flex items-center gap-2">
              <Inbox size={13} />
              <span>PRIVATE_INBOX // BOTTLES_FOUND.LOG</span>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-red-600 px-1 text-white text-xs font-bold border border-white"
            >
              <X size={12} />
            </button>
          </div>

          {/* Subheader Toolbar */}
          <div className="p-4 bg-white border-b border-black flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div>
              <h2 className="font-bold text-sm uppercase tracking-wider text-black">
                Your Secret Bottle Inbox
              </h2>
              <p className="text-xs text-gray-600 font-mono">
                {letters.length === 1
                  ? '1 letter has washed ashore for your email address.'
                  : `${letters.length} letters have washed ashore for your email address.`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchInbox}
                className="btn-retro text-xs flex items-center gap-1"
                title="Refresh inbox"
              >
                <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button
                onClick={onLogout}
                className="btn-retro text-xs text-red-600 border-red-600 flex items-center gap-1 hover:bg-red-50"
              >
                <LogOut size={12} />
                Lock / Logout
              </button>
            </div>
          </div>

          {/* Letter List */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-gray-50">
            {isLoading ? (
              <div className="py-16 text-center font-mono text-xs text-gray-500">
                [ Searching the shoreline for your bottles... ]
              </div>
            ) : errorMsg ? (
              <div className="p-4 border border-red-600 bg-red-50 text-red-700 text-xs font-mono">
                {errorMsg}
              </div>
            ) : letters.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="text-3xl font-mono">[ 0 ]</div>
                <h3 className="font-bold text-sm text-black">No bottles have arrived for you yet.</h3>
                <p className="text-xs text-gray-600 max-w-md mx-auto font-mono">
                  The sea is vast and silent. When someone sends an anonymous letter to your email on bottlemail,
                  it will be preserved here for you.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {letters.map((letter) => (
                  <LetterCard
                    key={letter.id}
                    letter={letter}
                    onClick={() => setSelectedLetter(letter)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-3 bg-white border-t border-black flex items-center justify-between text-[11px] font-mono shrink-0">
            <span className="text-gray-500">
              Only you can see these letters. Stored with AES-256 encryption.
            </span>
            <button onClick={onClose} className="btn-retro text-xs">
              Close Inbox
            </button>
          </div>
        </div>
      </div>

      {/* Full Letter Modal */}
      {selectedLetter && (
        <LetterModal
          letter={selectedLetter}
          onClose={() => setSelectedLetter(null)}
        />
      )}
    </>
  );
}
