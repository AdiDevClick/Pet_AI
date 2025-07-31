import {
    AnimalActionsContext,
    withAnimalModelContext,
} from '@/api/context/animalContext/AnimalModelContext.tsx';
import { AlertDialogButton } from '@/components/Alerts/AlertDialogButton';
import { Button } from '@/components/Buttons/Button';
import type { ControlsStateTypes } from '@/components/Controls/controlsTypes.ts';
import { clickableButtons, functionProps } from '@/configs/controls.config.ts';
import type { contextTypes } from '@/mainTypes.ts';
import '@css/controls.scss';
import { memo, use, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

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
    const context: contextTypes = useOutletContext();
    const { startModelTraining } = use(AnimalActionsContext);

    const [isSuccess, setIsSuccess] = useState<ControlsStateTypes>({
        status: false,
        id: null,
        error: null,
    });
    Object.assign(functionProps, {
        ...context,
        setIsSuccess,
        startModelTraining,
    });
    return (
        <section className="controls">
            {buttons.map((button, index) => (
                <AlertDialogButton
                    key={`alert-${index}`}
                    open={!isSuccess.status && isSuccess.id === button.id}
                    onOpenChange={() =>
                        setIsSuccess((prev) => ({
                            ...prev,
                            status: !prev.status,
                        }))
                    }
                    context={
                        'context' in button &&
                        button.context &&
                        button.context.error
                            ? {
                                  ...button.context.error,
                                  error: isSuccess.error,
                              }
                            : { error: isSuccess.error }
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
