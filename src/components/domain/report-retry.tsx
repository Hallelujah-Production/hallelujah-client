"use client";

import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/ui/states";

export function ReportRetry() {
  const router = useRouter();
  return (
    <ErrorState
      title="We couldn’t load this report"
      description="The figures could not be retrieved. Check your connection and try again."
      onRetry={() => router.refresh()}
    />
  );
}
