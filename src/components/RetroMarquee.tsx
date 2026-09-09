'use client';

import React from 'react';

interface RetroMarqueeProps {
  totalCount: number;
}

export default function RetroMarquee({ totalCount }: RetroMarqueeProps) {
  return (
    <div className="border-b border-black bg-black text-white py-1 px-4 overflow-hidden text-xs font-mono select-none">
      <div className="flex items-center gap-6 whitespace-nowrap animate-pulse">
        <span>● BOTTLEMAIL ARCHIVE</span>
        <span>•</span>
        <span>{totalCount} bottles currently drifting in the sea</span>
        <span>•</span>
        <span>Recipient emails encrypted with AES-256-GCM</span>
        <span>•</span>
        <span>No sign-up required to send</span>
        <span>•</span>
        <span>Login with OTP to unlock your letters</span>
        <span>•</span>
        <span>Single notebook page limit</span>
      </div>
    </div>
  );
}
