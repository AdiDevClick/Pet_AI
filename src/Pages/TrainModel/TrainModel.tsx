import MemoizedTasks from '@/components/Tasks/Tasks.tsx';
import { Status } from '@/components/Status/Status.tsx';
import { Instructions } from '@/components/Instructions/Instructions.tsx';
import { MemoizedTrainingTwoCards } from '@/components/Cards/TrainingTwoCards.tsx';
import originalAnimals from '@/data/animals.json';
import { useOutletContext } from 'react-router-dom';
import { memo } from 'react';
import { MemoizedControls } from '@/components/Controls/Controls.tsx';

const onlyPositive = false;
const allShuffled = true;
let animals = [];

if (allShuffled) animals = originalAnimals;
if (onlyPositive) animals = originalAnimals.slice(32, 33);

animals.forEach((animalData) => {
    let count = animals.length;
    if (animalData.images && animalData.images.length > 1) {
        animalData.images.forEach((image, index) => {
            if (index === 0) return;
            count += 1;
            animals.push(
                createImageCard(count, {
                    ...animalData,
                    images: [image],
                })
            );
        });
    }
});

Object.freeze(animals);

function createImageCard(lastId, animalData) {
    return {
        ...animalData,
        id: lastId,
    };
}

export const MemoizedTrainModel = memo(function TrainModel() {
    const { isOnLoad, count } = useOutletContext();

    const animalName = 'Chat';

    const shuffledAnimals = [...animals].sort(() => 0.5 - Math.random());
    return (
        <>
            <MemoizedTasks>chats</MemoizedTasks>
            <MemoizedControls />
            {/* <AnimalModelProvider value="state"> */}
            <Status />
            {/* </AnimalModelProvider> */}
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
                                        animalName={animalName}
                                        isOnLoad={isOnLoad}
                                    />
                                );
                            })
                        )}
                    {allShuffled &&
                        shuffledAnimals.map((animal, index) => {
                            let nextIndex = index + 1;
                            if (nextIndex >= shuffledAnimals.length)
                                nextIndex = index - 10;
                            return (
                                <MemoizedTrainingTwoCards
                                    key={(count + index) * Math.random()}
                                    animals={[
                                        {
                                            ...animal,
                                            image: animal.images[0],
                                        },
                                        {
                                            ...shuffledAnimals[nextIndex],
                                            image: shuffledAnimals[nextIndex]
                                                ?.images[0],
                                        },
                                    ]}
                                    animalName={animalName}
                                />
                            );
                        })}
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
