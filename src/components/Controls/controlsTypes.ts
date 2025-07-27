import type { contextTypes } from '@/mainTypes.ts';
import type { Dispatch, MouseEvent, SetStateAction } from 'react';

export type LoadModelTypes = {
    e: MouseEvent<HTMLButtonElement>;
    setIsSuccess: ControlsFunctionPropsTypes['setIsSuccess'];
};

export type ControlsClickableButtonTypes<T> = {
    [key: string]: T;
};

export interface ControlsFunctionPropsTypes extends contextTypes {
    setIsSuccess: Dispatch<SetStateAction<ControlsStateTypes>>;
}

export type ControlsStateTypes = {
    status: boolean;
    id: string | null;
    error: string | null;
};
