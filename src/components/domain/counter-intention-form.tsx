"use client";

import * as React from "react";
import { useActionState } from "react";
import { CheckCircle2, Printer } from "lucide-react";
import { createIntentionAction, type SubmitIntentionState } from "@/app/actions/intentions";
import { Button } from "@/components/ui/button";
import { Field, FormErrorSummary, FormRow, Input, Select } from "@/components/ui/form";
import { PrayerIcon } from "@/components/domain/prayer-icon";
import { PreferredTimeField } from "@/components/domain/preferred-time-field";
import type { Church, PrayerType, User } from "@/lib/types";
import { addDays, cn, formatCurrency, TODAY } from "@/lib/utils";

function isOtherPrayerType(type?: PrayerType | null): boolean {
  if (!type) return false;
  return type.code === "SPECIAL" || /^other$/i.test(type.name);
}

function prayerTypeLabel(type: PrayerType): string {
  return isOtherPrayerType(type) ? "Other" : type.name;
}

const initialState: SubmitIntentionState = { status: "idle" };

export function CounterIntentionForm({
  church,
  assignedChurches = [],
  prayerTypes,
  assignableStaff = [],
}: {
  church: Church;
  assignedChurches?: Pick<Church, "id" | "name">[];
  prayerTypes: PrayerType[];
  assignableStaff?: User[];
}) {
  const [cycle, setCycle] = React.useState(0);
  return (
    <CounterIntentionFormInner
      key={cycle}
      church={church}
      assignedChurches={assignedChurches}
      prayerTypes={prayerTypes}
      assignableStaff={assignableStaff}
      onCreateAnother={() => setCycle((n) => n + 1)}
    />
  );
}

