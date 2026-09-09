'use client';

import React, { useState } from 'react';
import { PublicLetter } from '@/lib/db';
import LetterCard from './LetterCard';
import LetterModal from './LetterModal';
import { Search, Filter, Shuffle, RefreshCw } from 'lucide-react';

interface LetterGridProps {
  letters: PublicLetter[];
  totalCount: number;
  isLoading: boolean;
  filter: 'all' | 'text' | 'draw';
  onFilterChange: (filter: 'all' | 'text' | 'draw') => void;
  onLoadMore: () => void;
  hasMore: boolean;
  onRefresh: () => void;
}

export default function LetterGrid({
  letters,
  totalCount,
  isLoading,
  filter,
  onFilterChange,
  onLoadMore,
  hasMore,
  onRefresh,
}: LetterGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<PublicLetter | null>(null);

  // Client-side text filter for search query
  const filteredLetters = letters.filter((letter) => {
    if (!searchQuery.trim()) return true;
    if (letter.content_type === 'text' && letter.content_text) {
      return letter.content_text.toLowerCase().includes(searchQuery.toLowerCase().trim());
    }
    return false;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="border border-black bg-white p-3 shadow-retro flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Filter Buttons */}
        <div className="flex items-center gap-1">
          <span className="font-bold uppercase mr-1 flex items-center gap-1">
            <Filter size={12} /> Filter:
          </span>
          {(['all', 'text', 'draw'] as const).map((type) => (
            <button
              key={type}
              onClick={() => onFilterChange(type)}
              className={`px-2.5 py-1 border border-black font-bold uppercase text-[11px] ${
                filter === type ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {type === 'all' ? 'All Bottles' : type === 'text' ? 'Letters' : 'Sketches'}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search words in bottles..."
              className="w-full text-xs font-mono px-3 py-1.5 pl-7 border border-black focus:outline-none focus:ring-1 focus:ring-black bg-white"
            />
            <Search size={12} className="absolute left-2 top-2 text-gray-500" />
          </div>

          <button
            onClick={onRefresh}
            className="btn-retro text-xs py-1.5 px-2"
            title="Refresh feed"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Grid of Letters */}
      {isLoading && letters.length === 0 ? (
        <div className="py-20 text-center font-mono text-xs text-gray-500 border border-dashed border-black bg-white">
          [ Gathering drifting bottles from the shoreline... ]
        </div>
      ) : filteredLetters.length === 0 ? (
        <div className="py-16 text-center border border-black bg-white p-6 shadow-retro space-y-2">
          <p className="font-mono text-xs text-gray-600">
            No bottles match your filter or search query.
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="btn-retro text-xs mt-2"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredLetters.map((letter) => (
            <LetterCard
              key={letter.id}
              letter={letter}
              onClick={() => setSelectedLetter(letter)}
            />
          ))}
        </div>
      )}

      {/* Load More Pagination */}
      {hasMore && !searchQuery && (
        <div className="text-center pt-4">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="btn-retro text-xs px-6 py-2 uppercase tracking-wider"
          >
            {isLoading ? 'Fishing more bottles...' : 'Fish More Bottles From The Sea ↓'}
          </button>
        </div>
      )}

      {/* Letter Reading Modal */}
      {selectedLetter && (
        <LetterModal
          letter={selectedLetter}
          onClose={() => setSelectedLetter(null)}
        />
      )}
    </div>
  );
}
