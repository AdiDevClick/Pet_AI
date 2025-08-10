import MemoizedTasks from "@/components/Tasks/Tasks.tsx";
import { Status } from "@/components/Status/Status.tsx";
import { Instructions } from "@/components/Instructions/Instructions.tsx";
import { MemoizedTrainingTwoCards } from "@/components/Cards/TrainingTwoCards.tsx";
import { useLoaderData, useOutletContext } from "react-router-dom";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { MemoizedControls } from "@/components/Controls/Controls.tsx";
import { GenericList } from "@/components/Lists/GenericList";
import type { ContextTypes } from "@/mainTypes.ts";

export const MemoizedTrainModel = memo(function TrainModel() {
   const {
      predictAllImages,
      isOnLoad,
      count,
      displayNewImages,
      onlyPositive,
      allShuffled,
      setAppRouterContext,
   } = useOutletContext<ContextTypes>();

   const { animals } = useLoaderData();
   let countRef = useRef(0).current;

   const shuffledAnimals = useMemo(
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
      if (!predictAllImages || countRef >= shuffledAnimals.length) return;
      const next = ++countRef;

      if (next >= shuffledAnimals.length) {
         setAppRouterContext((prev) => ({ ...prev, predictAllImages: false }));
      }
   }, [shuffledAnimals.length, countRef, predictAllImages]);

   /** Resets countRef if a prediction is started */
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
               {onlyPositive &&
                  shuffledAnimals.map((animalA, indexA) =>
                     shuffledAnimals.map((animalB, indexB) => {
                        // Ne pas comparer une image à elle-même
                        if (indexA >= indexB) return null;
                        return (
                           <MemoizedTrainingTwoCards
                              key={`${animalA.id}-${animalB.id}-${indexA}-${indexB}`}
                              animals={[
                                 {
                                    ...animalA,
                                    image: animalA.images[0],
                                 },
                                 {
                                    ...animalB,
                                    image: animalB.images[0],
                                 },
                              ]}
                              isOnLoad={isOnLoad}
                           />
                        );
                     })
                  )}
               {allShuffled && (
                  <GenericList items={shuffledAnimals}>
                     {(item, index) => {
                        let nextIndex = index + 1;
                        if (nextIndex >= shuffledAnimals.length)
                           nextIndex = index - 10;
                        return (
                           <MemoizedTrainingTwoCards
                              key={`${item.id}-${nextIndex}`}
                              animals={[
                                 {
                                    ...item,
                                    image: item.images[0],
                                 },
                                 {
                                    ...shuffledAnimals[nextIndex],
                                    image: shuffledAnimals[nextIndex]
                                       ?.images[0],
                                 },
                              ]}
                              isOnLoad={isOnLoad}
                              shouldPredict={predictAllImages}
                              onPredictionEnd={incrementCount}
                           />
                        );
                     }}
                  </GenericList>
               )}
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
