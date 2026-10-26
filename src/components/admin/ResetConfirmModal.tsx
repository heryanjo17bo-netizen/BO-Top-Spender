import React, { useState } from 'react';
import { AlertTriangle, X, RotateCcw, Trash2 } from 'lucide-react';
import { OutletId } from '../../types/index.ts';

interface ResetConfirmModalProps {
  isOpen: boolean;
  outletId: OutletId;
  onClose: () => void;
  onConfirm: (mode: 'default' | 'empty') => Promise<void>;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  outletId,
  onClose,
  onConfirm,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAction = async (mode: 'default' | 'empty') => {
    setIsSubmitting(true);
    try {
      await onConfirm(mode);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm bg-[#131318] border border-amber-500/30 rounded-2xl p-5 shadow-2xl text-white text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-3 text-red-400">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="font-outfit font-extrabold text-lg text-white">
          Reset Outlet Leaderboard
        </h3>
        <p className="text-xs text-zinc-400 mt-1 mb-5">
          Are you sure you want to reset <span className="font-bold text-amber-300">{outletId}</span>? This will replace or clear all active participants.
        </p>

        <div className="space-y-2.5">
          <button
            onClick={() => handleAction('default')}
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-300 font-bold text-xs hover:bg-amber-400/25 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Standard 10 VIP Demo Seeds
          </button>

          <button
            onClick={() => handleAction('empty')}
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 font-bold text-xs hover:bg-red-900/60 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All to Empty (0 Participants)
          </button>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-400 font-semibold text-xs hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
