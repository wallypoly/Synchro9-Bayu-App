import { TrainingSession } from '../types';

/**
 * Parses date string (YYYY-MM-DD) and time string (HH:mm) into a Date object in local/KL time.
 */
export function parseSessionDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export interface CheckInWindowStatus {
  canCheckIn: boolean;
  reason?: string;
  minutesUntilOpen?: number;
  isOpen: boolean;
  isPast: boolean;
  windowOpensAt: Date;
  windowClosesAt: Date;
}

/**
 * Checks whether the current time is within the valid check-in window for a session.
 * Enforces T-15 minutes prior to session start, through session end time.
 * Cancelled sessions immediately reject check-in.
 */
export function evaluateCheckInWindow(
  session: TrainingSession,
  currentTime: Date = new Date()
): CheckInWindowStatus {
  if (session.status === 'Cancelled') {
    return {
      canCheckIn: false,
      reason: 'This session has been cancelled. Self check-in is not permitted.',
      isOpen: false,
      isPast: false,
      windowOpensAt: new Date(0),
      windowClosesAt: new Date(0)
    };
  }

  const sessionStart = parseSessionDateTime(session.date, session.startTime);
  const sessionEnd = parseSessionDateTime(session.date, session.endTime);

  const windowMinutes = session.checkInWindowMinutes ?? 15;
  const windowOpensAt = new Date(sessionStart.getTime() - windowMinutes * 60 * 1000);
  
  // Default window closes at session end time
  const windowClosesAt = session.checkInCloseMinutesAfterStart
    ? new Date(sessionStart.getTime() + session.checkInCloseMinutesAfterStart * 60 * 1000)
    : sessionEnd;

  const currentMs = currentTime.getTime();

  if (currentMs < windowOpensAt.getTime()) {
    const diffMinutes = Math.ceil((windowOpensAt.getTime() - currentMs) / 60000);
    return {
      canCheckIn: false,
      reason: `Check-in opens 15 minutes before session starts (in ${diffMinutes} min at ${session.startTime} - 15m).`,
      minutesUntilOpen: diffMinutes,
      isOpen: false,
      isPast: false,
      windowOpensAt,
      windowClosesAt
    };
  }

  if (currentMs > windowClosesAt.getTime()) {
    return {
      canCheckIn: false,
      reason: 'Check-in window has closed for this session.',
      isOpen: false,
      isPast: true,
      windowOpensAt,
      windowClosesAt
    };
  }

  return {
    canCheckIn: true,
    isOpen: true,
    isPast: false,
    windowOpensAt,
    windowClosesAt
  };
}

/**
 * Format time string to 12-hour format with AM/PM (e.g. "4:00 PM")
 */
export function formatTime12(time24: string): string {
  if (!time24) return '';
  const [hourStr, minStr] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour}:${minStr} ${ampm}`;
}
