import type { ControlsStateTypes } from "@/components/Controls/controlsTypes.ts";
import type { clickableButtons } from "@/configs/controls.config.ts";
import type { AlertDialogProps } from "@radix-ui/react-alert-dialog";
import type { ReactNode } from "react";

type AllButtons = (typeof clickableButtons)[number];
type ButtonFunctions = AllButtons extends { functions: infer F } ? F : never;
type ButtonError = AllButtons extends { context?: { error?: infer E } }
   ? E
   : unknown;

export interface AlertDialogButtonProps extends AlertDialogProps {
   children: ReactNode;
   context?:
      | Partial<ButtonError> & {
           error?: ControlsStateTypes["error"];
           id?: string;
           functions?: ButtonFunctions;
        };
}
