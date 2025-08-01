import type { AnimalModelProviderProps } from '@/api/context/animalContext/animalContextTypes.ts';
import { useAnimalIdentification } from '@/hooks/models/useAnimalIdentification.ts';
import { createContext, useMemo } from 'react';

export const AnimalActionsContext = createContext(null!);
export const AnimalStateContext = createContext<{
    isInitialized: boolean;
    status: string;
} | null>(null);

/**
 * Context provider using the Animal Identification model.
 *
 * @description This provides 2 contexts:
 * - `AnimalActionsContext` for actions callbacks like comparing animals and adding training pairs.
 * - `AnimalStateContext` for state information like whether the model is initialized and its status.
 */
export const AnimalModelProvider = ({ children }: AnimalModelProviderProps) => {
    const animalModel = useAnimalIdentification();
    const actions = useMemo(
        () => ({
            compareAnimals: animalModel.compareAnimals,
            addTrainingPair: animalModel.addTrainingPair,
            startModelTraining: animalModel.startModelTraining,
            saveModelToLocalStorage: animalModel.saveModelToLocalStorage,
        }),
        [animalModel.model]
    );
    const state = useMemo(
        () => ({
            isInitialized: animalModel.isInitialized,
            status: animalModel.status,
        }),
        [animalModel.isInitialized, animalModel.status]
    );
    return (
        <AnimalActionsContext.Provider value={actions}>
            <AnimalStateContext.Provider value={state}>
                {children}
            </AnimalStateContext.Provider>
        </AnimalActionsContext.Provider>
    );
};

export const withAnimalModelContext = (Component) => (props) => {
    return (
        <AnimalActionsContext.Consumer>
            {(actions) => (
                <AnimalStateContext.Consumer>
                    {(state) => (
                        <Component {...props} actions={actions} state={state} />
                    )}
                </AnimalStateContext.Consumer>
            )}
        </AnimalActionsContext.Consumer>
    );
};
