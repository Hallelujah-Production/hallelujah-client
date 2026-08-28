"use client";

import * as React from "react";
import { Field, Select } from "@/components/ui/form";
import { hhmmToParts, partsToHhmm, toHhmm, type ClockParts } from "@/lib/preferred-time";

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

export function PreferredTimeField({
  id = "preferredTime",
  name,
  value,
  defaultValue,
  onChange,
  error,
}: {
  id?: string;
  /** Omit when a hidden input already carries the value (wizard form). */
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (next: string) => void;
  error?: string;
}) {
  const controlled = typeof onChange === "function";
  const [parts, setParts] = React.useState<ClockParts>(() =>
    hhmmToParts(toHhmm(value ?? defaultValue ?? "")),
  );

  React.useEffect(() => {
    if (!controlled) return;
    setParts(hhmmToParts(toHhmm(value)));
  }, [controlled, value]);

  const emit = (next: ClockParts) => {
    setParts(next);
    onChange?.(partsToHhmm(next));
  };

  const hhmm = partsToHhmm(parts);

  return (
    <Field
      id={id}
      label="Preferred time"
      error={error}
      description="Optional. Set any hour and minutes, then AM or PM. Leave empty if you have no preference."
    >
      {(aria) => (
        <div className="flex flex-wrap items-center gap-2">
          {name ? <input type="hidden" name={name} value={hhmm} /> : null}
          <div className="min-w-[5.5rem] flex-1 sm:flex-none sm:w-24">
            <Select
              {...aria}
              aria-label="Hour"
              value={parts.hour}
              onChange={(event) => {
                const hour = event.target.value;
                if (!hour) {
                  emit({ hour: "", minute: "", meridiem: "" });
                  return;
                }
                emit({
                  hour,
                  minute: parts.minute || "00",
                  meridiem: parts.meridiem,
                });
              }}
            >
              <option value="">Hour</option>
              {HOURS.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </Select>
          </div>
          <span className="hidden text-lg font-medium text-muted-foreground sm:inline" aria-hidden="true">
            :
          </span>
          <div className="min-w-[5.5rem] flex-1 sm:flex-none sm:w-24">
            <Select
              id={`${id}-minute`}
              aria-label="Minutes"
              value={parts.minute}
              onChange={(event) => emit({ ...parts, minute: event.target.value })}
            >
              <option value="">Min</option>
              {MINUTES.map((minute) => (
                <option key={minute} value={minute}>
                  {minute}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-[5.5rem] flex-1 sm:flex-none sm:w-28">
            <Select
              id={`${id}-meridiem`}
              aria-label="AM or PM"
              value={parts.meridiem}
              onChange={(event) =>
                emit({ ...parts, meridiem: event.target.value === "PM" ? "PM" : event.target.value === "AM" ? "AM" : "" })
              }
            >
              <option value="">AM / PM</option>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </Select>
          </div>
        </div>
      )}
    </Field>
  );
}
