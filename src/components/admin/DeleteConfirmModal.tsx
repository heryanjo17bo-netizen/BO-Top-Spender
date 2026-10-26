import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { RankedParticipant } from '../../types/index.ts';
import { formatRupiah } from '../../utils/formatters.ts';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  participant: RankedParticipant | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  participant,
  onClose,
  onConfirm,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !participant) return null;

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm bg-[#131318] border border-red-500/30 rounded-2xl p-5 shadow-2xl text-white text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-3 text-red-400">
          <Trash2 className="w-6 h-6" />
        </div>

        <h3 className="font-outfit font-extrabold text-lg text-white">
          Remove Participant?
        </h3>

        <div className="my-3 p-3 rounded-xl bg-[#1A1A22] border border-zinc-800 text-left">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-white text-sm uppercase">
              {participant.name}
            </span>
            <span className="text-xs font-semibold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              #{participant.rank}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-zinc-400">
            <span>{participant.table}</span>
            <span className="font-tabular font-bold text-zinc-200">
              {formatRupiah(participant.spending)}
            </span>
          </div>
        </div>

        <p className="text-xs text-zinc-400 mb-4">
          This participant will be removed from the leaderboard rankings immediately.
        </p>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-500 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              'Confirm Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
