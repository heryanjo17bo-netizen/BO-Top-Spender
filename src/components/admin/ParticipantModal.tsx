import React, { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';
import { Participant } from '../../types/index.ts';
import { formatLedSpending, formatRupiah, formatThousands, parseRupiahInput } from '../../utils/formatters.ts';

interface ParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: { name: string; table: string; spending: number }) => Promise<void>;
  participantToEdit?: Participant | null;
  slotCount: number;
}

export const ParticipantModal: React.FC<ParticipantModalProps> = ({
  isOpen,
  onClose,
  onSave,
  participantToEdit,
  slotCount,
}) => {
  const isEditing = !!participantToEdit;

  const [name, setName] = useState('');
  const [table, setTable] = useState('');
  const [spendingRaw, setSpendingRaw] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (participantToEdit) {
        setName(participantToEdit.name);
        setTable(participantToEdit.table);
        setSpendingRaw(formatThousands(participantToEdit.spending));
      } else {
        setName('');
        setTable('');
        setSpendingRaw('');
      }
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [isOpen, participantToEdit]);

  if (!isOpen) return null;

  const parsedSpending = parseRupiahInput(spendingRaw);

  const handleSpendingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Extract only digits
    const digits = rawVal.replace(/\D/g, '');
    if (!digits) {
      setSpendingRaw('');
      return;
    }
    const num = parseInt(digits, 10);
    if (Number.isSafeInteger(num) && num >= 0) {
      setSpendingRaw(formatThousands(num));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = name.trim().toUpperCase();
    const trimmedTable = table.trim().toUpperCase();

    if (!trimmedName) {
      setErrorMsg('Please enter the guest name.');
      return;
    }
    if (!trimmedTable) {
      setErrorMsg('Please enter the table number or label.');
      return;
    }
    if (parsedSpending < 0) {
      setErrorMsg('Total spending cannot be negative.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSave({
        name: trimmedName,
        table: trimmedTable,
        spending: parsedSpending,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save participant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#131318] border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-lg sm:text-xl font-outfit font-extrabold text-white tracking-wide">
              {isEditing ? 'Edit Participant' : 'Add New Participant'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isEditing
                ? 'Update guest details and replace total spending'
                : `Slot ${slotCount + 1} of 10 available`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-zinc-800/80 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Field: Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#D1B983] mb-1.5">
              Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ALEXANDER"
              className="w-full bg-[#1A1A22] border border-zinc-700/80 focus:border-[#D1B983] rounded-xl px-4 py-3 text-base font-semibold text-white placeholder-zinc-600 focus:outline-none transition-colors"
              autoFocus={!isEditing}
            />
          </div>

          {/* Field: Table */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#D1B983] mb-1.5">
              Table
            </label>
            <input
              type="text"
              required
              value={table}
              onChange={(e) => setTable(e.target.value)}
              placeholder="e.g. TABLE 08 or VIP 02"
              className="w-full bg-[#1A1A22] border border-zinc-700/80 focus:border-[#D1B983] rounded-xl px-4 py-3 text-base font-semibold text-white placeholder-zinc-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Field: Total Spending (Rp) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#D1B983]">
                Total Spending (Rp)
              </label>
              <span className="text-[11px] text-zinc-400">
                Replaces total value
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-base">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9.]*"
                value={spendingRaw}
                onChange={handleSpendingChange}
                placeholder="0"
                className="w-full bg-[#1A1A22] border border-zinc-700/80 focus:border-[#D1B983] rounded-xl pl-12 pr-4 py-3 text-lg font-tabular font-bold text-white placeholder-zinc-600 focus:outline-none transition-colors"
              />
            </div>

            {/* LED Format Live Preview */}
            <div className="mt-2.5 flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-black/40 border border-[#D1B983]/30 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 font-medium">LED Screen Preview:</span>
                <span className="font-tabular font-extrabold text-sm text-[#D1B983]">
                  {formatLedSpending(parsedSpending)}
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 font-tabular">
                {formatRupiah(parsedSpending)}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-sm hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-[#D1B983] text-black font-extrabold text-sm hover:bg-[#EADCB9] active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#D1B983]/20"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
