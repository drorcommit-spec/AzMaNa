"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_IMAGE_BUCKET ?? "event-images";

export type EventFormValues = {
  id?: string;
  language: "he" | "en";
  imageUrl: string;
  address: string;
  greeting: string;
};

type FieldErrors = Partial<Record<"language" | "imageUrl" | "address" | "greeting", string[]>>;

export function EventForm({ initial }: { initial?: EventFormValues }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [language, setLanguage] = useState<"he" | "en">(initial?.language ?? "en");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [greeting, setGreeting] = useState(initial?.greeting ?? "");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setFormError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      // Build a safe object path from the UUID + a sanitized extension only.
      // The original filename can contain spaces or non-ASCII characters that
      // Storage rejects with "Invalid path specified in request URL".
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

    const payload = { language, imageUrl, address, greeting };
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

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 520 }}>
      <h1>{isEdit ? "Edit event" : "New event"}</h1>

      <label>
        Language
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as "he" | "en")}
        >
          <option value="en">English</option>
          <option value="he">Hebrew</option>
        </select>
      </label>
      {errors.language ? <p role="alert">{errors.language.join(", ")}</p> : null}

      <label>
        Event image
        <input
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
        <img src={imageUrl} alt="Event" style={{ maxWidth: "100%", marginTop: 8 }} />
      ) : null}
      {errors.imageUrl ? <p role="alert">{errors.imageUrl.join(", ")}</p> : null}

      <label>
        Full address
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </label>
      {errors.address ? <p role="alert">{errors.address.join(", ")}</p> : null}

      <label>
        Greeting
        <textarea value={greeting} onChange={(e) => setGreeting(e.target.value)} />
      </label>
      {errors.greeting ? <p role="alert">{errors.greeting.join(", ")}</p> : null}

      {formError ? <p role="alert" style={{ color: "crimson" }}>{formError}</p> : null}

      <button type="submit" disabled={saving || uploading}>
        {saving ? "Saving..." : "Save event"}
      </button>
    </form>
  );
}
