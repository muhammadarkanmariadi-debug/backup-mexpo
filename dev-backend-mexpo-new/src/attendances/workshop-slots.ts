import type { BookingStatus } from '@prisma/client';

/**
 * Attendance slots of a workshop.
 *
 * `quota` is the number of people who can actually be IN the room. A booking
 * alone does not use a slot: someone who registered but never shows up (or shows
 * up too late) leaves the slot empty, and a walk-in can take it by checking in.
 * Only people who have checked in occupy a slot.
 */
export const ATTENDED_STATUSES: BookingStatus[] = [`CHECKED_IN`, `CHECKED_OUT`];

/** Slots still free; `null` = unlimited (quota 0). */
export function attendanceSlotsLeft(
  quota: number,
  attended: number,
): number | null {
  if (quota <= 0) return null;
  return Math.max(0, quota - attended);
}

/** Whether one more person can check in. */
export function hasAttendanceSlot(quota: number, attended: number): boolean {
  const left = attendanceSlotsLeft(quota, attended);
  return left === null || left > 0;
}
