/**
 * CSV helpers for guest import/export. Kept dependency-free: a small parser
 * that handles quoted fields, commas, and escaped quotes.
 */

export type GuestCsvRow = {
  firstName: string;
  lastName: string;
  mobile: string;
  predictedGuests: number;
  familyRelation: string;
};

export const CSV_HEADERS = [
  "first_name",
  "last_name",
  "mobile",
  "predicted_guests",
  "family_relation",
];

function escapeCell(value: string): string {
  const v = value ?? "";
  if (/[",\n]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

/** Serializes guest rows to a CSV string including the header row. */
export function guestsToCsv(
  rows: {
    first_name: string;
    last_name: string;
    mobile: string;
    predicted_guests: number;
    family_relation: string | null;
  }[],
): string {
  const lines = [CSV_HEADERS.join(",")];
  for (const r of rows) {
    lines.push(
      [
        escapeCell(r.first_name),
        escapeCell(r.last_name),
        escapeCell(r.mobile),
        String(r.predicted_guests ?? 0),
        escapeCell(r.family_relation ?? ""),
      ].join(","),
    );
  }
  return lines.join("\n");
}

/** Parses a single CSV line into fields, honoring quotes. */
function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/**
 * Parses CSV text into guest rows. Accepts the known headers in any order;
 * a header row is required. Mobile is required per row; rows missing it are
 * skipped. Returns parsed rows and the count of skipped rows.
 */
export function csvToGuests(text: string): {
  rows: GuestCsvRow[];
  skipped: number;
} {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { rows: [], skipped: 0 };

  const header = parseLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iFirst = idx("first_name");
  const iLast = idx("last_name");
  const iMobile = idx("mobile");
  const iPred = idx("predicted_guests");
  const iFam = idx("family_relation");

  const rows: GuestCsvRow[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    const mobile = (iMobile >= 0 ? cells[iMobile] : "")?.trim() ?? "";
    const firstName = (iFirst >= 0 ? cells[iFirst] : "")?.trim() ?? "";
    const lastName = (iLast >= 0 ? cells[iLast] : "")?.trim() ?? "";
    if (!mobile || !firstName || !lastName) {
      skipped++;
      continue;
    }
    const predRaw = (iPred >= 0 ? cells[iPred] : "")?.trim() ?? "";
    const predicted = Number(predRaw.replace(/\D/g, "")) || 0;
    rows.push({
      firstName,
      lastName,
      mobile,
      predictedGuests: predicted,
      familyRelation: (iFam >= 0 ? cells[iFam] : "")?.trim() ?? "",
    });
  }

  return { rows, skipped };
}
