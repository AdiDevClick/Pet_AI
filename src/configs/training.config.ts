import type { TrainingButtonsParams } from "@/configs/types/training.config.types.ts";
import type { MouseEvent } from "react";

/**
 * Factory to build the training buttons with the correct handlers.
 * Keeps content (labels/classes/order) editable from one place.
 */
export function makeTrainingButtons<K extends (...args: any[]) => any>({
   onUserResults,
   onPredict,
}: TrainingButtonsParams<K>) {
   return [
      {
         key: "correct",
         label: "✓ Correct",
         className: "success",
         onClick: (e: MouseEvent<HTMLButtonElement>) => onUserResults(e, true),
      } as const,
      {
         key: "incorrect",
         label: "✗ Incorrect",
         className: "danger",
         onClick: (e: MouseEvent<HTMLButtonElement>) => onUserResults(e, false),
      } as const,
      {
         key: "predict",
         label: "🔮 Prédire",
         className: "primary",
         onClick: onPredict,
      } as const,
   ];
}
