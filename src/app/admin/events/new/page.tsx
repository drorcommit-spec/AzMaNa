import Link from "next/link";
import { EventForm } from "../EventForm";

export default function NewEventPage() {
  return (
    <div>
      <Link
        href="/admin"
        style={{ display: "inline-block", marginBottom: 12, textDecoration: "none" }}
      >
        ← Back to events
      </Link>
      <EventForm />
    </div>
  );
}
