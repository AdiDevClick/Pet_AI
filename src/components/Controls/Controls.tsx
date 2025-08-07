import {
   AnimalActionsContext,
   withAnimalModelContext,
} from "@/api/context/animalContext/AnimalModelContext.tsx";
import { AlertDialogButton } from "@/components/Alerts/AlertDialogButton";
import type { AlertDialogButtonProps } from "@/components/Alerts/alertsTypes.ts";
import { Button } from "@/components/Buttons/Button";
import type {
   ControlsPropsTypes,
   ControlsStateTypes,
} from "@/components/Controls/controlsTypes.ts";
import { clickableButtons, functionProps } from "@/configs/controls.config.ts";
import { useDownloadFileFromData } from "@/hooks/download/useDownloadFileFromData.ts";
import { useUploadAFile } from "@/hooks/upload/useUploadAFile.ts";
import type { contextTypes } from "@/mainTypes.ts";
import "@css/controls.scss";
import { memo, use, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

export const defaultState = {
   status: false,
   openModal: false,
   download: { state: false, data: null },
   upload: { state: false, data: null },
   id: null,
   error: null,
} as const;

Object.freeze(defaultState);

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
}: ControlsPropsTypes) {
   const [buttonState, setButtonState] =
      useState<ControlsStateTypes>(defaultState);

   // Grab all contexts functions and properties
   const context: contextTypes = useOutletContext();
   const contextActions = use(AnimalActionsContext);

   useDownloadFileFromData({
      data: buttonState.download.data,
      setState: setButtonState,
      fileName: "Animal.json",
   });

   const { fileError, fileResults } = useUploadAFile({
      exploreFiles: buttonState.upload,
      functionToCall: contextActions.loadModel,
   });

   // Assign all contexts and setState to functionProps
   // This will be used in all buttons functions
   Object.assign(functionProps, {
      ...context,
      setButtonState,
      buttonState,
      ...contextActions,
   });

   useEffect(() => {
      if (fileResults) {
         setButtonState(defaultState);
      }
   }, [fileResults]);

   /**
    * This handles any errors that occur during file reading.
    * It updates the state with the error message and resets the upload state.
    */
   useEffect(() => {
      if (fileError) {
         setButtonState((prev) => ({
            ...prev,
            upload: { state: false, data: null },
            openModal: true,
            error: fileError,
         }));
      }
   }, [fileError]);
   return (
      <section className="controls">
         {buttons.map((button, index) => (
            <AlertDialogButton
               key={`alert-${index}`}
               open={
                  buttonState.openModal &&
                  (buttonState.id === button.id ||
                     buttonState.id === `retry-${button.id}`)
               }
               onOpenChange={() => setButtonState(defaultState)}
               context={
                  ("context" in button && button.context?.error
                     ? {
                          ...button.context.error,
                          ...buttonState.error,
                          id: `retry-${button.id}`,
                          functions: button.functions,
                       }
                     : {
                          ...buttonState.error,
                       }) as AlertDialogButtonProps["context"]
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
