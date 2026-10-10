"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_IMAGE_BUCKET ?? "event-images";

export type EventFormValues = {
  id?: string;
  name: string;
  language: "he" | "en";
  imageUrl: string;
  address: string;
  greeting: string;
  eventDate: string; // yyyy-mm-dd
  eventTime: string; // HH:MM
};

type FieldKey =
  | "name"
  | "language"
  | "imageUrl"
  | "address"
  | "greeting"
  | "eventDate"
  | "eventTime";
type FieldErrors = Partial<Record<FieldKey, string[]>>;

export function EventForm({ initial }: { initial?: EventFormValues }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [name, setName] = useState(initial?.name ?? "");
  const [language, setLanguage] = useState<"he" | "en">(initial?.language ?? "en");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [greeting, setGreeting] = useState(initial?.greeting ?? "");
  const [eventDate, setEventDate] = useState(initial?.eventDate ?? "");
  const [eventTime, setEventTime] = useState(initial?.eventTime ?? "");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setFormError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const extMatch = /\.([a-zA-Z0-9]+)$/.exec(file.name);
      const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : "";
      const path = `${crypto.randomUUID()}${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
      });
      if (error) {
        setFormError(`Image upload failed: ${error.message}`);
        return;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError(null);

    const payload = { name, language, imageUrl, address, greeting, eventDate, eventTime };
    const url = isEdit ? `/api/events/${initial!.id}` : "/api/events";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.fields) setErrors(data.fields as FieldErrors);
        setFormError(data.error ?? "Could not save the event.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 12,
    fontWeight: 600,
  };
  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "8px 10px",
    marginTop: 4,
    fontWeight: 400,
    boxSizing: "border-box",
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 520 }}>
      <h1>{isEdit ? "Edit event" : "New event"}</h1>

      <label style={labelStyle}>
        Event name
        <input
          style={inputStyle}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Guy's Bar Mitzvah"
        />
      </label>
      {errors.name ? <p role="alert">{errors.name.join(", ")}</p> : null}

      <label style={labelStyle}>
        Language
        <select
          style={inputStyle}
          value={language}
          onChange={(e) => setLanguage(e.target.value as "he" | "en")}
        >
          <option value="en">English</option>
          <option value="he">Hebrew</option>
        </select>
      </label>

      <label style={labelStyle}>
        Event image
        <input
          style={inputStyle}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
          }}
        />
      </label>
      {uploading ? <p>Uploading image...</p> : null}
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="Event" style={{ maxWidth: "100%", marginBottom: 12 }} />
      ) : null}
      {errors.imageUrl ? <p role="alert">{errors.imageUrl.join(", ")}</p> : null}

      <label style={labelStyle}>
        Full address
        <input
          style={inputStyle}
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </label>
      {errors.address ? <p role="alert">{errors.address.join(", ")}</p> : null}

      <div style={{ display: "flex", gap: 12 }}>
        <label style={{ ...labelStyle, flex: 1 }}>
          Event date
          <input
            style={inputStyle}
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </label>
        <label style={{ ...labelStyle, flex: 1 }}>
          Event time
          <input
            style={inputStyle}
            type="time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
          />
        </label>
      </div>
      {errors.eventDate ? <p role="alert">{errors.eventDate.join(", ")}</p> : null}
      {errors.eventTime ? <p role="alert">{errors.eventTime.join(", ")}</p> : null}

      <label style={labelStyle}>
        Greeting
        <textarea
          style={{ ...inputStyle, minHeight: 80 }}
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
        />
      </label>
      {errors.greeting ? <p role="alert">{errors.greeting.join(", ")}</p> : null}

      {formError ? <p role="alert" style={{ color: "crimson" }}>{formError}</p> : null}

      <button type="submit" disabled={saving || uploading}>
        {saving ? "Saving..." : "Save event"}
      </button>
    </form>
  );
}
