'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Header from '@/components/Header';
import RetroMarquee from '@/components/RetroMarquee';
import LetterGrid from '@/components/LetterGrid';
import LetterComposer from '@/components/LetterComposer';
import AuthModal from '@/components/AuthModal';
import InboxModal from '@/components/InboxModal';
import LetterModal from '@/components/LetterModal';
import Footer from '@/components/Footer';
import { PublicLetter } from '@/lib/db';
import { Plus, Mail } from 'lucide-react';

function BottleMailApp() {
  const [letters, setLetters] = useState<PublicLetter[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'text' | 'draw'>('all');
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);

  // Modals
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sharedLetter, setSharedLetter] = useState<PublicLetter | null>(null);

  // Check auth state
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setIsAuthenticated(!!data.authenticated);
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Check URL parameter for shared bottle (e.g. ?bottle=uuid)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const bottleId = params.get('bottle');
    if (bottleId) {
      fetch(`/api/letters?id=${bottleId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.letter) {
            setSharedLetter(data.letter);
          }
        })
        .catch((err) => console.error('Error opening shared bottle:', err));
    }
  }, []);

  // Fetch letters
  const fetchLetters = useCallback(async (currentOffset = 0, currentFilter = filter, append = false) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/letters?filter=${currentFilter}&offset=${currentOffset}&limit=24`);
      const data = await res.json();
      if (res.ok) {
        if (append) {
          setLetters((prev) => [...prev, ...(data.letters || [])]);
        } else {
          setLetters(data.letters || []);
        }
        setTotalCount(data.totalCount || 0);
        setHasMore(data.hasMore || false);
        setOffset(currentOffset);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLetters(0, filter, false);
  }, [fetchLetters, filter]);

  // Handle global Escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsComposerOpen(false);
        setIsAuthOpen(false);
        setIsInboxOpen(false);
        setSharedLetter(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFilterChange = (newFilter: 'all' | 'text' | 'draw') => {
    setFilter(newFilter);
    setOffset(0);
    fetchLetters(0, newFilter, false);
  };

  const handleLoadMore = () => {
    const nextOffset = offset + 24;
    fetchLetters(nextOffset, filter, true);
  };

  const handleLetterCreated = () => {
    fetchLetters(0, filter, false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setIsInboxOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    setIsInboxOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <Header
        onOpenComposer={() => setIsComposerOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenInbox={() => setIsInboxOpen(true)}
        isAuthenticated={isAuthenticated}
      />

      {/* Retro Marquee Banner */}
      <RetroMarquee totalCount={totalCount} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Retro Hero Box */}
        <section className="window-retro p-6 sm:p-8 bg-white">
          <div className="max-w-3xl space-y-4">
            <div className="inline-block border border-black bg-black text-white px-2 py-0.5 text-xs font-bold font-mono">
              PROJECT ARCHIVE // UNSENT MESSAGES IN A BOTTLE
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-mono uppercase text-black leading-snug">
              What did you never send?
            </h2>

            <p className="text-xs sm:text-sm font-mono text-gray-700 leading-relaxed">
              <strong>bottlemail</strong> is an anonymous sanctuary inspired by The Unsent Project.
              Instead of names, letters are addressed to an <strong>email address</strong>.
              Letters drift openly at sea for anyone to read.
              If the recipient ever logs in with their email, all their bottles will be waiting.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsComposerOpen(true)}
                className="btn-retro-black text-xs flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Cast a Bottle into the Sea</span>
              </button>

              <button
                onClick={() => (isAuthenticated ? setIsInboxOpen(true) : setIsAuthOpen(true))}
                className="btn-retro text-xs flex items-center gap-1.5"
              >
                <Mail size={14} />
                <span>Check If You Have Received Any Letters</span>
              </button>
            </div>
          </div>
        </section>

        {/* The Letters Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className="font-extrabold text-sm sm:text-base font-mono uppercase tracking-wider flex items-center gap-2">
              <span>Drifting Bottles</span>
              <span className="text-xs font-normal text-gray-500 font-mono">
                ({totalCount} drifting)
              </span>
            </h3>

            <span className="text-[11px] font-mono text-gray-500 hidden sm:inline">
              Click any bottle note to read in full
            </span>
          </div>

          <LetterGrid
            letters={letters}
            totalCount={totalCount}
            isLoading={isLoading}
            filter={filter}
            onFilterChange={handleFilterChange}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            onRefresh={() => fetchLetters(0, filter, false)}
          />
        </section>
      </main>

      {/* Modals */}
      <LetterComposer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onLetterCreated={handleLetterCreated}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthenticated={handleAuthenticated}
      />

      <InboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        onLogout={handleLogout}
      />

      {/* Shared Letter Modal (opened via URL ?bottle=...) */}
      {sharedLetter && (
        <LetterModal
          letter={sharedLetter}
          onClose={() => {
            setSharedLetter(null);
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.delete('bottle');
              window.history.replaceState({}, '', url.toString());
            }
          }}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-mono text-xs">[ Loading bottlemail... ]</div>}>
      <BottleMailApp />
    </Suspense>
  );
}
