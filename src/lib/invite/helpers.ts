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
 * Builds a Waze deep link that searches for the given address. Opens the Waze
 * app on mobile when installed, otherwise the Waze web app.
 */
export function buildWazeLink(address: string): string {
  const query = encodeURIComponent(address.trim());
  return `https://waze.com/ul?q=${query}&navigate=yes`;
}

/**
 * Formats a yyyy-mm-dd date string for display in the given locale.
 * Returns an empty string when no date is provided.
 */
export function formatEventDate(
  isoDate: string | null,
  localeTag: string,
): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return "";
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat(localeTag, {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
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

/**
 * Normalizes a mobile number to the international format WhatsApp expects:
 * digits only, no leading "+". Israeli local numbers starting with "0" are
 * converted to the +972 country code. Already-international numbers are kept.
 *
 * Examples:
 *   "052-662-2214" -> "972526622214"
 *   "+972 52 6622214" -> "972526622214"
 *   "00972526622214" -> "972526622214"
 */
export function normalizePhone(raw: string, defaultCountry = "972"): string {
  let digits = (raw || "").replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) {
    digits = digits.slice(1);
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = defaultCountry + digits.slice(1);
  } else if (!digits.startsWith(defaultCountry)) {
    // Bare local number with no country code and no leading 0.
    digits = defaultCountry + digits;
  }
  return digits;
}

/**
 * Builds a WhatsApp "click to chat" link that opens a chat with the given
 * mobile number and a pre-filled message. The admin taps send in WhatsApp.
 */
export function buildWhatsappLink(mobile: string, message: string): string {
  const phone = normalizePhone(mobile);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds the localized invitation message a guest receives over WhatsApp.
 */
export function buildInviteMessage(
  locale: "he" | "en",
  firstName: string,
  inviteUrl: string,
): string {
  if (locale === "he") {
    return `שלום ${firstName}, הוזמנת לאירוע שלנו! לצפייה בהזמנה ולאישור הגעה: ${inviteUrl}`;
  }
  return `Hello ${firstName}, you're invited to our event! View your invitation and RSVP here: ${inviteUrl}`;
}
