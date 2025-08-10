import {
   AnimalActionsContext,
   withAnimalModelContext,
} from "@/api/context/animalContext/AnimalModelContext.tsx";
import { AlertDialogButton } from "@/components/Alerts/AlertDialogButton";
import { Button } from "@/components/Buttons/Button";
import type {
   ControlsPropsTypes,
   ControlsStateTypes,
} from "@/components/Controls/types/controlsTypes";
import { GenericList } from "@/components/Lists/GenericList.tsx";
import { clickableButtons, functionProps } from "@/configs/controls.config.ts";
import { useFileDownloadHandler } from "@/hooks/download/useFileDownloadHandler";
import { useUploadAFile } from "@/hooks/upload/useUploadAFile.ts";
import type { ContextTypes } from "@/mainTypes.ts";
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
   // Default state for the controls
   const [buttonState, setButtonsState] =
      useState<ControlsStateTypes>(defaultState);

   // Grab all contexts functions and properties
   const context: ContextTypes = useOutletContext();
   const contextActions = use(AnimalActionsContext);

   useFileDownloadHandler({
      data: buttonState.download.data,
      setState: setButtonsState,
      fileName: "Animal.json",
   });

   const { fileError, fileResults } = useUploadAFile({
      exploreFiles: buttonState.upload,
      functionToCall: contextActions.loadModel,
   });

   // Assigns all contexts and setState to functionProps
   // This will be used in all buttons functions
   Object.assign(functionProps, {
      ...context,
      setButtonsState,
      buttonState,
      ...contextActions,
   });

   useEffect(() => {
      if (fileResults) {
         setButtonsState(defaultState);
      }
   }, [fileResults]);

   /**
    * This handles any errors that occur during file reading.
    * It updates the state with the error message and resets the upload state.
    */
   useEffect(() => {
      if (fileError) {
         setButtonsState((prev) => ({
            ...prev,
            upload: { state: false, data: null },
            openModal: true,
            error: fileError,
         }));
      }
   }, [fileError]);
   return (
      <section className="controls">
         <GenericList items={buttons}>
            <AlertDialogButton
               clickedButtonId={buttonState.id}
               error={buttonState.error}
               open={buttonState.openModal}
               onOpenChange={() => setButtonsState(defaultState)}
            >
               <Button />
            </AlertDialogButton>
         </GenericList>
      </section>
   );
});

export const MemoizedControlsWithContext =
   withAnimalModelContext(MemoizedControls);
