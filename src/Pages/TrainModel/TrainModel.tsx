import MemoizedTasks from "@/components/Tasks/Tasks.tsx";
import { Status } from "@/components/Status/Status.tsx";
import { Instructions } from "@/components/Instructions/Instructions.tsx";
import { MemoizedTrainingTwoCards } from "@/components/Cards/TrainingTwoCards.tsx";
import { useLoaderData, useOutletContext } from "react-router-dom";
import { memo, useCallback, useEffect, useId, useMemo, useRef } from "react";
import { MemoizedControls } from "@/components/Controls/Controls.tsx";
import { GenericList } from "@/components/Lists/GenericList";
import type { ContextTypes } from "@/mainTypes.ts";

/**
 * Training Page for comparing and training animal images.
 */
export const MemoizedTrainModel = memo(function TrainModel() {
   const {
      predictAllImages,
      isOnLoad,
      count,
      displayNewImages,
      setAppRouterContext,
   } = useOutletContext<ContextTypes>();

   const { animals } = useLoaderData();
   const shuffleId = useId();
   let countRef = useRef(0).current;

   const shuffledAnimalsMemo = useMemo(
      () => [...animals].sort(() => 0.5 - Math.random()),
      [animals, displayNewImages]
   );

   /**
    * Increments the countRef.
    * This is used to track how many images
    * have been predicted.
    *
    * @description It will reset the predictionAllImages flag
    * after the last image has been predicted.
    */
   const incrementCount = useCallback(() => {
      if (!predictAllImages || countRef >= shuffledAnimalsMemo.length) return;
      const next = ++countRef;

      if (next >= shuffledAnimalsMemo.length) {
         setAppRouterContext((prev) => ({ ...prev, predictAllImages: false }));
      }
   }, [shuffledAnimalsMemo.length, countRef, predictAllImages]);

   /**
    * Resets countRef if a prediction is started
    */
   useEffect(() => {
      if (predictAllImages) {
         countRef = 0;
      }
   }, [predictAllImages]);

   return (
      <>
         <MemoizedTasks>chats</MemoizedTasks>
         <MemoizedControls />
         <Status />
         {(isOnLoad || count > 0) && (
            <>
               <GenericList items={shuffledAnimalsMemo}>
                  {(pair, idx) => (
                     <MemoizedTrainingTwoCards
                        key={`${shuffleId}-${pair[0].id}-${pair[1].id}-${idx}`}
                        animals={pair}
                        isOnLoad={isOnLoad}
                        shouldPredict={predictAllImages}
                        onPredictionEnd={incrementCount}
                     />
                  )}
               </GenericList>
               {/* <CardsGrid
                        key={count}
                        images={shuffledAnimals}
                        animalName={animalName}
                    /> */}
            </>
         )}
         <Instructions />
      </>
   );
});

export default MemoizedTrainModel;
