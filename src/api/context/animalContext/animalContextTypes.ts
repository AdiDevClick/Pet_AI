import type { ReactNode } from 'react';

export type AnimalActionsContextType = {
    compareAnimals: (image1: string, image2: string) => Promise<void>;
    addTrainingPair: (image1: string, image2: string) => Promise<void>;
};

export type AnimalStateContextType = {
    isInitialized: boolean;
    status: string;
};

// <{
//     compareAnimals: (image1: string, image2: string) => Promise<void>;
//     addTrainingPair: (
//         image1: string,
//         image2: string,
//         sameAnimal: boolean
//     ) => Promise<void>;
// } | null>

export type AnimalModelProviderProps = {
    children: ReactNode;
};
