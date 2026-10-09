import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Locale } from "@/lib/i18n/dictionary";
import type { EventRow, GuestRow } from "@/lib/db/types";

/**
 * Result of resolving a guest token into an invite view.
 * - "ok": valid token on an active event; view model included
 * - "inactive": valid token but the event is inactive (Req 5.3)
 * - "not_found": no guest matches the token (Req 5.2)
 */
export type InviteResult =
  | { status: "ok"; view: InviteView }
  | { status: "inactive" }
  | { status: "not_found" };

export type InviteView = {
  guestId: string;
  firstName: string;
  lastName: string;
  predictedGuests: number;
  language: Locale;
  imageUrl: string;
  address: string;
  greeting: string;
  attendeeCount: number | null;
};

/**
 * Validates a Guest_Token server-side and returns a minimal view model only
 * when the token is valid and the event is active. Uses the service-role
 * client so access rules are enforced in code, never trusting the client.
 * Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 7.1
 */
export async function getInviteView(token: string): Promise<InviteResult> {
  const supabase = createSupabaseServiceClient();

  const { data: guest } = await supabase
    .from("guest")
    .select("id, event_id, first_name, last_name, predicted_guests")
    .eq("token", token)
    .maybeSingle<
      Pick<GuestRow, "id" | "event_id" | "first_name" | "last_name" | "predicted_guests">
    >();

  if (!guest) {
    return { status: "not_found" };
  }

  const { data: event } = await supabase
    .from("event")
    .select("language, image_url, address, greeting, is_active")
    .eq("id", guest.event_id)
    .maybeSingle<
      Pick<EventRow, "language" | "image_url" | "address" | "greeting" | "is_active">
    >();

  if (!event) {
    return { status: "not_found" };
  }
  if (!event.is_active) {
    return { status: "inactive" };
  }

  const { data: rsvp } = await supabase
    .from("rsvp")
    .select("attendee_count")
    .eq("guest_id", guest.id)
    .maybeSingle<{ attendee_count: number }>();

  return {
    status: "ok",
    view: {
      guestId: guest.id,
      firstName: guest.first_name,
      lastName: guest.last_name,
      predictedGuests: guest.predicted_guests,
      language: event.language,
      imageUrl: event.image_url,
      address: event.address,
      greeting: event.greeting,
      attendeeCount: rsvp?.attendee_count ?? null,
    },
  };
}
