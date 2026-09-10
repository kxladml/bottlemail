'use client';

import React, { useState } from 'react';
import { X, Mail, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

export default function AuthModal({ isOpen, onClose, onAuthenticated }: AuthModalProps) {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to send OTP');
        setIsLoading(false);
        return;
      }

      setStep('otp');
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit code.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: otpCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Invalid code');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onAuthenticated();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Verification failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-none flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="window-retro w-full max-w-md my-auto animate-in fade-in zoom-in-95 duration-100">
        {/* Window Title Bar */}
        <div className="window-header">
          <div className="flex items-center gap-2">
            <span>INBOX_AUTH // VERIFY_IDENTITY.EXE</span>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-red-600 px-1 text-white text-xs font-bold border border-white"
          >
            <X size={12} />
          </button>
        </div>

        <div className="p-5 sm:p-6 bg-white space-y-4">
          <div className="border-b border-black pb-3">
            <h2 className="font-bold text-sm uppercase tracking-wider text-black">
              Check Your Received Letters
            </h2>
            <p className="text-xs text-gray-600 font-mono mt-1">
              Enter your email to verify ownership. A 6-digit code will be sent to your inbox.
            </p>
          </div>

          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold font-mono mb-1 uppercase">
                  Your Email Address:
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full text-xs font-mono px-3 py-2 border border-black focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  />
                </div>
                <p className="text-[11px] text-gray-500 font-mono mt-1">
                  We never send spam or newsletters. Your email is checked against the encrypted recipient index.
                </p>
              </div>

              {errorMsg && (
                <div className="border border-red-600 bg-red-50 p-2.5 text-xs text-red-700 flex items-center gap-2 font-mono">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-black">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-retro text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-retro-black text-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Mail size={13} />
                  {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold font-mono uppercase">
                    Enter 6-Digit Code:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setErrorMsg(null);
                    }}
                    className="text-[10px] text-gray-600 underline hover:text-black font-mono"
                  >
                    Change email
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.5em] text-lg font-mono px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white font-bold"
                />
                <p className="text-[11px] text-gray-500 font-mono mt-1">
                  Check your inbox (and spam folder) for the 6-digit code.
                </p>
              </div>

              {errorMsg && (
                <div className="border border-red-600 bg-red-50 p-2.5 text-xs text-red-700 flex items-center gap-2 font-mono">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-black">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="btn-retro text-xs"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-retro-black text-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <KeyRound size={13} />
                  {isLoading ? 'Verifying...' : 'Unlock My Inbox'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
