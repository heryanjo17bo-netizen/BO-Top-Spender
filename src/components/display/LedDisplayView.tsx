import React, { useEffect, useState } from 'react';
import { OutletId, OutletState, PromotionEvent } from '../../types/index.ts';
import { fetchOutletState, subscribeToOutlet } from '../../services/api.ts';
import { rankParticipants } from '../../utils/formatters.ts';
import { LedLeaderboard } from './LedLeaderboard.tsx';

interface LedDisplayViewProps {
  outletId: OutletId;
}

export const LedDisplayView: React.FC<LedDisplayViewProps> = ({ outletId }) => {
  const [state, setState] = useState<OutletState | null>(null);
  const [latestPromotion, setLatestPromotion] = useState<PromotionEvent | null>(null);
  const [viewportSize, setViewportSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Track window resizing to maintain scale math
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch initial state & connect to live SSE stream
  useEffect(() => {
    let isMounted = true;

    // Fetch initial state once
    fetchOutletState(outletId)
      .then((data) => {
        if (isMounted) {
          setState(data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch initial LED state:', err);
      });

    // Subscribe to SSE stream
    const unsubscribe = subscribeToOutlet(
      outletId,
      ({ state: updatedState, promotionEvent }) => {
        if (!isMounted) return;
        setState(updatedState);
        if (promotionEvent) {
          setLatestPromotion(promotionEvent);
        }
      },
      (status) => {
        // Retain last valid ranking if connection drops; silent recovery
        if (status === 'connected') {
          // Reconnected cleanly
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [outletId]);

  if (!state) {
    return (
      <div className="fixed inset-0 bg-transparent flex items-center justify-center pointer-events-none">
        {/* Subtle non-intrusive loading state */}
        <div className="w-8 h-8 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
      </div>
    );
  }

  const { settings } = state;
  const isBlackMode = settings.backgroundMode === 'black';

  // Calculate proportional scale to fit 2560x1440 canvas inside viewport
  const targetWidth = settings.outputWidth || 2560;
  const targetHeight = settings.outputHeight || 1440;

  const scaleX = viewportSize.width / targetWidth;
  const scaleY = viewportSize.height / targetHeight;
  const scale = Math.min(scaleX, scaleY);

  const ranked = rankParticipants(state.participants);

  const alignmentClass =
    settings.overlayAlignment === 'left'
      ? 'justify-start'
      : settings.overlayAlignment === 'right'
      ? 'justify-end'
      : 'justify-center';

  return (
    <div
      className={`fixed inset-0 overflow-hidden select-none cursor-none ${
        isBlackMode ? 'bg-black' : 'bg-transparent'
      }`}
      style={{
        backgroundColor: isBlackMode ? '#000000' : 'rgba(0, 0, 0, 0)',
      }}
    >
      {/* Centered Canvas Container with exact target aspect ratio (2560x1440) */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          width: '100vw',
          height: '100vh',
        }}
      >
        <div
          className={`relative flex items-center ${alignmentClass}`}
          style={{
            width: `${targetWidth}px`,
            height: `${targetHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            padding: `${settings.safeMargin || 60}px`,
          }}
        >
          {/* Main leaderboard card scaled comfortably inside the canvas */}
          <div
            className="w-full"
            style={{
              maxWidth: '2000px',
            }}
          >
            <LedLeaderboard
              rankedParticipants={ranked}
              settings={settings}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
