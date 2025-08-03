import {
   AnimalActionsContext,
   withAnimalModelContext,
} from "@/api/context/animalContext/AnimalModelContext.tsx";
import { AlertDialogButton } from "@/components/Alerts/AlertDialogButton";
import { Button } from "@/components/Buttons/Button";
import type { ControlsStateTypes } from "@/components/Controls/controlsTypes.ts";
import { clickableButtons, functionProps } from "@/configs/controls.config.ts";
import { useDownloadFileFromData } from "@/hooks/download/useDownloadFileFromData.ts";
import type { contextTypes } from "@/mainTypes.ts";
import "@css/controls.scss";
import { memo, use, useState } from "react";
import { useOutletContext } from "react-router-dom";

/**
 * Controls component for rendering action buttons.
 *
 * @description This uses the `clickableButtons` from `controls.config.ts` array to render buttons with specific actions.
 * Each button can trigger a function and may open an alert dialog on error.
 *
 * @param buttons - **@default=`clickableButtons`** - Optional array of button configurations.
 */
export const MemoizedControls = memo(function Controls({
   buttons = clickableButtons,
}) {
   const [buttonState, setButtonState] = useState<ControlsStateTypes>({
      status: false,
      openModal: false,
      download: { state: false, data: null },
      id: null,
      error: null,
   });

   const context: contextTypes = useOutletContext();
   const contextActions = use(AnimalActionsContext);

   useDownloadFileFromData({
      data: buttonState.download.data,
      setState: setButtonState,
      fileName: "Animal.json",
   });

   Object.assign(functionProps, {
      ...context,
      setButtonState,
      ...contextActions,
   });

   return (
      <section className="controls">
         {buttons.map((button, index) => (
            <AlertDialogButton
               key={`alert-${index}`}
               open={!buttonState.openModal && buttonState.id === button.id}
               onOpenChange={() =>
                  setButtonState((prev) => ({
                     ...prev,
                     openModal: !prev.openModal,
                  }))
               }
               context={
                  "context" in button && button.context && button.context.error
                     ? {
                          ...button.context.error,
                          error: buttonState.error,
                       }
                     : { error: buttonState.error }
               }
            >
               <Button
                  id={button.id}
                  className={button.className}
                  {...button.functions}
               >
                  {button.label}
               </Button>
            </AlertDialogButton>
         ))}
      </section>
   );
});

export const MemoizedControlsWithContext =
   withAnimalModelContext(MemoizedControls);
