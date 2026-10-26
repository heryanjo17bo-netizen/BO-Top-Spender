import React, { useState } from 'react';
import { Lock, X, Delete } from 'lucide-react';
import { verifyVenuePin } from '../../services/api.ts';
import { OutletId } from '../../types/index.ts';

interface PinModalProps {
  isOpen: boolean;
  outletId: OutletId;
  onSuccess: () => void;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  outletId,
  onSuccess,
  onClose,
  title = 'Venue Staff Authorization',
  description = 'Enter 4-digit venue PIN to continue (Default: 8888)',
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');

      // Auto submit when 4 digits reached
      if (nextPin.length === 4) {
        verify(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const verify = async (code: string) => {
    setIsLoading(true);
    try {
      const ok = await verifyVenuePin(outletId, code);
      if (ok) {
        setPin('');
        setErrorMsg('');
        onSuccess();
      } else {
        setErrorMsg('Incorrect PIN. Please re-enter.');
        setPin('');
      }
    } catch {
      setErrorMsg('Verification failed. Try again.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xs bg-[#131318] border border-amber-500/30 rounded-2xl p-5 shadow-2xl text-white text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lock Icon */}
        <div className="w-12 h-12 rounded-full bg-[#D1B983]/15 border border-[#D1B983]/40 flex items-center justify-center mx-auto mb-3 text-[#D1B983]">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="font-outfit font-extrabold text-lg text-white">{title}</h3>
        <p className="text-xs text-zinc-400 mt-1 mb-4">{description}</p>

        {/* 4-Digit Display Indicator */}
        <div className="flex items-center justify-center gap-3 mb-4">
          {[0, 1, 2, 3].map((idx) => {
            const hasChar = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  hasChar
                    ? 'bg-[#D1B983] shadow-sm shadow-[#D1B983]/60 scale-110'
                    : 'bg-zinc-800 border border-zinc-700'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <p className="text-xs text-red-400 font-semibold mb-3 animate-shake">
            {errorMsg}
          </p>
        )}

        {/* Touch Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              disabled={isLoading || pin.length >= 4}
              className="h-14 rounded-xl bg-[#1A1A22] border border-zinc-800 text-xl font-tabular font-bold text-white hover:bg-zinc-800 active:bg-[#D1B983] active:text-black transition-colors"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-14 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => handleDigit('0')}
            disabled={isLoading || pin.length >= 4}
            className="h-14 rounded-xl bg-[#1A1A22] border border-zinc-800 text-xl font-tabular font-bold text-white hover:bg-zinc-800 active:bg-[#D1B983] active:text-black transition-colors"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
