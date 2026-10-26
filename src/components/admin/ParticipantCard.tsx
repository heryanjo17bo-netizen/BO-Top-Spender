import React from 'react';
import { Edit2, Trash2, Award } from 'lucide-react';
import { RankedParticipant } from '../../types/index.ts';
import { formatLedSpending, formatRupiah } from '../../utils/formatters.ts';

interface ParticipantCardProps {
  participant: RankedParticipant;
  onEdit: (p: RankedParticipant) => void;
  onDelete: (p: RankedParticipant) => void;
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({
  participant,
  onEdit,
  onDelete,
}) => {
  const isTop5 = participant.rank <= 5;
  const isRank1 = participant.rank === 1;

  return (
    <div
      className={`relative w-full rounded-xl transition-all duration-300 p-3.5 sm:p-4 border ${
        isRank1
          ? 'bg-gradient-to-r from-[#D1B983]/15 via-[#16161D] to-[#121217] border-[#D1B983]/60 shadow-lg shadow-[#D1B983]/10'
          : isTop5
          ? 'bg-[#15151B] border-[#D1B983]/25'
          : 'bg-[#111115] border-zinc-800/80'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Rank Badge + Guest Details */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          {/* Rank Number Circle */}
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center shrink-0 font-tabular font-extrabold text-base sm:text-lg border ${
              isRank1
                ? 'bg-[#D1B983] text-black border-[#EADCB9] shadow-md shadow-[#D1B983]/30'
                : isTop5
                ? 'bg-[#D1B983]/15 text-[#D1B983] border-[#D1B983]/40'
                : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50'
            }`}
          >
            #{participant.rank}
          </div>

          {/* Info: Name, Table, LIVE badge */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-outfit font-extrabold text-white text-base sm:text-lg uppercase tracking-wide truncate">
                {participant.name}
              </span>
              {isTop5 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#D1B983]/15 text-[#D1B983] border border-[#D1B983]/40 shrink-0">
                  <Award className="w-3 h-3 text-[#D1B983]" />
                  LIVE TOP 5
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 mt-0.5 text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase">
                {participant.table}
              </span>
              <span className="text-zinc-600">·</span>
              <span className="text-[11px] text-zinc-500">ID: {participant.id.slice(-6)}</span>
            </div>
          </div>
        </div>

        {/* Right: Spending Displays + Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right flex flex-col items-end">
            <span className="font-tabular font-bold text-sm sm:text-base text-white tracking-tight">
              {formatRupiah(participant.spending)}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                LED:
              </span>
              <span className="font-tabular font-extrabold text-xs sm:text-sm text-[#D1B983]">
                {formatLedSpending(participant.spending)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 pl-1 border-l border-zinc-800/80">
            <button
              onClick={() => onEdit(participant)}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-300 bg-[#1A1A22] border border-zinc-700/50 hover:text-[#D1B983] hover:border-[#D1B983]/50 active:scale-95 transition-all"
              title="Edit Participant"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(participant)}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-400 bg-[#1A1A22] border border-zinc-700/50 hover:text-red-400 hover:border-red-500/50 active:scale-95 transition-all"
              title="Delete Participant"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
