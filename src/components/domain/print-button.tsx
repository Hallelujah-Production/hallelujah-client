"use client";

import { Printer } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Triggers the browser's own print dialog. Print CSS keeps the receipt layout
 * the same as on screen (two columns, no mid-word wraps) and hides chrome.
 */
export function PrintButton({
  label = "Print Receipt",
  ...props
}: ButtonProps & { label?: string }) {
  return (
    <Button
      {...props}
      onClick={() => window.print()}
      className={props.className}
      data-print="hide"
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
