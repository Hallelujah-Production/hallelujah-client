"use client";

import { Printer } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Triggers the browser's own print dialog. Print CSS keeps the 80mm thermal
 * receipt and hides application chrome.
 */
export function PrintButton({
  label = "Print Receipt",
  ...props
}: ButtonProps & { label?: string }) {
  return (
    <Button
      {...props}
      onClick={() => {
        window.dispatchEvent(new Event("beforeprint"));
        window.print();
      }}
      className={props.className}
      data-print="hide"
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
