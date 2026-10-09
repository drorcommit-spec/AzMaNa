import { getInviteView } from "@/lib/invite/getInviteView";
import { getDictionary, directionFor } from "@/lib/i18n/dictionary";
import { buildNavigationLink, defaultAttendeeCount } from "@/lib/invite/helpers";
import { RsvpForm } from "./RsvpForm";

// Always render fresh so the page reflects the event's current active state
// and latest settings rather than a cached version.
export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  const result = await getInviteView(params.token);

  // Invalid token: generic denial, no event data leaked (Req 5.2).
  if (result.status === "not_found") {
    return (
      <main style={{ maxWidth: 480, margin: "4rem auto", textAlign: "center" }}>
        <p>{getDictionary("en").notFound}</p>
      </main>
    );
  }

  // Inactive event: default unavailable message (Req 5.3).
  if (result.status === "inactive") {
    return (
      <main style={{ maxWidth: 480, margin: "4rem auto", textAlign: "center" }}>
        <p>{getDictionary("en").unavailable}</p>
      </main>
    );
  }

  const view = result.view;
  const t = getDictionary(view.language);
  const dir = directionFor(view.language);
  const navLink = buildNavigationLink(view.address);
  const initialCount =
    view.attendeeCount ?? defaultAttendeeCount(view.predictedGuests);

  return (
    <main
      dir={dir}
      lang={view.language}
      style={{ maxWidth: 520, margin: "2rem auto", padding: "0 1rem" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={view.imageUrl}
        alt=""
        style={{ width: "100%", borderRadius: 8 }}
      />

      <p style={{ fontWeight: 600, marginTop: 16 }}>
        {t.greetingHello(view.firstName, view.lastName)}
      </p>
      <p>{view.greeting}</p>

      <p>
        {view.address}
        {" — "}
        <a href={navLink} target="_blank" rel="noopener noreferrer">
          {t.navigate}
        </a>
      </p>

      <RsvpForm
        token={params.token}
        initialCount={initialCount}
        labels={{
          attendeesLabel: t.attendeesLabel,
          submit: t.submit,
          submitted: t.submitted,
        }}
      />
    </main>
  );
}
