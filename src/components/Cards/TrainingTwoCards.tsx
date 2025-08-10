import { Button } from "@/components/Buttons/Button.tsx";
import { CardFeedback } from "@/components/Cards/CardFeedback.tsx";
import { CardPrediction } from "@/components/Cards/CardPrediction.tsx";
import { GenericCard } from "@/components/Cards/GenericCard.tsx";
import { GenericFigure } from "@/components/Images/GenericFigure.tsx";
import {
   memo,
   use,
   useCallback,
   useEffect,
   useMemo,
   useRef,
   useState,
   type HTMLAttributes,
   type MouseEvent,
} from "react";
import "@css/card.scss";
import { AnimalActionsContext } from "@/api/context/animalContext/AnimalModelContext.tsx";
import { UniqueSet } from "@/lib/UniqueSet.ts";
import type {
   TrainingTwoCardsProps,
   TrainingTwoCardsState,
} from "@/components/Cards/types/CardTypes.ts";
import { makeTrainingButtons } from "@/configs/training.config.ts";
import { ListMapper } from "@/components/Lists/ListMapper.tsx";

const initialState = {
   results: {
      sameAnimal: false,
      confidence: 0,
   },
   isCorrect: null!,
   showPrediction: false,
   imagesShown: new UniqueSet<string, HTMLImageElement>(),
} as const;

/**
 * Comparing two animal images.
 *
 * @param animals Array of animal objects to be compared.
 * @param isOnLoad Indicates if the app is in loading state.
 * This is used in the AddTrainingPair in order to avoid a lag
 * when adding new training pairs for the first time
 */
export const MemoizedTrainingTwoCards = memo(function TrainingTwoCards<
   T extends HTMLAttributes<HTMLDivElement>
>({
   animals,
   isOnLoad,
   shouldPredict,
   onPredictionEnd,
}: TrainingTwoCardsProps<T>) {
   // Local state
   const [state, setState] = useState<TrainingTwoCardsState>(initialState);
   // Ensure we count at most once per prediction wave
   const countedRef = useRef(false);
   // Context
   const { compareAnimals, addTrainingPair } = use(AnimalActionsContext);
   /**
    * Handle user results for the image comparison.
    *
    * @param e Click event
    * @param selectedCorrect Indicates if the selected images are of the same animal
    */
   const handleUserResults = useCallback(
      async (e: MouseEvent<HTMLButtonElement>, selectedCorrect: boolean) => {
         e.preventDefault();
         setState((prev) => ({ ...prev, isCorrect: selectedCorrect }));

         if (state.imagesShown.size() === 2) {
            const entries = Array.from(state.imagesShown.values());

            addTrainingPair({
               imgArray: entries,
               isSameAnimal: selectedCorrect,
               count: isOnLoad ? 1 : 0,
            });
         }
      },
      [addTrainingPair, isOnLoad, state.imagesShown]
   );

   /**
    * Handle the prediction of the selected images.
    *
    * @param e Click event
    */
   const handlePredict = useCallback(
      async (e: MouseEvent<HTMLButtonElement> | null) => {
         e?.preventDefault();
         if (state.imagesShown.size() === 2) {
            const entries = Array.from(state.imagesShown.values());
            const result = await compareAnimals(entries);
            if (
               shouldPredict &&
               result &&
               !countedRef.current &&
               onPredictionEnd
            ) {
               await onPredictionEnd();
               countedRef.current = true;
            }

            setState((prev) => ({
               ...prev,
               results: result,
               showPrediction: true,
            }));
         }
      },
      [compareAnimals, state.imagesShown, shouldPredict]
   );

   /**
    * Callback function to handle image references.
    *
    * @description This will add the image element
    * to the UniqueSet().
    *
    * @param element The HTMLImageElement reference
    */
   const onImageRef = useCallback((element: HTMLImageElement) => {
      if (element) {
         setState((prev) => ({
            ...prev,
            imagesShown: prev.imagesShown.clone().set(element.id, element),
         }));
      }
   }, []);

   // Build buttons from config and UI maps over it
   const trainingButtons = useMemo(
      () =>
         makeTrainingButtons({
            onUserResults: handleUserResults,
            onPredict: handlePredict,
         }),
      [handleUserResults, handlePredict]
   );

   /**
    * Will call a prediction
    * if the app/parent is asking for it
    */
   useEffect(() => {
      if (shouldPredict && state.imagesShown.size() === 2) {
         countedRef.current = false;
         handlePredict(null);
      }
   }, [shouldPredict, state.imagesShown]);

   return (
      <GenericCard className={checkUserSelection(state.isCorrect)}>
         <div className="card__image-choice">
            <ListMapper items={animals}>
               <GenericFigure ref={onImageRef} className="card__description" />
            </ListMapper>
         </div>
         <div className="card__actions">
            <ListMapper items={trainingButtons}>
               <Button />
            </ListMapper>
         </div>
         <CardFeedback isCorrect={state.isCorrect} />
         <CardPrediction
            showPrediction={state.showPrediction}
            prediction={"error" in state.results ? null : state.results}
         />
      </GenericCard>
   );
});

/**
 * Checks the user's selection state.
 *
 * @param isCorrect A boolean indicating the user's selection
 * @returns The className representing the user's selection
 */
function checkUserSelection(isCorrect: boolean): string {
   if (isCorrect === false) {
      return "selected-incorrect";
   }
   if (isCorrect) {
      return "selected-correct";
   }
   return "";
}
