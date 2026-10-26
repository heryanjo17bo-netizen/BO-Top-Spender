import React from 'react';

interface LedPlaceholderRowProps {
  rank: number;
  rowHeight: number;
  rowGap: number;
  rowBackgroundOpacity: number;
}

export const LedPlaceholderRow: React.FC<LedPlaceholderRowProps> = ({
  rank,
  rowHeight,
  rowGap,
  rowBackgroundOpacity = 0.4,
}) => {
  const rankStr = rank.toString().padStart(2, '0');
  const topY = (rank - 1) * (rowHeight + rowGap);

  return (
    <div
      className="absolute left-0 right-0 rounded-2xl border border-dashed border-zinc-700/40 pointer-events-none"
      style={{
        top: `${topY}px`,
        height: `${rowHeight}px`,
        backgroundColor: `rgba(12, 12, 16, ${rowBackgroundOpacity * 0.4})`,
      }}
    >
      <div className="h-full grid grid-cols-[140px_1fr_280px_320px] items-center px-10 gap-6">
        {/* Column 1: Rank */}
        <div className="flex items-center">
          <span className="font-tabular font-bold text-4xl text-zinc-600/50">
            {rankStr}
          </span>
        </div>

        {/* Column 2: Empty placeholder name */}
        <div className="flex items-center">
          <span className="text-zinc-600/35 text-2xl tracking-[0.25em] font-mono">
            — — — — —
          </span>
        </div>

        {/* Column 3: Table placeholder */}
        <div className="flex items-center">
          <span className="text-zinc-600/30 text-sm sm:text-base font-mono tracking-wider">
            OPEN SLOT
          </span>
        </div>

        {/* Column 4: Amount */}
        <div className="text-right">
          <span className="font-tabular font-bold text-3xl text-zinc-600/35">
            0K
          </span>
        </div>
      </div>
    </div>
  );
};
