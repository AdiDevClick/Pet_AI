import type { AlertDialogButtonProps } from "@/components/Alerts/types/alertsTypes";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogOverlay,
   AlertDialogTitle,
   AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import { cloneElement, isValidElement } from "react";

/**
 * Modal dialog button component.
 *
 * @description This component renders an alert dialog button
 * that can be used to trigger actions with confirmation.
 * It understands the button type passed to it and can extract properties like context.
 * It only manages the opening logic to avoid opening other modals.
 *
 * @param children - The button or element that triggers the alert dialog.
 * @param error - Any error object that might contain error information.
 * ideally, it should include `message` and `title` properties.
 * @param open - Boolean indicating if the dialog should be open.
 * @param clickedButtonId - The ID of the button that was clicked
 * to prevent multiple dialogs from opening.
 * @param onOpenChange - Callback function to handle open state changes.
 * @param props - Additional properties including button properties from ListMapper.
 */
export function AlertDialogButton<T, E = unknown>({
   children,
   open,
   clickedButtonId,
   error,
   onOpenChange,
   ...props
}: AlertDialogButtonProps<T, E>) {
   const { id, context, ...rest } = props;
   const newContext = { ...context?.error, ...error };

   return (
      <AlertDialog
         open={
            open &&
            (clickedButtonId === id || clickedButtonId === `retry-${id}`)
         }
         onOpenChange={onOpenChange}
      >
         <AlertDialogTrigger asChild>
            {isValidElement(children)
               ? cloneElement(children, { id, ...rest })
               : children}
         </AlertDialogTrigger>
         <AlertDialogOverlay />
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>
                  {newContext?.title || "Titre par défaut"}
               </AlertDialogTitle>
               <AlertDialogDescription>
                  {newContext?.message || "Message par défaut"}
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               {newContext?.cancelable && (
                  <>
                     <AlertDialogCancel
                        id={`retry-${id}`}
                        onClick={rest.onClick}
                     >
                        {newContext.retryButtonText}
                     </AlertDialogCancel>
                     <AlertDialogCancel>Annuler</AlertDialogCancel>
                  </>
               )}
               <AlertDialogAction>Ok</AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
