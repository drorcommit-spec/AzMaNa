import type { Locale } from "@/lib/i18n/dictionary";

export type EventRow = {
  id: string;
  owner_id: string;
  language: Locale;
  image_url: string;
  address: string;
  greeting: string;
  is_active: boolean;
  created_at: string;
};

export type GuestRow = {
  id: string;
  event_id: string;
  first_name: string;
  last_name: string;
  mobile: string;
  predicted_guests: number;
  family_relation: string | null;
  token: string;
  created_at: string;
};

export type RsvpRow = {
  guest_id: string;
  attendee_count: number;
  submitted_at: string;
};
