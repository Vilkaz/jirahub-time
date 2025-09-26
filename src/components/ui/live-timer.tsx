import { useEffect, useState } from 'react';
import { useTimeStore } from '../../stores/timeStore';
import { formatDuration, getElapsedTime } from '../../stores/timeStore';
import { cn } from '../../lib/utils';

interface LiveTimerProps {
  className?: string;
  showSeconds?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const LiveTimer = ({ 
  className, 
  showSeconds = true, 
  size = 'lg' 
}: LiveTimerProps) => {
  const { isTracking, activeSince, todayTotal } = useTimeStore();
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (isTracking && activeSince) {
      const updateTimer = () => {
        const elapsed = getElapsedTime(activeSince);
        setCurrentTime(todayTotal + elapsed);
      };

      // Update immediately
      updateTimer();

      // Then update every second
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setCurrentTime(todayTotal);
    }
  }, [isTracking, activeSince, todayTotal]);

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