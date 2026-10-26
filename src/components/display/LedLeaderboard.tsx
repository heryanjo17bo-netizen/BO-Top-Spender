import React, { useEffect, useRef, useState } from 'react';
import { DisplaySettings, Participant, RankedParticipant } from '../../types/index.ts';
import { LedRow } from './LedRow.tsx';
import { LedPlaceholderRow } from './LedPlaceholderRow.tsx';

interface LedLeaderboardProps {
  rankedParticipants: RankedParticipant[];
  settings: DisplaySettings;
}

interface VisualItem {
  id: string; // permanent participant ID
  participant: Participant;
  targetRank: number; // 1-indexed target rank (1..5, or 6 for exiting)
  displayRank: number; // 1-indexed rank number displayed on badge
  isHighlighted: boolean; // 5-second post-movement gold celebration
  isPromoted: boolean; // climbing up during 1.8s motion
  isDescending: boolean; // shifting down
  isExiting: boolean; // moving past bottom edge
  isNewEntry: boolean; // entering from below bottom edge
}

export const LedLeaderboard: React.FC<LedLeaderboardProps> = ({
  rankedParticipants,
  settings,
}) => {
  // Active rows currently being rendered inside the absolute container
  const [visualItems, setVisualItems] = useState<VisualItem[]>(() => {
    // Initial mount: top 5 participants directly rendered without animations
    return rankedParticipants.slice(0, 5).map((p) => ({
      id: p.id,
      participant: p,
      targetRank: p.rank,
      displayRank: p.rank,
      isHighlighted: false,
      isPromoted: false,
      isDescending: false,
      isExiting: false,
      isNewEntry: false,
    }));
  });

  // Track previous authoritative positions for all 10 participants
  const previousPositionsRef = useRef<Map<string, number>>(
    new Map(rankedParticipants.map((p) => [p.id, p.rank]))
  );

  const isInitialMountRef = useRef<boolean>(true);
  const cleanupTimerRef = useRef<any>(null);
  const highlightTimersRef = useRef<Map<string, any>>(new Map());

  // Fixed geometry for 2560 x 1440 canvas
  const ROW_HEIGHT = 145;
  const ROW_GAP = settings.rowSpacing || 25;
  const SLOT_HEIGHT = ROW_HEIGHT + ROW_GAP;
  const CONTAINER_HEIGHT = 5 * ROW_HEIGHT + 4 * ROW_GAP; // 825px for 5 rows

  // Handle incoming authoritative updates
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      // Populate initial positions for all participants
      previousPositionsRef.current = new Map(rankedParticipants.map((p) => [p.id, p.rank]));
      return;
    }

    // Cancel pending exit cleanup if a rapid update arrives
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    const prevPositions = previousPositionsRef.current;
    const currentTop10 = rankedParticipants;
    const currentRanksMap = new Map(currentTop10.map((p) => [p.id, p.rank]));

    // Check which participants are climbing or falling
    const climbingIds = new Set<string>();
    const fallingIds = new Set<string>();

    currentTop10.forEach((p) => {
      const prev = prevPositions.get(p.id) ?? 99;
      if (p.rank < prev) {
        climbingIds.add(p.id);
      } else if (p.rank > prev) {
        fallingIds.add(p.id);
      }
    });

    setVisualItems((prevVisualItems) => {
      const existingMap = new Map(prevVisualItems.map((item) => [item.id, item]));
      const nextItems: VisualItem[] = [];

      // 1. Process participants whose new rank is within Top 5
      currentTop10.forEach((p) => {
        if (p.rank <= 5) {
          const existing = existingMap.get(p.id);
          const isClimbing = climbingIds.has(p.id);
          const isFalling = fallingIds.has(p.id);

          if (existing) {
            // Existing item in view: smoothly animate to new target rank
            nextItems.push({
              ...existing,
              participant: p,
              targetRank: p.rank,
              isPromoted: isClimbing,
              isDescending: isFalling,
              isExiting: false,
              isNewEntry: false,
            });
          } else {
            // New participant entering top 5 from ranks 6-10 or newly created
            nextItems.push({
              id: p.id,
              participant: p,
              targetRank: p.rank,
              displayRank: p.rank,
              isHighlighted: false,
              isPromoted: isClimbing || true,
              isDescending: false,
              isExiting: false,
              isNewEntry: true, // starts from y = 5 * SLOT_HEIGHT
            });
          }
        }
      });

      // 2. Identify any participant previously in visualItems who was displaced out of Top 5
      prevVisualItems.forEach((item) => {
        const newRank = currentRanksMap.get(item.id) ?? 99;
        if (newRank > 5 && !item.isExiting) {
          // Animate down past bottom edge to position 6 and fade out
          const updatedParticipant = currentTop10.find((p) => p.id === item.id) || item.participant;
          nextItems.push({
            ...item,
            participant: updatedParticipant,
            targetRank: 6, // target just below visible window
            isExiting: true,
            isPromoted: false,
            isDescending: true,
            isNewEntry: false,
          });
        }
      });

      return nextItems;
    });

    // Schedule post-transition cleanup after 1.8s motion completes
    cleanupTimerRef.current = setTimeout(() => {
      setVisualItems((latestItems) => {
        // Remove exited rows and settle visual ranks
        const remaining = latestItems.filter((item) => !item.isExiting);

        return remaining.map((item) => {
          const wasPromoted = item.isPromoted;

          // If participant finished climbing, activate 5.0 second celebration highlight
          if (wasPromoted) {
            // Clear prior highlight timer for this participant if any
            if (highlightTimersRef.current.has(item.id)) {
              clearTimeout(highlightTimersRef.current.get(item.id));
            }

            // Set 5.0 second timer to fade out highlight
            const hTimer = setTimeout(() => {
              setVisualItems((current) =>
                current.map((ci) => (ci.id === item.id ? { ...ci, isHighlighted: false } : ci))
              );
              highlightTimersRef.current.delete(item.id);
            }, 5000);

            highlightTimersRef.current.set(item.id, hTimer);
          }

          return {
            ...item,
            displayRank: item.targetRank,
            isPromoted: false,
            isDescending: false,
            isHighlighted: wasPromoted ? true : item.isHighlighted,
            isNewEntry: false,
          };
        });
      });
    }, 1800);

    // Save positions for subsequent delta calculations
    previousPositionsRef.current = new Map(rankedParticipants.map((p) => [p.id, p.rank]));

    return () => {
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
      }
    };
  }, [rankedParticipants]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
      highlightTimersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const goldColor = settings.goldAccentColor || '#D1B983';

  // Count active non-exiting items to determine if placeholder slots are needed
  const activeCount = visualItems.filter((i) => !i.isExiting).length;
  const missingSlots = Math.max(0, 5 - activeCount);

  return (
    <div
      className="w-full flex flex-col items-center"
      style={{
        transform: `scale(${settings.fontScale || 1.0})`,
        transformOrigin:
          settings.overlayAlignment === 'left'
            ? 'top left'
            : settings.overlayAlignment === 'right'
            ? 'top right'
            : 'top center',
      }}
    >
      {/* Header Block (Scaled for 2560x1440 canvas) */}
      <div className="flex flex-col items-center justify-center text-center mb-8">
        {/* BLACK OWL Wordmark */}
        <div className="flex items-center gap-4">
          <div className="h-[2px] w-20 bg-gradient-to-r from-transparent to-[#D1B983]" />
          <span
            className="font-cinzel text-xl sm:text-2xl font-bold tracking-[0.45em] uppercase drop-shadow-[0_0_15px_rgba(209,185,131,0.5)]"
            style={{ color: goldColor }}
          >
            BLACK OWL
          </span>
          <div className="h-[2px] w-20 bg-gradient-to-l from-transparent to-[#D1B983]" />
        </div>

        {/* Heading: TOP SPENDER */}
        <h1
          className="font-outfit font-black text-6xl sm:text-7xl tracking-wider uppercase mt-2 text-gold-glow"
          style={{ color: goldColor }}
        >
          {settings.headingText || 'TOP SPENDER'}
        </h1>
      </div>

      {/* Leaderboard Viewport with explicit relative wrapper and overflow hidden */}
      <div
        className="relative w-full rounded-3xl"
        style={{
          height: `${CONTAINER_HEIGHT}px`,
          overflow: 'hidden', // Rows entering/exiting slide cleanly through the bottom boundary
        }}
      >
        {/* Render placeholder rows if fewer than 5 participants exist */}
        {missingSlots > 0 &&
          Array.from({ length: missingSlots }).map((_, idx) => (
            <LedPlaceholderRow
              key={`placeholder_${activeCount + idx + 1}`}
              rank={activeCount + idx + 1}
              rowHeight={ROW_HEIGHT}
              rowGap={ROW_GAP}
              rowBackgroundOpacity={settings.rowBackgroundOpacity ?? 0.6}
            />
          ))}

        {/* Render participant rows with stable permanent IDs as keys */}
        {visualItems.map((item) => (
          <LedRow
            key={item.id}
            participant={item.participant}
            targetRank={item.targetRank}
            displayRank={item.displayRank}
            isHighlighted={item.isHighlighted}
            isPromoted={item.isPromoted}
            isDescending={item.isDescending}
            isExiting={item.isExiting}
            isNewEntry={item.isNewEntry}
            rowHeight={ROW_HEIGHT}
            rowGap={ROW_GAP}
            rowBackgroundOpacity={settings.rowBackgroundOpacity ?? 0.6}
            goldColor={goldColor}
            textColor={settings.textColor}
          />
        ))}
      </div>
    </div>
  );
};
