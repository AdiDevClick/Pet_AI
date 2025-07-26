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

export function AlertDialogButton({ children, context = {}, ...props }) {
    return (
        <AlertDialog {...props}>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
            <AlertDialogOverlay />
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {context.title || 'Titre par défaut'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {context.message || 'Message par défaut'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {context.cancelable && (
                        <>
                            <AlertDialogCancel {...context.functions}>
                                {context.retryTitle}
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
