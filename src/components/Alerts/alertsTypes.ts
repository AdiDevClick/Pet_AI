import type { clickableButtons } from '@/configs/controls.config.ts';
import type { AlertDialogProps } from '@radix-ui/react-alert-dialog';
import type { ReactNode } from 'react';

export interface AlertDialogButtonProps extends AlertDialogProps {
    children: ReactNode;
    context?: ButtonErrorContext;
    // [key: string]: (typeof clickableButtons)[number]['context'];
    // cancelable?: boolean;
    // retryButtonText?: string;
    // title?: string;
    // error?: string | null;
    // functions?: {
    //     [key: string]: (typeof clickableButtons)[number]['functions'];
    // };
}
type ButtonErrorContext = Extract<
    (typeof clickableButtons)[number],
    { context?: unknown }
>['context'] extends { error: infer E }
    ? E & { error?: string | null }
    : { error?: string | null } | { error?: string | null };
