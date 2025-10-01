/**
 * Time calculation utilities
 * Handles timezone and midnight crossing logic
 * ALL EXTENSIVE LOGGING FOR DEBUGGING
 */

/**
 * Format date as DD.MM.YYYY
 */
export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Get midnight (00:00:00) for a given date
 */
function getMidnight(date: Date): Date {
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  return midnight;
}

/**
 * Get next midnight after a given date
 */
function getNextMidnight(date: Date): Date {
  const midnight = getMidnight(date);
  midnight.setDate(midnight.getDate() + 1);
  return midnight;
}

/**
 * Calculate daily seconds split when a session crosses midnight
 *
 * @param startTime - When tracking started (Date object)
 * @param endTime - When tracking ended (Date object)
 * @returns Map of date strings to seconds
 *
 * Example:
 *   Start: 2025-10-01 23:50:00
 *   End:   2025-10-02 00:10:00
 *   Returns: { "01.10.2025": 600, "02.10.2025": 600 }
 */
export function calculateDailySeconds(
  startTime: Date,
  endTime: Date
): Record<string, number> {
  console.log('⏰ ========== CALCULATING DAILY SECONDS ==========');
  console.log('⏰ Start time:', startTime.toLocaleString());
  console.log('⏰ End time:', endTime.toLocaleString());
  console.log('⏰ User timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  console.log('⏰ Timezone offset (minutes):', -startTime.getTimezoneOffset());

  const startDate = formatDate(startTime);
  const endDate = formatDate(endTime);

  console.log('⏰ Start date:', startDate);
  console.log('⏰ End date:', endDate);

  // Simple case: same day
  if (startDate === endDate) {
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    console.log('⏰ SAME DAY - Duration:', durationSeconds, 'seconds');
    console.log('⏰ Result:', { [startDate]: durationSeconds });
    console.log('⏰ =================================================');
    return { [startDate]: durationSeconds };
  }

  // Different days - need to split at midnight
  console.log('⏰ CROSSING MIDNIGHT - Need to split');

  const result: Record<string, number> = {};
  let currentTime = startTime;

  while (currentTime < endTime) {
    const currentDate = formatDate(currentTime);
    const nextMidnight = getNextMidnight(currentTime);

    console.log('⏰ Processing day:', currentDate);
    console.log('⏰   Current time:', currentTime.toLocaleString());
    console.log('⏰   Next midnight:', nextMidnight.toLocaleString());

    // If end time is before next midnight, use end time
    const endOfDay = endTime < nextMidnight ? endTime : nextMidnight;
    const secondsThisDay = Math.floor((endOfDay.getTime() - currentTime.getTime()) / 1000);

    if (secondsThisDay > 0) {
      result[currentDate] = secondsThisDay;
      console.log('⏰   Seconds this day:', secondsThisDay);
    }

    // Move to next day
    currentTime = nextMidnight;
  }

  console.log('⏰ FINAL RESULT:', result);
  console.log('⏰ Total seconds:', Object.values(result).reduce((a, b) => a + b, 0));
  console.log('⏰ =================================================');

  return result;
}

/**
 * Format seconds as human readable time
 */
export function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Get current date string in DD.MM.YYYY format
 */
export function getCurrentDateString(): string {
  return formatDate(new Date());
}
