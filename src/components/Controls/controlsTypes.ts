import type { contextTypes } from '@/mainTypes.ts';
import type { Dispatch, MouseEvent, SetStateAction } from 'react';

export type LoadModelTypes = {
    e: MouseEvent<HTMLButtonElement>;
    setIsSuccess: ControlsFunctionPropsTypes['setIsSuccess'];
};

export type ControlsClickableButtonTypes<T> = {
    [key: string]: T;
};
// export type ControlsClickableButtonTypes = {
//     id: string;
//     label: string;
//     className: string;
//     functions: {
//         onClick: (args: MouseEvent<HTMLButtonElement> & T) => void;
//     };
// };

export interface ControlsFunctionPropsTypes extends contextTypes {
    setIsSuccess: Dispatch<SetStateAction<ControlsStateTypes>>;
}

export type ControlsStateTypes = {
    status: boolean;
    id: string | null;
    error: string | null;
};
