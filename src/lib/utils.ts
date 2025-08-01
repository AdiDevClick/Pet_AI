import { clsx, type ClassValue } from 'clsx';
import type { Dispatch, SetStateAction } from 'react';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Crer une promesse qui se resoudra
 * après un délai défini en paramètre
 * @param duration - La durée de l'attente
 * @param message - Message à retourner dans la promesse si besoin
 */
export function wait(duration: number, message = '') {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(message);
        }, duration);
    });
}
/**
 * Update the state with new values.
 * @description This function merges the new state object.
 */
export function updateState<K extends object, T extends Partial<K>>(
    newState: T,
    setter: Dispatch<SetStateAction<K>>
) {
    setter((prev: K) => {
        return Object.entries(newState).reduce(
            (acc, [key, value]) => {
                const k = key as keyof K;
                // The preview key is not an array
                // we simply assign the new value
                if (!Array.isArray(prev[k])) {
                    return {
                        ...acc,
                        [k]: value,
                    };
                }
                // If the previous value is an array
                // We spread it
                if (Array.isArray(value)) {
                    return {
                        ...acc,
                        [k]: [...prev[k], ...value],
                    };
                }
                // If the new value is not an array
                // We simply push it to the array
                return {
                    ...acc,
                    [k]: [...prev[k], value],
                };
            },
            { ...prev }
        );
    });
}
