import React, { useEffect, useRef, useState } from 'react';
import { formatLedSpending } from '../../utils/formatters.ts';

interface AnimatedSpendingProps {
  value: number;
  className?: string;
  duration?: number; // ms, default 1300
  style?: React.CSSProperties;
}

export const AnimatedSpending: React.FC<AnimatedSpendingProps> = ({
  value,
  className = '',
  duration = 1300,
  style,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const prevValueRef = useRef<number>(value);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const targetVal = value;
    prevValueRef.current = targetVal;

    if (startVal === targetVal) {
      setDisplayValue(targetVal);
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth ease-out cubic curve
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (targetVal - startVal) * ease);

      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetVal);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value, duration]);

  return (
    <span style={style} className={className}>
      {formatLedSpending(displayValue)}
    </span>
  );
};
