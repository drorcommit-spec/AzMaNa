import { ATTENDEE_MAX, ATTENDEE_MIN } from "@/lib/validation/schemas";

/**
 * Builds a navigation link that opens an external map application at the given
 * address. The Google Maps universal URL deep-links to Waze/Maps on mobile.
 * Requirements: 2.3, 6.2
 */
export function buildNavigationLink(address: string): string {
  const query = encodeURIComponent(address.trim());
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Default attendee count for the invite control: the guest's predicted value
 * bounded to the allowed range [0, 10].
 * Requirements: 7.1
 */
export function defaultAttendeeCount(predictedGuests: number): number {
  if (Number.isNaN(predictedGuests)) return ATTENDEE_MIN;
  return Math.min(ATTENDEE_MAX, Math.max(ATTENDEE_MIN, Math.trunc(predictedGuests)));
}
