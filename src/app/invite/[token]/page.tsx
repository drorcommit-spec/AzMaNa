import { getInviteView } from "@/lib/invite/getInviteView";
import { getDictionary, directionFor } from "@/lib/i18n/dictionary";
import { buildWazeLink, formatEventDate } from "@/lib/invite/helpers";
import { RsvpForm } from "./RsvpForm";

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
        background: "var(--cream)",
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
  const initialCount = view.attendeeCount ?? 0;

  return (
    <main
      dir={dir}
      lang={view.language}
      style={{
        minHeight: "100vh",
        background: "var(--cream)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Full-width, edge-to-edge invitation image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={view.imageUrl}
        alt=""
        style={{ width: "100%", display: "block" }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 480,
          padding: "20px 18px 32px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 24, margin: "0 0 6px" }}>
          {t.greetingHello(view.firstName, view.lastName)} 🎉
        </h1>

        {view.eventName ? (
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--gold)",
            }}
          >
            {view.eventName}
          </p>
        ) : null}

        {view.greeting ? (
          <p style={{ margin: "0 0 18px", color: "#444", lineHeight: 1.6 }}>
            {view.greeting}
          </p>
        ) : null}

        <div
          style={{
            display: "grid",
            gap: 12,
            textAlign: dir === "rtl" ? "right" : "left",
            margin: "0 auto 8px",
            maxWidth: 360,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>📍</span>
            <span>
              {view.address}
              {"  |  "}
              <a
                href={wazeLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontWeight: 600 }}
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
            borderTop: "1px solid var(--line)",
            margin: "22px 0",
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
    </main>
  );
}
