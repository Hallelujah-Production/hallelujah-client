"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function SaveRecoveryCodeDialog({
  code,
  onSaved,
}: {
  code: string;
  onSaved: () => void;
}) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    setCopied(false);
  }, [code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog
      open
      onClose={() => undefined}
      title="Save Your Recovery Code"
      description="Keep this code somewhere safe. You will need it if you forget your password. It will not be shown again after you continue."
      size="sm"
      dismissible={false}
      footer={
        <Button type="button" size="sm" className="w-full sm:w-auto" onClick={onSaved}>
          I have saved it
        </Button>
      }
    >
      <p className="text-center font-mono text-xl font-semibold tracking-[0.18em] text-foreground sm:text-2xl">
        {code}
      </p>
      <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => void copy()}>
        {copied ? (
          <>
            <Check className="h-4 w-4" aria-hidden="true" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy Code
          </>
        )}
      </Button>
    </Dialog>
  );
}
