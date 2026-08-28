"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Banknote, Info, Smartphone } from "lucide-react";
import {
  submitIntentionAction,
  createIntentionAction,
  type SubmitIntentionState,
} from "@/app/actions/intentions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, FormRow, Input, Select, Textarea } from "@/components/ui/form";
import { FormStepper } from "@/components/domain/form-stepper";
import { PrayerIcon } from "@/components/domain/prayer-icon";
import { PreferredTimeField } from "@/components/domain/preferred-time-field";
import { ProofUploader, type ProofDescriptor } from "@/components/domain/proof-uploader";
import type { Church, PaymentMethod, PrayerType, User } from "@/lib/types";
import { PAYMENT_METHOD_LABEL, requiresTransactionId } from "@/lib/types";
import { addDays, cn, formatCurrency, formatLongDate, formatTime, TODAY } from "@/lib/utils";
import { useActionFeedback } from "@/hooks/use-action-feedback";

const PUBLIC_STEPS = [
  { id: "prayer", label: "Prayer details", hint: "What and for whom" },
  { id: "you", label: "Your details", hint: "How the church reaches you" },
  { id: "review", label: "Review", hint: "Confirm and submit" },
];

const STAFF_STEPS = [
  { id: "prayer", label: "Prayer details", hint: "What and for whom" },
  { id: "you", label: "Your details", hint: "How the church reaches you" },
  { id: "payment", label: "Payment record", hint: "What you already received" },
  { id: "review", label: "Review", hint: "Confirm and create" },
];

const METHOD_ORDER: PaymentMethod[] = ["CASH", "UPI"];

const DRAFT_VERSION = 1;

function draftStorageKey(mode: string, churchId: string): string {
  return `hallelujah.intention-draft.${mode}.${churchId}`;
}

type IntentionDraft = { v: number; step: number; values: Values };

function readDraft(key: string): IntentionDraft | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as IntentionDraft;
    if (parsed?.v !== DRAFT_VERSION || !parsed.values) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeDraft(key: string, draft: IntentionDraft): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Private mode can refuse sessionStorage.
  }
}

