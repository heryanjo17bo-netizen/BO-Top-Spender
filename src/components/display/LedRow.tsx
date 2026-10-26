import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Participant } from '../../types/index.ts';
import { AnimatedSpending } from './AnimatedSpending.tsx';

interface LedRowProps {
  participant: Participant;
  targetRank: number; // 1-indexed target rank (1..5, or 6 for exiting)
  displayRank: number; // 1-indexed rank number shown on badge
  isHighlighted: boolean; // 5-second gold celebration
  isPromoted: boolean; // currently climbing up
  isDescending: boolean; // currently falling down
  isExiting: boolean; // moving out of top 5
  isNewEntry?: boolean; // just entering from bottom
  rowHeight: number;
  rowGap: number;
  rowBackgroundOpacity: number;
  goldColor?: string;
  textColor?: string;
}

export const LedRow: React.FC<LedRowProps> = ({
  participant,
  targetRank,
  displayRank,
  isHighlighted,
  isPromoted,
  isDescending,
  isExiting,
  isNewEntry = false,
  rowHeight,
  rowGap,
  rowBackgroundOpacity = 0.6,
  goldColor = '#D1B983',
  textColor = '#FFFFFF',
}) => {
  const isRank1 = targetRank === 1;

  // Track sweep key for promotion light sweep
  const [sweepKey, setSweepKey] = useState<number>(0);

  useEffect(() => {
    if (isHighlighted || isPromoted) {
      setSweepKey((k) => k + 1);
    }
  }, [isHighlighted, isPromoted]);

  // Target Y coordinate based on rank: y = (rank - 1) * (rowHeight + rowGap)
  // For rank 6+ (exiting rows), target is 5 * (rowHeight + rowGap), sliding past the bottom edge
  const slotHeight = rowHeight + rowGap;
  const targetY = (Math.min(targetRank, 6) - 1) * slotHeight;

  const rankStr = displayRank.toString().padStart(2, '0');
  const isReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      layout={false} // Use explicit translateY coordinates instead of automatic layout to prevent jump cuts
      initial={
        isNewEntry
          ? {
              y: 5 * slotHeight,
              opacity: 0,
              scale: 0.98,
            }
          : false
      }
      animate={{
        y: targetY,
        opacity: isExiting ? 0 : 1,
        scale: isPromoted && !isReducedMotion ? 1.025 : 1,
        zIndex: isPromoted ? 50 : isExiting ? 5 : 30 - targetRank,
      }}
      transition={{
        // 1.8-second simultaneous smooth motion with cubic-bezier(0.22, 1, 0.36, 1)
        y: { duration: isReducedMotion ? 0.05 : 1.8, ease: [0.22, 1, 0.36, 1] },
        scale: { duration: isReducedMotion ? 0.05 : 1.8, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: isExiting ? (isReducedMotion ? 0.1 : 1.4) : 0.8 },
      }}
      className={`absolute left-0 right-0 rounded-2xl overflow-hidden transition-colors duration-700 ${
        isHighlighted
          ? 'border-2 border-[#D1B983] ring-4 ring-[#D1B983]/40 shadow-[0_0_55px_rgba(209,185,131,0.75)]'
          : isPromoted
          ? 'border-2 border-[#D1B983] ring-2 ring-[#D1B983]/60 shadow-[0_0_40px_rgba(209,185,131,0.6)]'
          : isRank1
          ? 'border-2 border-[#D1B983]/70 shadow-[0_0_35px_rgba(209,185,131,0.35)]'
          : 'border border-[#D1B983]/25'
      }`}
      style={{
        height: `${rowHeight}px`,
        backgroundColor:
          isHighlighted || isPromoted
            ? `rgba(24, 21, 16, ${Math.min(0.95, rowBackgroundOpacity + 0.25)})`
            : `rgba(12, 12, 16, ${rowBackgroundOpacity})`,
      }}
    >
      {/* Light sweep overlay during promotion movement or 5s celebration */}
      {(isHighlighted || isPromoted) && (
        <div
          key={sweepKey}
          className="absolute inset-0 pointer-events-none overflow-hidden z-20"
        >
          <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#EADCB9]/40 to-transparent animate-gold-sweep" />
        </div>
      )}

      {/* Rank 1 decorative golden hairline */}
      {isRank1 && (
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-[#D1B983] to-transparent z-10" />
      )}

      {/* Inner Structured Row Content (Grid with fixed proportions) */}
      <div className="h-full grid grid-cols-[140px_1fr_280px_320px] items-center px-10 gap-6">
        {/* Column 1: Rank Number */}
        <div className="flex items-center">
          <span
            className={`font-tabular font-black text-4xl sm:text-5xl tracking-tight transition-colors duration-500 ${
              isHighlighted || isRank1 || isPromoted ? 'text-gold-glow' : ''
            }`}
            style={{
              color: isRank1 || isHighlighted || isPromoted ? '#EADCB9' : goldColor,
            }}
          >
            {rankStr}
          </span>
        </div>

        {/* Column 2: Guest Name (Truncates cleanly without shifting other columns) */}
        <div className="min-w-0 pr-6">
          <span
            className="block font-outfit font-black text-3xl sm:text-4xl tracking-wider uppercase truncate leading-tight transition-colors duration-500"
            style={{ color: textColor }}
            title={participant.name}
          >
            {participant.name}
          </span>
        </div>

        {/* Column 3: Table Label */}
        <div className="min-w-0 text-left">
          <span className="inline-block text-base sm:text-lg font-bold tracking-widest uppercase text-zinc-300/90 bg-white/5 px-4 py-1.5 rounded-lg border border-white/10 truncate">
            {participant.table}
          </span>
        </div>

        {/* Column 4: Formatted Spending (Right-aligned, count-up over ~1s) */}
        <div className="text-right flex items-center justify-end">
          <AnimatedSpending
            value={participant.spending}
            duration={1000}
            className={`font-tabular font-black text-4xl sm:text-5xl tracking-tight transition-colors duration-500 ${
              isHighlighted || isRank1 || isPromoted ? 'text-gold-glow' : ''
            }`}
            style={{
              color: isRank1 || isHighlighted || isPromoted ? '#EADCB9' : goldColor,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};
