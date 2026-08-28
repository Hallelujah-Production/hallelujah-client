/** Postgres `time` and form values both collapse to HH:mm (24-hour). */
export function toHhmm(value?: string | null): string {
  if (!value) return "";
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return "";
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return "";
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export type ClockParts = {
  hour: string;
  minute: string;
  meridiem: "" | "AM" | "PM";
};

export function hhmmToParts(value?: string | null): ClockParts {
  const hhmm = toHhmm(value);
  if (!hhmm) return { hour: "", minute: "", meridiem: "" };
  const [h, m] = hhmm.split(":").map(Number);
  return {
    hour: String(h % 12 === 0 ? 12 : h % 12),
    minute: String(m).padStart(2, "0"),
    meridiem: h >= 12 ? "PM" : "AM",
  };
}

export function partsToHhmm(parts: ClockParts): string {
  if (!parts.hour || !parts.minute || !parts.meridiem) return "";
  let hour = Number(parts.hour);
  const minute = Number(parts.minute);
  if (!Number.isInteger(hour) || hour < 1 || hour > 12) return "";
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return "";
  if (parts.meridiem === "AM") hour = hour === 12 ? 0 : hour;
  else hour = hour === 12 ? 12 : hour + 12;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
