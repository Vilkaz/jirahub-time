import { useEffect, useState } from 'react';
import { useTimeStore } from '../../stores/timeStore';
import { formatDuration, getElapsedTime } from '../../stores/timeStore';
import { cn } from '../../lib/utils';

interface LiveTimerProps {
  className?: string;
  showSeconds?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  sessionOnly?: boolean; // If true, only show current session time, not accumulated
}

export const LiveTimer = ({
  className,
  showSeconds = true,
  size = 'lg',
  sessionOnly = false
}: LiveTimerProps) => {
  const { isTracking, activeSince, todayTotal } = useTimeStore();
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (isTracking && activeSince) {
      const updateTimer = () => {
        const elapsed = getElapsedTime(activeSince);
        // If sessionOnly, show just current session elapsed time
        // Otherwise, show total including todayTotal
        setCurrentTime(sessionOnly ? elapsed : todayTotal + elapsed);
      };

      // Update immediately
      updateTimer();

      // Then update every second
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setCurrentTime(sessionOnly ? 0 : todayTotal);
    }
  }, [isTracking, activeSince, todayTotal, sessionOnly]);

  const sizeClasses = {
    sm: 'text-lg font-semibold',
    md: 'text-2xl font-bold',
    lg: 'text-4xl md:text-5xl font-bold',
    xl: 'text-5xl md:text-6xl font-bold',
  };

  const formattedTime = showSeconds 
    ? formatDuration(currentTime)
    : formatDuration(Math.floor(currentTime / 60) * 60);

  return (
    <div className={cn(
      'font-mono tracking-tight',
      sizeClasses[size],
      isTracking && 'text-gradient animate-pulse-gentle',
      !isTracking && 'text-muted-foreground',
      className
    )}>
      {formattedTime}
    </div>
  );
};