function clearDraft(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function isOtherPrayerType(type?: PrayerType | null): boolean {
  if (!type) return false;
  return type.code === "SPECIAL" || /^other$/i.test(type.name);
}

function prayerTypeLabel(type: PrayerType): string {
  return isOtherPrayerType(type) ? "Other" : type.name;
}

type Values = {
  prayerTypeId: string;
  prayerFor: string;
  prayerDate: string;
  preferredTime: string;
  message: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  customerAddress: string;
  amount: string;
  method: PaymentMethod;
  provider: string;
  transactionId: string;
  paymentNotes: string;
  assignedStaffUserId: string;
};

type Errors = Partial<Record<keyof Values | "proof" | "form", string>>;

const initialState: SubmitIntentionState = { status: "idle" };

export function PrayerIntentionForm({
  church,
  prayerTypes,
  defaultPrayerTypeId,
  assignedChurches = [],
  assignableStaff = [],
  mode = "public",
}: {
  church: Church;
  prayerTypes: PrayerType[];
  defaultPrayerTypeId?: string;
  /** Allotted parishes. Church is chosen on the last step for staff create. */
  assignedChurches?: Pick<Church, "id" | "name">[];
  assignableStaff?: User[];
  /** "staff" is the in-workspace variant used at /intentions/new. */
  mode?: "public" | "staff";
}) {
  const router = useRouter();
  const action = mode === "staff" ? createIntentionAction : submitIntentionAction;
  const steps = mode === "staff" ? STAFF_STEPS : PUBLIC_STEPS;
  const reviewIndex = steps.length - 1;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [, startTransition] = React.useTransition();
  useActionFeedback(
    {
      status: state.status,
      message: state.reference ? `Intention ${state.reference} is recorded.` : undefined,
    },
    { successTitle: "Intention created", silentSuccess: true, silentError: true },
  );

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
  const mustPickChurch = mode === "staff" && parishes.length > 1;
  const [destinationChurchId, setDestinationChurchId] = React.useState(
    mustPickChurch ? "" : church.id,
  );
  const destinationChurch = parishes.find((p) => p.id === destinationChurchId) ?? church;
  const staffForDestination = React.useMemo(
    () =>
      assignableStaff.filter(
        (member) => member.churchId === (destinationChurchId || church.id) && member.role === "CHURCH_STAFF",
      ),
    [assignableStaff, destinationChurchId, church.id],
  );

  const formRef = React.useRef<HTMLFormElement>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const storageKey = draftStorageKey(mode, church.id);
  const defaultTypeId = defaultPrayerTypeId ?? prayerTypes[0]?.id ?? "";
  const [step, setStep] = React.useState(0);
  const [errors, setErrors] = React.useState<Errors>({});
  const [proof, setProof] = React.useState<ProofDescriptor | null>(null);
  const [draftReady, setDraftReady] = React.useState(false);
  const [values, setValues] = React.useState<Values>({
    prayerTypeId: defaultTypeId,
    prayerFor: "",
    prayerDate: addDays(TODAY, 1),
    preferredTime: "",
    message: "",
    customerName: "",
    customerMobile: "",
    customerEmail: "",
    customerAddress: "",
    amount: "",
    method: "CASH",
    provider: "",
    transactionId: "",
    paymentNotes: "",
    assignedStaffUserId:
      assignableStaff.filter((member) => member.churchId === church.id).length === 1
        ? assignableStaff.find((member) => member.churchId === church.id)?.id ?? ""
        : "",
  });

  React.useEffect(() => {
    if (mode !== "staff") return;
    setValues((prev) => {
      if (staffForDestination.some((member) => member.id === prev.assignedStaffUserId)) return prev;
      const nextId = staffForDestination.length === 1 ? staffForDestination[0].id : "";
      if (prev.assignedStaffUserId === nextId) return prev;
      return { ...prev, assignedStaffUserId: nextId };
    });
  }, [mode, staffForDestination]);

  const selectedType = prayerTypes.find((p) => p.id === values.prayerTypeId);
  const otherSelected = isOtherPrayerType(selectedType);
  const listedTypes = [...prayerTypes].sort(
    (a, b) => Number(isOtherPrayerType(a)) - Number(isOtherPrayerType(b)),
  );
  const needsReference = requiresTransactionId(values.method);
  const isCash = values.method === "CASH";
  const headingRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const draft = readDraft(storageKey);
    if (draft) {
      const restored = draft.values;
      const typeStillOffered = prayerTypes.some((p) => p.id === restored.prayerTypeId);
      setValues({
        ...restored,
        prayerTypeId: typeStillOffered ? restored.prayerTypeId : defaultTypeId,
        prayerDate: restored.prayerDate && restored.prayerDate >= TODAY ? restored.prayerDate : addDays(TODAY, 1),
        method: restored.method === "UPI" ? "UPI" : "CASH",
        assignedStaffUserId: restored.assignedStaffUserId ?? "",
      });
      if (draft.step >= 0 && draft.step <= reviewIndex) setStep(draft.step);
    }
    setDraftReady(true);
    // Restore once when this form mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  React.useEffect(() => {
    if (!draftReady) return;
    writeDraft(storageKey, { v: DRAFT_VERSION, step, values });
  }, [draftReady, storageKey, step, values]);

  React.useEffect(() => {
    if (state.status !== "success" || !state.reference) return;
    clearDraft(storageKey);
    if (mode === "staff") return;
    router.push(`/church/${church.slug}/prayer/success?ref=${encodeURIComponent(state.reference)}`);
  }, [state, router, church.slug, mode, storageKey]);

  // Server-side field errors bring the visitor back to the step that owns them.
  React.useEffect(() => {
    if (state.status !== "error" || !state.errors) return;
    const map: Record<string, number> = {
      prayerTypeId: 0,
      prayerFor: 0,
      prayerDate: 0,
      message: 0,
      churchId: reviewIndex,
      customerName: 1,
      customerMobile: 1,
      customerEmail: 1,
      amount: mode === "staff" ? 2 : 0,
      transactionId: mode === "staff" ? 2 : 0,
    };
    const firstKey = Object.keys(state.errors)[0];
    setErrors(state.errors as Errors);
    if (firstKey && map[firstKey] !== undefined) setStep(map[firstKey]);
  }, [state, mode]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateStep = (index: number): boolean => {
    const next: Errors = {};

    if (index === 0) {
      if (!values.prayerTypeId) next.prayerTypeId = "Choose the kind of prayer you would like offered.";
      if (!values.prayerFor.trim()) {
        next.prayerFor = "Enter the name of the person the prayer is offered for.";
      }
      if (otherSelected && !values.message.trim()) {
        next.message = "Describe this intention so the priest knows what to offer.";
      }
      if (!values.prayerDate) next.prayerDate = "Choose the date the prayer should be offered.";
      else if (values.prayerDate < TODAY) next.prayerDate = "The prayer date cannot be in the past.";
    }

    if (index === 1) {
      if (!values.customerName.trim()) next.customerName = "Enter your full name.";
      if (!/^[0-9]{10}$/.test(values.customerMobile.replace(/\s|-/g, ""))) {
        next.customerMobile = "Enter a valid 10-digit mobile number, without the country code.";
      }
      if (values.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.customerEmail)) {
        next.customerEmail = "That email address does not look complete — check for a typo.";
      }
    }

    if (index === 2 && mode === "staff") {
      const rupees = Number(values.amount);
      if (!Number.isInteger(rupees) || rupees < 1) {
        next.amount = "Enter the amount the customer paid, in whole rupees.";
      }
      if (needsReference && !values.transactionId.trim()) {
        next.transactionId = `Transaction ID is required for ${PAYMENT_METHOD_LABEL[values.method]} payments.`;
      }
      if (needsReference && !proof) {
        next.proof = "Attach a screenshot of the UPI payment.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, steps.length - 1));
    headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 0));
    headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const runCreate = () => {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    if (mode === "staff") data.set("churchId", destinationChurchId || church.id);
    startTransition(() => {
      formAction(data);
    });
  };

  const onCreateClick = () => {
    if (step !== reviewIndex) return;
    if (!validateStep(reviewIndex)) return;
    if (mode === "staff" && mustPickChurch) {
      setErrors((prev) => ({ ...prev, form: undefined }));
      setPickerOpen(true);
      return;
    }
    runCreate();
  };

  const onConfirmChurch = () => {
    if (!destinationChurchId || !parishes.some((p) => p.id === destinationChurchId)) {
      setErrors((prev) => ({ ...prev, form: "Choose the church this intention belongs to." }));
      return;
    }
    setErrors((prev) => ({ ...prev, form: undefined }));
    runCreate();
  };

  return (
    <>
    <form
      ref={formRef}
      className="space-y-8"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter") return;
        const tag = (event.target as HTMLElement).tagName;
        if (tag === "TEXTAREA" || tag === "BUTTON" || tag === "SELECT") return;
        if (step === reviewIndex) return;
        event.preventDefault();
        goNext();
      }}
    >
      <input type="hidden" name="churchId" value={mode === "staff" ? destinationChurchId : church.id} suppressHydrationWarning />
      <input type="hidden" name="assignedStaffUserId" value={values.assignedStaffUserId} suppressHydrationWarning />
      <input type="hidden" name="slug" value={church.slug} suppressHydrationWarning />
      <input type="hidden" name="prayerTypeId" value={values.prayerTypeId} suppressHydrationWarning />
      <input type="hidden" name="prayerFor" value={values.prayerFor} suppressHydrationWarning />
      <input type="hidden" name="prayerDate" value={values.prayerDate} suppressHydrationWarning />
      <input type="hidden" name="preferredTime" value={values.preferredTime} suppressHydrationWarning />
      <input type="hidden" name="message" value={values.message} suppressHydrationWarning />
      <input type="hidden" name="customerName" value={values.customerName} suppressHydrationWarning />
      <input type="hidden" name="customerMobile" value={values.customerMobile} suppressHydrationWarning />
      <input type="hidden" name="customerEmail" value={values.customerEmail} suppressHydrationWarning />
      <input type="hidden" name="customerAddress" value={values.customerAddress} suppressHydrationWarning />
      <input type="hidden" name="amount" value={values.amount} suppressHydrationWarning />
      <input type="hidden" name="method" value={values.method} suppressHydrationWarning />
      <input type="hidden" name="provider" value={values.provider} suppressHydrationWarning />
      <input type="hidden" name="transactionId" value={needsReference || !isCash ? values.transactionId : ""} suppressHydrationWarning />
      <input type="hidden" name="paymentNotes" value={values.paymentNotes} suppressHydrationWarning />
      <input type="hidden" name="proofFileName" value={proof?.fileName ?? ""} suppressHydrationWarning />
      <input type="hidden" name="proofMimeType" value={proof?.mimeType ?? ""} suppressHydrationWarning />
      <input type="hidden" name="proofSizeBytes" value={proof ? String(proof.sizeBytes) : ""} suppressHydrationWarning />

      <div ref={headingRef} className="scroll-mt-24">
        <FormStepper steps={steps} current={step} />
      </div>

      {state.status === "error" && state.errors?.form ? (
        <p role="alert" className="flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive-muted px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {state.errors.form}
        </p>
      ) : null}

      {/* ------------------------------ Step 1 ------------------------------ */}
      {step === 0 ? (
        <div className="space-y-6">
          <fieldset>
            <legend className="text-sm font-medium text-foreground">
              Kind of prayer <span className="text-destructive" aria-hidden="true">*</span>
            </legend>
            <p className="mt-1 text-xs text-muted-foreground">
              If it is not in this list, choose Other and describe it.
            </p>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {listedTypes.map((type, index) => {
                const active = values.prayerTypeId === type.id;
                return (
                  <label
                    key={type.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-md border p-3.5 transition-colors",
                      active
                        ? "border-primary bg-primary-muted ring-1 ring-primary"
                        : "border-input bg-card hover:bg-muted",
                    )}
                  >
                    <input
                      type="radio"
                      name="prayerTypeChoice"
                      value={type.id}
                      checked={active}
                      onChange={() => {
                        set("prayerTypeId", type.id);
                      }}
                      className="sr-only"
                      suppressHydrationWarning
                    />
                    <PrayerIcon icon={type.icon} index={index} size="sm" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">
                        {prayerTypeLabel(type)}
                      </span>
                      {isOtherPrayerType(type) ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Not listed above — describe it below
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
            {errors.prayerTypeId ? (
              <p role="alert" className="mt-2 text-xs font-medium text-destructive">
                ✕ {errors.prayerTypeId}
              </p>
            ) : null}
          </fieldset>

          <FormRow>
            <Field
              id="prayerFor"
              label="Prayer is offered for"
              required
              error={errors.prayerFor}
              description="The person, family or intention the priest will name."
            >
              {(aria) => (
                <Input
                  {...aria}
                  value={values.prayerFor}
                  onChange={(e) => set("prayerFor", e.target.value)}
                  placeholder="Anjali"
                  maxLength={80}
                />
              )}
            </Field>

            <Field
              id="prayerDate"
              label="Prayer date"
              required
              error={errors.prayerDate}
              description="The day you would like the prayer offered."
            >
              {(aria) => (
                <Input
                  {...aria}
                  type="date"
                  min={TODAY}
                  max={addDays(TODAY, 365)}
                  value={values.prayerDate}
                  onChange={(e) => set("prayerDate", e.target.value)}
                />
              )}
            </Field>
          </FormRow>

          <PreferredTimeField
            value={values.preferredTime}
            onChange={(next) => set("preferredTime", next)}
          />

          <Field
            id="message"
            label={otherSelected ? "What is this prayer for?" : "Message to the church"}
            required={otherSelected}
            error={errors.message}
            description={
              otherSelected
                ? "This intention is not in the list. Name it clearly so the priest knows what to offer."
                : "Anything you would like the priest to know when offering this prayer."
            }
          >
            {(aria) => (
              <Textarea
                {...aria}
                value={values.message}
                onChange={(e) => set("message", e.target.value)}
                maxLength={500}
                placeholder={
                  otherSelected
                    ? "House blessing, new job, visa interview…"
                    : "Please pray for good health and blessings."
                }
              />
            )}
          </Field>
        </div>
      ) : null}

      {/* ------------------------------ Step 2 ------------------------------ */}
      {step === 1 ? (
        <div className="space-y-6">
          <p className="flex items-start gap-2 rounded-md border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            You do not need an account. These details let {church.name} identify your
            intention. The parish office records the offering separately — this form does
            not take a payment.
          </p>

          <FormRow>
            <Field id="customerName" label="Your full name" required error={errors.customerName}>
              {(aria) => (
                <Input
                  {...aria}
                  autoComplete="name"
                  value={values.customerName}
                  onChange={(e) => set("customerName", e.target.value)}
                  placeholder="Ravi Kumar"
                />
              )}
            </Field>

            <Field
              id="customerMobile"
              label="Mobile number"
              required
              error={errors.customerMobile}
              description="Ten digits. The parish office uses this to find your intention."
            >
              {(aria) => (
                <Input
                  {...aria}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  value={values.customerMobile}
                  onChange={(e) => set("customerMobile", e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="9876543210"
                />
              )}
            </Field>
          </FormRow>

          <FormRow>
            <Field
              id="customerEmail"
              label="Email address"
              error={errors.customerEmail}
              description="Optional. Used only to send your receipt."
            >
              {(aria) => (
                <Input
                  {...aria}
                  type="email"
                  autoComplete="email"
                  value={values.customerEmail}
                  onChange={(e) => set("customerEmail", e.target.value)}
                  placeholder="ravi@example.com"
                />
              )}
            </Field>

            <Field id="customerAddress" label="Address">
              {(aria) => (
                <Input
                  {...aria}
                  autoComplete="street-address"
                  value={values.customerAddress}
                  onChange={(e) => set("customerAddress", e.target.value)}
                  placeholder="12, MVP Colony"
                />
              )}
            </Field>
          </FormRow>
        </div>
      ) : null}

      {/* ------------------------------ Step 3 ------------------------------ */}
      {/* Stay mounted so the proof <input type="file"> is still in FormData on submit. */}
      {mode === "staff" ? (
        <div className={cn("space-y-6", step !== 2 && "hidden")}>
          <div className="rounded-md border border-accent/25 bg-accent-muted/60 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Info className="h-4 w-4 text-accent" aria-hidden="true" />
              This step records a payment you have already made
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {church.name} receives your offering directly — at the counter, or by UPI to
              the parish account. Nothing is charged here and there is no online checkout.
              Tell us what you paid so the office can match it and issue your receipt.
            </p>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-foreground">
              How did you pay? <span className="text-destructive" aria-hidden="true">*</span>
            </legend>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
              {METHOD_ORDER.map((method) => {
                const active = values.method === method;
                return (
                  <label
                    key={method}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-md border p-3.5 transition-colors",
                      active
                        ? "border-primary bg-primary-muted ring-1 ring-primary"
                        : "border-input bg-card hover:bg-muted",
                    )}
                  >
                    <input
                      type="radio"
                      name="methodChoice"
                      value={method}
                      checked={active}
                      onChange={() => {
                        set("method", method);
                        set("provider", method === "CASH" ? "" : PAYMENT_METHOD_LABEL[method]);
                        if (method === "CASH") set("transactionId", "");
                      }}
                      className="sr-only"
                      suppressHydrationWarning
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {method === "CASH" ? (
                        <Banknote className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Smartphone className="h-4 w-4" aria-hidden="true" />
                      )}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {PAYMENT_METHOD_LABEL[method]}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <FormRow>
            <Field
              id="amount"
              label="Amount paid"
              required
              error={errors.amount}
              description="Enter the amount the customer paid, in whole rupees."
            >
              {(aria) => (
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                  >
                    ₹
                  </span>
                  <Input
                    {...aria}
                    className="pl-7"
                    inputMode="numeric"
                    value={values.amount}
                    onChange={(e) => set("amount", e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="0"
                  />
                </div>
              )}
            </Field>

            {isCash ? (
              <Field
                id="provider"
                label="Received at"
                description="Optional. Where the cash was handed over."
              >
                {(aria) => (
                  <Input
                    {...aria}
                    value={values.provider}
                    onChange={(e) => set("provider", e.target.value)}
                    placeholder="Parish office counter"
                  />
                )}
              </Field>
            ) : (
              <Field
                id="provider"
                label="Provider or bank"
                description="The app or bank the payment went through."
              >
                {(aria) => (
                  <Input
                    {...aria}
                    value={values.provider}
                    onChange={(e) => set("provider", e.target.value)}
                    placeholder="PhonePe"
                  />
                )}
              </Field>
            )}
          </FormRow>

          {isCash ? (
            <p className="flex items-start gap-2 rounded-md border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              No transaction ID is needed for a cash offering. You may attach a photo of the
              counter receipt if you have one.
            </p>
          ) : (
            <Field
              id="transactionId"
              label="Transaction or reference ID"
              required={needsReference}
              error={errors.transactionId}
              description="Shown in your payment app or bank statement — it lets the office match your offering."
            >
              {(aria) => (
                <Input
                  {...aria}
                  value={values.transactionId}
                  onChange={(e) => set("transactionId", e.target.value)}
                  placeholder="TXN482000001234"
                  maxLength={40}
                />
              )}
            </Field>
          )}

          <ProofUploader
            value={proof}
            onChange={setProof}
            required={needsReference}
            error={errors.proof}
            label={isCash ? "Counter receipt photo" : "Payment screenshot"}
            description={
              isCash
                ? "Optional. A photo of the cash receipt, up to 15 MB."
                : "Required for UPI. A screenshot of the successful payment, up to 15 MB."
            }
          />

          <Field
            id="paymentNotes"
            label="Notes for the parish office"
            description="Anything that will help the office recognise this payment."
          >
            {(aria) => (
              <Textarea
                {...aria}
                rows={3}
                value={values.paymentNotes}
                onChange={(e) => set("paymentNotes", e.target.value)}
                maxLength={300}
                placeholder="Paid at the counter on Sunday after the 9 AM Mass."
              />
            )}
          </Field>
        </div>
      ) : null}

      {/* ------------------------------ Step 4 ------------------------------ */}
      {step === reviewIndex ? (
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Please check these details.
            {mode === "staff" && mustPickChurch
              ? " After you click Create, choose which allotted church records this intention."
              : mode === "staff"
                ? ` Once created, ${destinationChurch.name} records the intention and the offering you received at the counter.`
                : " The parish office records the offering separately and issues an official receipt after verification."}
          </p>

          <div className="overflow-hidden rounded-lg border border-border">
            <ReviewGroup title="Prayer">
              <ReviewRow
                label="Church"
                value={
                  mustPickChurch
                    ? "Chosen when you create"
                    : destinationChurch.name
                }
              />
              <ReviewRow
                label="Prayer type"
                value={
                  selectedType
                    ? otherSelected && values.message
                      ? `Other — ${values.message}`
                      : prayerTypeLabel(selectedType)
                    : "—"
                }
              />
              <ReviewRow label="Offered for" value={values.prayerFor || "—"} />
              <ReviewRow label="Prayer date" value={formatLongDate(values.prayerDate)} />
              {values.preferredTime ? (
                <ReviewRow label="Preferred time" value={formatTime(values.preferredTime)} />
              ) : null}
              {values.message ? <ReviewRow label="Message" value={values.message} /> : null}
            </ReviewGroup>

            <ReviewGroup title="Your details">
              <ReviewRow label="Name" value={values.customerName || "—"} />
              <ReviewRow label="Mobile" value={values.customerMobile || "—"} />
              {values.customerEmail ? <ReviewRow label="Email" value={values.customerEmail} /> : null}
              {values.customerAddress ? (
                <ReviewRow label="Address" value={values.customerAddress} />
              ) : null}
            </ReviewGroup>

            {mode === "staff" ? (
            <>
            <ReviewGroup title="Prayer staff">
              <ReviewRow
                label="Allotted to"
                value={
                  staffForDestination.find((member) => member.id === values.assignedStaffUserId)?.name ??
                  (mustPickChurch ? "Chosen with the church" : "Assign after creating")
                }
              />
            </ReviewGroup>
            {!mustPickChurch ? (
              <div className="border-b border-border px-4 py-3">
                <StaffAllotField
                  staff={staffForDestination}
                  value={values.assignedStaffUserId}
                  onChange={(id) => set("assignedStaffUserId", id)}
                  churchName={destinationChurch.name}
                />
              </div>
            ) : null}
            <ReviewGroup title="Payment record" last>
              <ReviewRow
                label="Amount"
                value={formatCurrency(Number(values.amount) || 0)}
              />
              <ReviewRow label="Method" value={PAYMENT_METHOD_LABEL[values.method]} />
              {values.provider ? <ReviewRow label="Provider" value={values.provider} /> : null}
              {values.transactionId ? (
                <ReviewRow label="Transaction ID" value={values.transactionId} />
              ) : null}
              <ReviewRow
                label="Proof"
                value={
                  proof ? (
                    <span className="flex items-center gap-3">
                      {proof.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- in-memory object URL
                        <img
                          src={proof.previewUrl}
                          alt=""
                          className="h-12 w-12 rounded border border-border object-cover"
                        />
                      ) : null}
                      <span>{proof.fileName}</span>
                    </span>
                  ) : (
                    "Not attached"
                  )
                }
              />
              <ReviewRow
                label="Offering"
                value="Paid — recorded at the parish. The office can still confirm it on Payments before a receipt is issued."
              />
            </ReviewGroup>
            </>
            ) : (
            <ReviewGroup title="Next step" last>
              <ReviewRow
                label="Offering"
                value="Pay at the parish office. An official receipt is issued after verification."
              />
            </ReviewGroup>
            )}
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            By creating you confirm that the payment described above was made to the parish.
            Hallelujah does not collect or hold any money.
          </p>
        </div>
      ) : null}

      {/* ------------------------------ Controls ------------------------------ */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={step === 0 || pending}
          className={step === 0 ? "invisible" : undefined}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Button>

        {step < reviewIndex ? (
          <Button type="button" size="lg" onClick={goNext}>
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            disabled={pending}
            onClick={onCreateClick}
          >
            {pending
              ? "Recording your intention…"
              : mode === "staff"
                ? "Create intention"
                : "Submit Prayer Intention"}
          </Button>
        )}
      </div>
    </form>

      {mode === "staff" && mustPickChurch ? (
        <Dialog
          open={pickerOpen && state.status !== "success"}
          onClose={() => {
            if (!pending) setPickerOpen(false);
          }}
          dismissible={!pending}
          title="Record this intention for"
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPickerOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="button" onClick={onConfirmChurch} disabled={pending || !destinationChurchId}>
                {pending ? "Recording…" : "Create for this church"}
              </Button>
            </>
          }
        >
          <Field
            id="destination-church"
            label="Church"
            required
            description="Choose which of your allotted churches this intention belongs to."
            error={errors.form}
          >
            {(aria) => (
              <Select
                {...aria}
                value={destinationChurchId}
                onChange={(event) => {
                  setDestinationChurchId(event.target.value);
                  setErrors((prev) => ({ ...prev, form: undefined }));
                }}
              >
                <option value="">Select a church</option>
                {parishes.map((parish) => (
                  <option key={parish.id} value={parish.id}>
                    {parish.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          {destinationChurchId ? (
            <div className="mt-4">
              <StaffAllotField
                staff={staffForDestination}
                value={values.assignedStaffUserId}
                onChange={(id) => set("assignedStaffUserId", id)}
                churchName={destinationChurch.name}
              />
            </div>
          ) : null}
        </Dialog>
      ) : null}

      {mode === "staff" && state.status === "success" && state.reference ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-foreground/45 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-[2px] sm:items-center"
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-card px-6 py-10 text-center shadow-lg">
            <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
              <span
                aria-hidden="true"
                className="success-tick-ring absolute inset-0 rounded-full bg-success/20"
              />
              <span className="success-tick relative flex h-20 w-20 items-center justify-center rounded-full bg-success text-success-foreground">
                <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" aria-hidden="true">
                  <path
                    d="M6 12.5l4 4 8-9"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-accent">
              Hallelujah
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground">
              Intention created
            </h2>
            <p className="mt-3 text-base leading-relaxed text-foreground">
              Recorded for{" "}
              <span className="font-semibold">{state.churchName ?? destinationChurch.name}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Reference {state.reference}</p>
            {values.customerEmail.trim() ? (
              <p className="mt-4 text-sm text-muted-foreground">
                A confirmation email is on its way to {values.customerEmail.trim()}.
              </p>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No customer email was entered, so no confirmation email was sent.
              </p>
            )}
            <div className="mt-8 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  window.location.assign("/intentions/new");
                }}
              >
                Create another
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => {
                  if (state.intentionId) router.push(`/intentions/${state.intentionId}`);
                  else router.push("/intentions");
                }}
              >
                View intention
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function StaffAllotField({
  staff,
  value,
  onChange,
  churchName,
}: {
  staff: User[];
  value: string;
  onChange: (id: string) => void;
  churchName: string;
}) {
  return (
    <Field
      id="assigned-staff"
      label="Allot to prayer staff"
      description={
        staff.length
          ? `They will see this under My Prayers at ${churchName}.`
          : `No prayer staff is allotted to ${churchName} yet. Add them on Team, or assign after creating.`
      }
    >
      {(aria) => (
        <Select {...aria} value={value} onChange={(event) => onChange(event.target.value)} disabled={!staff.length}>
          <option value="">{staff.length ? "Assign after creating" : "No prayer staff at this church"}</option>
          {staff.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}

function ReviewGroup({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section className={cn(!last && "border-b border-border")}>
      <h3 className="bg-muted/50 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </h3>
      <dl className="divide-y divide-border">{children}</dl>
    </section>
  );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 px-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="max-w-[60%] text-right text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
