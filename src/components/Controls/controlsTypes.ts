import type { contextTypes } from '@/mainTypes.ts';
import type { Dispatch, MouseEvent, SetStateAction } from 'react';

export type LoadModelTypes = {
    e: MouseEvent<HTMLButtonElement>;
    setButtonState: ControlsFunctionPropsTypes['setButtonState'];
};

export type ControlsClickableButtonTypes<T> = {
    [key: string]: T;
};

export interface ControlsFunctionPropsTypes extends contextTypes {
    setButtonState: Dispatch<SetStateAction<ControlsStateTypes>>;
}

export type ControlsStateTypes = {
    status: boolean;
    id: string | null;
    error: string | null;
    openModal: boolean;
    download: { state: boolean; data: null };
};
