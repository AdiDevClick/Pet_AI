import type { MouseEvent } from 'react';

export type LoadModelTypes = {
    e: MouseEvent<HTMLButtonElement>;
    setIsSuccess: (value: boolean) => void;
};
