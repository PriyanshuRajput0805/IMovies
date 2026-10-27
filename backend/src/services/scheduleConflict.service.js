import { Show } from '../models/show.model.js';

/**
 * Convert "HH:mm" time string into minutes from midnight
 * @param {string} timeStr - e.g. "14:30"
 * @returns {number} minutes from midnight (e.g. 870)
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes from midnight back to "HH:mm"
 * @param {number} totalMinutes
 * @returns {string} e.g. "17:10"
 */
export const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Calculate expected end time given a start time, movie duration in minutes, and optional cleaning buffer
 * @param {string} startTime - e.g. "14:30"
 * @param {number} durationMinutes - e.g. 150
 * @param {number} bufferMinutes - e.g. 20
 * @returns {string} e.g. "17:20"
 */
export const calculateEndTime = (startTime, durationMinutes, bufferMinutes = 20) => {
  const startMins = timeToMinutes(startTime);
  const endMins = startMins + durationMinutes + bufferMinutes;
  return minutesToTime(endMins);
};

/**
 * Check if a proposed show schedule collides with existing shows on the same screen
 * @param {Object} params
 * @param {string} params.screenId
 * @param {Date|string} params.showDate
 * @param {string} params.startTime - "HH:mm"
 * @param {string} params.endTime - "HH:mm"
 * @param {string} [params.excludeShowId] - Optional show ID to exclude (when editing)
 * @param {number} [params.turnaroundBufferMinutes=15] - Interval needed between shows
 * @returns {Promise<{ hasConflict: boolean, conflictingShow?: Object, message?: string }>}
 */
export const checkScheduleConflict = async ({
  screenId,
  showDate,
  startTime,
  endTime,
  excludeShowId = null,
  turnaroundBufferMinutes = 15
}) => {
  // Normalize showDate to match exact day (00:00:00 to 23:59:59)
  const targetDate = new Date(showDate);
  const startOfDay = new Date(targetDate);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const query = {
    screenId,
    showDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: 'cancelled' }
  };

  if (excludeShowId) {
    query._id = { $ne: excludeShowId };
  }

  // Fetch all existing shows for this screen on this date
  const existingShows = await Show.find(query).populate('movieId', 'title duration');

  const proposedStart = timeToMinutes(startTime);
  const proposedEnd = timeToMinutes(endTime) + turnaroundBufferMinutes;

  for (const existing of existingShows) {
    const existingStart = timeToMinutes(existing.startTime);
    const existingEnd = timeToMinutes(existing.endTime) + turnaroundBufferMinutes;

    // Check interval overlap: max(startA, startB) < min(endA, endB)
    const overlapStart = Math.max(proposedStart, existingStart);
    const overlapEnd = Math.min(proposedEnd, existingEnd);

    if (overlapStart < overlapEnd) {
      const movieTitle = existing.movieId?.title || 'Another Movie';
      return {
        hasConflict: true,
        conflictingShow: existing,
        message: `Schedule conflict: Screen already has '${movieTitle}' scheduled from ${existing.startTime} to ${existing.endTime} (including ${turnaroundBufferMinutes}-min turnaround).`
      };
    }
  }

  return { hasConflict: false };
};
