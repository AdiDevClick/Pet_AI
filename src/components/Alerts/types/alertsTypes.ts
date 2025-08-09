import type { AlertDialogProps } from "@radix-ui/react-alert-dialog";
import type { MouseEventHandler, ReactNode } from "react";

// Generic type that truly understands and merges with the button type
// Minimal context error shape supported by the dialog UI
export type AlertDialogContextError = {
   cancelable?: boolean;
   retryButtonText?: string;
   title?: string;
   message?: string;
};

// Ensures we always understand an optional `context.error` with the supported keys,
// even if the provided button type T doesn't declare it.
export type WithAlertContext = {
   context?: {
      error?: AlertDialogContextError;
   };
};

// Extract onClick type from T when present, but only keep it when compatible
// with React's HTMLButtonElement handler. Otherwise, fall back to never.
export type ExtractOnClick<T> = T extends { onClick: infer F }
   ? F extends MouseEventHandler<HTMLButtonElement>
      ? F
      : never
   : never;

// Generic props for AlertDialogButton
// T => item/button type coming from GenericList items
// E => external error type (e.g., ControlsErrorType)
export type AlertDialogButtonProps<T, E = unknown> = {
   children: ReactNode;
   open: boolean;
   clickedButtonId: string | null;
   error: E;
   // Accept both Radix signature and a zero-arg handler (commonly used)
   onOpenChange?: AlertDialogProps["onOpenChange"] | (() => void);
   id?: string;
   // If T supplies a compatible onClick, we keep it; otherwise allow the standard handler
   onClick?: ExtractOnClick<T> | MouseEventHandler<HTMLButtonElement>;
} & Partial<T> &
   WithAlertContext &
   Omit<AlertDialogProps, "open" | "onOpenChange">;