function CounterIntentionFormInner({
  church,
  assignedChurches,
  prayerTypes,
  assignableStaff,
  onCreateAnother,
}: {
  church: Church;
  assignedChurches: Pick<Church, "id" | "name">[];
  prayerTypes: PrayerType[];
  assignableStaff: User[];
  onCreateAnother: () => void;
}) {
  const [state, formAction, pending] = useActionState(createIntentionAction, initialState);
  const [prayerTypeId, setPrayerTypeId] = React.useState("");
  const [personName, setPersonName] = React.useState("");
  const [prayerFor, setPrayerFor] = React.useState("");
  const [prayerDate, setPrayerDate] = React.useState(TODAY);
  const [preferredTime, setPreferredTime] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [destinationChurchId, setDestinationChurchId] = React.useState("");
  const [assignedStaffUserId, setAssignedStaffUserId] = React.useState("");

  const parishes = React.useMemo(() => {
    const byId = new Map<string, Pick<Church, "id" | "name">>();
    for (const parish of assignedChurches) {
      if (parish.id) byId.set(parish.id, { id: parish.id, name: parish.name });
    }
    if (church.id && !byId.has(church.id)) {
      byId.set(church.id, { id: church.id, name: church.name });
    }
    return [...byId.values()];
  }, [assignedChurches, church.id, church.name]);

  const mustPickChurch = parishes.length > 1;
  const mustPickStaff = assignableStaff.length > 1;
  const selectedType = prayerTypes.find((type) => type.id === prayerTypeId);
  const listedTypes = prayerTypes.filter((type) => type.isActive);

  React.useEffect(() => {
    if (!mustPickChurch) setDestinationChurchId(church.id);
  }, [church.id, mustPickChurch]);

  React.useEffect(() => {
    if (assignableStaff.length === 1) setAssignedStaffUserId(assignableStaff[0].id);
  }, [assignableStaff]);

  const errors = state.status === "error" ? state.errors ?? {} : {};

  if (state.status === "success" && state.reference) {
    return (
      <CreatedIntention
        state={state}
        churchName={state.churchName ?? church.name}
        onCreateAnother={onCreateAnother}
      />
    );
  }

  return (
    <form action={formAction} className="space-y-7" suppressHydrationWarning>
      <input type="hidden" name="churchId" value={mustPickChurch ? destinationChurchId : church.id} suppressHydrationWarning />
      <input type="hidden" name="prayerTypeId" value={prayerTypeId} suppressHydrationWarning />
      <input type="hidden" name="method" value="CASH" suppressHydrationWarning />
      {assignableStaff.length === 1 ? (
        <input type="hidden" name="assignedStaffUserId" value={assignableStaff[0].id} suppressHydrationWarning />
      ) : null}

      <FormErrorSummary message={errors.form} />

      <fieldset>
        <legend className="text-sm font-medium text-foreground">
          Prayer Type <span className="text-destructive" aria-hidden="true">*</span>
        </legend>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {listedTypes.map((type, index) => {
            const active = prayerTypeId === type.id;
            return (
              <button
                key={type.id}
                type="button"
                suppressHydrationWarning
                onClick={() => {
                  setPrayerTypeId(type.id);
                  setAmount(String(type.suggestedAmount || ""));
                }}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-3 rounded-md border px-3.5 py-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary-muted ring-1 ring-primary"
                    : "border-input bg-card hover:bg-muted",
                )}
              >
                <PrayerIcon icon={type.icon} index={index} size="sm" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{prayerTypeLabel(type)}</span>
                </span>
              </button>
            );
          })}
        </div>
        {errors.prayerTypeId ? (
          <p role="alert" className="mt-2 text-xs font-medium text-destructive">
            ✕ {errors.prayerTypeId}
          </p>
        ) : null}
      </fieldset>

      <Field id="customerName" label="Person Name" required error={errors.customerName}>
        {(aria) => (
          <Input
            {...aria}
            name="customerName"
            value={personName}
            onChange={(event) => setPersonName(event.target.value)}
            placeholder="Aakash"
            maxLength={160}
            className="h-12 text-base"
          />
        )}
      </Field>

      <Field id="prayerFor" label="Pray For" required error={errors.prayerFor}>
        {(aria) => (
          <Input
            {...aria}
            name="prayerFor"
            value={prayerFor}
            onChange={(event) => setPrayerFor(event.target.value)}
            placeholder="Prudhvi Raj"
            maxLength={80}
            className="h-12 text-base"
          />
        )}
      </Field>

      <FormRow>
        <Field id="prayerDate" label="Date" required error={errors.prayerDate}>
          {(aria) => (
            <Input
              {...aria}
              name="prayerDate"
              type="date"
              min={TODAY}
              max={addDays(TODAY, 365)}
              value={prayerDate}
              onChange={(event) => setPrayerDate(event.target.value)}
              className="h-12 text-base"
            />
          )}
        </Field>
        <PreferredTimeField
          name="preferredTime"
          value={preferredTime}
          onChange={setPreferredTime}
          error={errors.preferredTime}
          label="Time"
          description=""
        />
      </FormRow>

      <Field id="amount" label="Amount" required error={errors.amount}>
        {(aria) => (
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              ₹
            </span>
            <Input
              {...aria}
              name="amount"
              inputMode="numeric"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ""))}
              placeholder={selectedType ? String(selectedType.suggestedAmount) : "500"}
              className="h-12 pl-7 text-base tabular-nums"
            />
          </div>
        )}
      </Field>

      {mustPickChurch ? (
        <Field id="churchIdSelect" label="Church" required error={errors.form && !destinationChurchId ? errors.form : undefined}>
          {(aria) => (
            <Select
              {...aria}
              value={destinationChurchId}
              onChange={(event) => setDestinationChurchId(event.target.value)}
              className="h-12 text-base"
            >
              <option value="">Choose church</option>
              {parishes.map((parish) => (
                <option key={parish.id} value={parish.id}>
                  {parish.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      ) : null}

      {mustPickStaff ? (
        <Field id="assignedStaffUserId" label="Prayer Staff" required error={errors.assignedStaffUserId}>
          {(aria) => (
            <Select
              {...aria}
              name="assignedStaffUserId"
              value={assignedStaffUserId}
              onChange={(event) => setAssignedStaffUserId(event.target.value)}
              className="h-12 text-base"
            >
              <option value="">Choose prayer staff</option>
              {assignableStaff.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="h-14 w-full text-base"
        disabled={
          pending ||
          !prayerTypeId ||
          (mustPickChurch && !destinationChurchId) ||
          (mustPickStaff && !assignedStaffUserId)
        }
      >
        {pending ? "Creating…" : "Create Intention"}
      </Button>
    </form>
  );
}

function CreatedIntention({
  state,
  churchName,
  onCreateAnother,
}: {
  state: SubmitIntentionState;
  churchName: string;
  onCreateAnother: () => void;
}) {
  const printReceipt = () => {
    if (!state.receiptId) return;
    window.open(`/receipts/${state.receiptId}?print=1`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 py-4 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Intention Created
        </h2>
        <p className="font-mono text-lg font-semibold tracking-wide text-primary">{state.reference}</p>
      </div>
      <dl className="space-y-1.5 text-base text-foreground">
        {state.prayerTypeName ? <p className="font-medium">{state.prayerTypeName}</p> : null}
        {state.personName ? <p className="font-display text-xl font-semibold">{state.personName}</p> : null}
        {state.prayerFor ? <p className="text-muted-foreground">For: {state.prayerFor}</p> : null}
        <p>{churchName}</p>
        {state.staffName ? <p>Staff: {state.staffName}</p> : null}
        {typeof state.amount === "number" ? (
          <p className="font-semibold tabular-nums">{formatCurrency(state.amount)}</p>
        ) : null}
      </dl>
      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Button
          type="button"
          size="lg"
          className="h-14 flex-1"
          onClick={printReceipt}
          disabled={!state.receiptId}
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          Print Receipt
        </Button>
        <Button type="button" size="lg" variant="outline" className="h-14 flex-1" onClick={onCreateAnother}>
          Create Another
        </Button>
      </div>
      {!state.receiptId ? (
        <p className="text-sm text-muted-foreground">
          The intention is recorded. Open Receipts if the print copy is not ready yet.
        </p>
      ) : null}
    </div>
  );
}
