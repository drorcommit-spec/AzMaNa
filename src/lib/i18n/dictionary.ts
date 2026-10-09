/**
 * Two-locale dictionary for the guest Invite_Page.
 * Event_Language selects the dictionary and the document text direction.
 * The admin UI remains English-only and does not use this module.
 */

export type Locale = "he" | "en";

export const LOCALES: Locale[] = ["he", "en"];

export type Direction = "rtl" | "ltr";

export function directionFor(locale: Locale): Direction {
  return locale === "he" ? "rtl" : "ltr";
}

type InviteStrings = {
  navigate: string;
  attendeesLabel: string;
  submit: string;
  submitted: string;
  unavailable: string;
  notFound: string;
  /** Builds the personalized greeting prefix shown before the admin greeting. */
  greetingHello: (firstName: string, lastName: string) => string;
};

export const dictionary: Record<Locale, InviteStrings> = {
  en: {
    navigate: "Navigate to location",
    attendeesLabel: "How many will arrive?",
    submit: "Submit",
    submitted: "Thanks! Your response was saved.",
    unavailable: "This invitation is not currently available.",
    notFound: "This invitation link is not valid.",
    greetingHello: (firstName, lastName) =>
      `Hello ${firstName} ${lastName},`,
  },
  he: {
    navigate: "ניווט למקום האירוע",
    attendeesLabel: "כמה אורחים יגיעו?",
    submit: "שליחה",
    submitted: "תודה! התשובה נשמרה.",
    unavailable: "ההזמנה אינה זמינה כעת.",
    notFound: "קישור ההזמנה אינו תקין.",
    greetingHello: (firstName, lastName) =>
      `שלום ${firstName} ${lastName},`,
  },
};

export function getDictionary(locale: Locale): InviteStrings {
  return dictionary[locale];
}
