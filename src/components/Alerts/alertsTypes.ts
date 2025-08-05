import type { ControlsStateTypes } from "@/components/Controls/controlsTypes.ts";
import type { clickableButtons } from "@/configs/controls.config.ts";
import type { AlertDialogProps } from "@radix-ui/react-alert-dialog";
import type { ReactNode } from "react";

type AllButtons = (typeof clickableButtons)[number];

export interface AlertDialogButtonProps extends AlertDialogProps {
   children: ReactNode;
   context?: Partial<
      Extract<AllButtons, { context?: unknown }>["context"]["error"]
   > & {
      error?: ControlsStateTypes["error"];
      id?: string;
      //   functions?: AllButtons["functions"];
      functions?: AllButtons extends { functions: infer F } ? F : never;
   };
}
