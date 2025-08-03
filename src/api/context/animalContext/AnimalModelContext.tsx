import type { AnimalModelProviderProps } from "@/api/context/animalContext/animalContextTypes.ts";
import type { OnlyMethods } from "@/components/Controls/controlsTypes.ts";
import { useAnimalIdentification } from "@/hooks/models/useAnimalIdentification.ts";
import { createContext, useMemo } from "react";

export const AnimalActionsContext = createContext<
   OnlyMethods<ReturnType<typeof useAnimalIdentification>, true>
>(null!);
export const AnimalStateContext = createContext<
   OnlyMethods<ReturnType<typeof useAnimalIdentification>, false>
>(null!);

/**
 * Context provider using the Animal Identification model.
 *
 * @description This provides 2 contexts:
 * - `AnimalActionsContext` for actions callbacks like comparing animals and adding training pairs.
 * - `AnimalStateContext` for state information like whether the model is initialized and its status.
 */
export const AnimalModelProvider = ({ children }: AnimalModelProviderProps) => {
   const animalModel = useAnimalIdentification();

   /** Dynamically extract only the methods from the animalModel */
   const actions = useMemo(() => {
      return Object.fromEntries(
         Object.entries(animalModel).filter(
            ([_, value]) => typeof value === "function"
         )
      ) as OnlyMethods<typeof animalModel, true>;
   }, [animalModel.model]);

   /** Dynamically extract only the state from the animalModel */
   const state = useMemo(() => {
      return Object.fromEntries(
         Object.entries(animalModel).filter(
            ([_, value]) => typeof value !== "function"
         )
      );
   }, [animalModel.isInitialized, animalModel.status]) as OnlyMethods<
      typeof animalModel,
      false
   >;

   return (
      <AnimalActionsContext.Provider value={actions}>
         <AnimalStateContext.Provider value={state}>
            {children}
         </AnimalStateContext.Provider>
      </AnimalActionsContext.Provider>
   );
};

export const withAnimalModelContext =
   <P extends object>(
      Component: React.ComponentType<
         P & {
            actions: Record<string, (...args: any[]) => any>;
            state: { isInitialized: boolean; status: string } | null;
         }
      >
   ) =>
   (props: P) => {
      return (
         <AnimalActionsContext.Consumer>
            {(actions) => (
               <AnimalStateContext.Consumer>
                  {(state) => (
                     <Component
                        {...props}
                        actions={actions ?? {}}
                        state={state}
                     />
                  )}
               </AnimalStateContext.Consumer>
            )}
         </AnimalActionsContext.Consumer>
      );
   };
