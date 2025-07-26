import { Tasks } from '@/components/Tasks/Tasks.tsx';
import { Status } from '@/components/Status/Status.tsx';
import { Instructions } from '@/components/Instructions/Instructions.tsx';
import { TrainingTwoCards } from '@/components/Cards/TrainingTwoCards.tsx';
import originalAnimals from '@/data/animals.json';
import { useOutletContext } from 'react-router-dom';
import { Controls } from '@/components/Controls/Controls.tsx';

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

export function TrainModel() {
    const {
        onLoad,
        setOnLoad,
        predictionsCount,
        setPredictionsCount,
        trainingCount,
        setTrainingCount,
        setCount,
        count,
        setResetSystem,
        resetSystem,
        accuracy,
    } = useOutletContext();

    const animalName = 'Chat';

    const shuffledAnimals = [...animals].sort(() => 0.5 - Math.random());

    return (
        <>
            <Tasks>chats</Tasks>
            <Controls />
            <Status
                accuracy={accuracy}
                predictionsCount={predictionsCount}
                resetSystem={resetSystem}
                setResetSystem={setResetSystem}
            />
            {(onLoad || count > 0) && (
                <>
                    {onlyPositive &&
                        shuffledAnimals.map((animalA, indexA) =>
                            shuffledAnimals.map((animalB, indexB) => {
                                // Ne pas comparer une image à elle-même
                                if (indexA >= indexB) return null;

                                return (
                                    <TrainingTwoCards
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
                                <TrainingTwoCards
                                    key={(count + index) * Math.random()}
                                    animals={[
                                        { ...animal, image: animal.images[0] },
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
}
