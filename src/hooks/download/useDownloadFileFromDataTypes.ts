import type { Dispatch, SetStateAction } from 'react';

export type DownloadFileFromDataProps<T extends Record<string, unknown>> = {
    data?: T | null;
    setState: Dispatch<SetStateAction<T>>;
    fileName?: string;
};
