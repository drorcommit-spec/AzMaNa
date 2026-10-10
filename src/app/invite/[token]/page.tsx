import { getInviteView } from "@/lib/invite/getInviteView";
import { getDictionary, directionFor } from "@/lib/i18n/dictionary";
import { buildWazeLink, formatEventDate } from "@/lib/invite/helpers";
import { RsvpForm } from "./RsvpForm";

// Always render fresh so the page reflects the event's current active state
// and latest settings (greeting, name, etc.) rather than a cached response.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function Message({ text }: { text: string }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fbf7ef",
        fontFamily: "system-ui, sans-serif",
        padding: "1rem",
      }}
    >
      <p style={{ color: "#555" }}>{text}</p>
    </main>
  );
}

export default async function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  const result = await getInviteView(params.token);

  if (result.status === "not_found") {
    return <Message text={getDictionary("en").notFound} />;
  }
  if (result.status === "inactive") {
    return <Message text={getDictionary("en").unavailable} />;
  }

  const view = result.view;
  const t = getDictionary(view.language);
  const dir = directionFor(view.language);
  const wazeLink = buildWazeLink(view.address);
  const dateText = formatEventDate(view.eventDate, t.dateLocale);
  // Default to 0 so the guest must actively choose a number before confirming.
  // If the guest already responded, show their saved value.
  const initialCount = view.attendeeCount ?? 0;

  return (
    <main
      dir={dir}
      lang={view.language}
      style={{
        minHeight: "100vh",
        background: "#fbf7ef",
        fontFamily: "system-ui, sans-serif",
        padding: "16px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#fff",
          border: "1px solid #e7dec9",
          borderRadius: 20,
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          overflow: "hidden",
          padding: 12,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={view.imageUrl}
          alt=""
          style={{ width: "100%", borderRadius: 14, display: "block" }}
        />

        <div style={{ padding: "16px 10px 8px" }}>
          <h1 style={{ fontSize: 22, margin: "0 0 6px", fontWeight: 700 }}>
            {t.greetingHello(view.firstName, view.lastName)} 🎉
          </h1>

          {view.eventName ? (
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 18,
                fontWeight: 600,
                color: "#d4a62a",
              }}
            >
              {view.eventName}
            </p>
          ) : null}

          {view.greeting ? (
            <p style={{ margin: "0 0 16px", color: "#444", lineHeight: 1.5 }}>
              {view.greeting}
            </p>
          ) : null}

          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>📍</span>
              <span>
                {view.address}
                {"  |  "}
                <a
                  href={wazeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#2b6fd6", fontWeight: 600 }}
                >
                  {t.navigateWaze}
                </a>
              </span>
            </div>

            {dateText ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>📅</span>
                <span>{dateText}</span>
              </div>
            ) : null}

            {view.eventTime ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>🕐</span>
                <span>{view.eventTime}</span>
              </div>
            ) : null}
          </div>

          <hr
            style={{
              border: 0,
              borderTop: "1px solid #eee",
              margin: "20px 0",
            }}
          />

          <RsvpForm
            token={params.token}
            initialCount={initialCount}
            labels={{
              attendeesLabel: t.attendeesLabel,
              submit: t.submit,
              decline: t.decline,
              declined: t.declined,
              submitted: t.submitted,
            }}
          />
        </div>
      </div>
    </main>
  );
}
