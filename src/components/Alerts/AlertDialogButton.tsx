import type { AlertDialogButtonProps } from '@/components/Alerts/alertsTypes';
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
} from '@/components/ui/alert-dialog.tsx';

/**
 * Modal dialog button component.
 *
 * @description This component renders an alert dialog button
 * that can be used to trigger actions with confirmation.
 *
 * @param children - The button or element that triggers the alert dialog.
 * @param context - Optional context object containing properties like `title`, `error`, and `functions`.
 * @param props - Additional properties for the AlertDialog component.
 */
export function AlertDialogButton({
    children,
    ...props
}: AlertDialogButtonProps) {
    return (
        <AlertDialog {...props}>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
            <AlertDialogOverlay />
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {props.context?.title || 'Titre par défaut'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {props.context?.error || 'Message par défaut'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {props.context?.cancelable && (
                        <>
                            <AlertDialogCancel {...props.context.functions}>
                                {props.context.retryButtonText}
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
