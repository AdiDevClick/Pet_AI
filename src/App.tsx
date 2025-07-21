import { useEffect, useState } from 'react';
import './App.css';
import '@css/_reset.css';
import { Header } from './components/Header/Header.tsx';
import { Tasks } from '@/components/Tasks/Tasks.tsx';
import { Controls } from '@/components/Controls/Controls.tsx';
import { Status } from '@/components/Status/Status.tsx';
import { Instructions } from '@/components/Instructions/Instructions.tsx';
import {
    loadModel,
    loadNewImages,
    predictAllImages,
    resetSystem,
    saveModel,
    trainModel,
} from '@/components/Controls/controlsFunctions.ts';
import { ComparePets } from '@/components/PetsCompare/ComparePets.tsx';
import { TrainingTwoCards } from '@/components/Cards/TrainingTwoCards.tsx';
import animals from '@/data/animals.json';
import { ScrollTop } from '@/components/Buttons/ScrollTop.tsx';

// const images = [
//     {
//         id: '7',
//         images: [
//             'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=300&fit=crop',
//         ],
//         isCorrect: true,
//         description: 'Chat blanc et gris',
//         name: 'Whiskers',
//     },
//     {
//         id: '8',
//         images: [
//             'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=300&h=300&fit=crop',
//         ],
//         isCorrect: false,
//         description: 'Chien',
//         name: 'Fido',
//     },
//     {
//         id: '9',
//         images: [
//             'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=300&h=300&fit=crop',
//         ],
//         isCorrect: true,
//         description: 'Chat orange',
//         name: 'Meow',
//     },
//     {
//         id: '10',
//         images: [
//             'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=300&fit=crop',
//         ],
//         isCorrect: false,
//         description: 'Chien',
//         name: 'Rex',
//     },
//     {
//         id: '11',
//         images: [
//             'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300&h=300&fit=crop',
//         ],
//         isCorrect: true,
//         description: 'Chat noir et blanc',
//         name: 'Mimi',
//     },
//     {
//         id: '12',
//         images: [
//             'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&h=300&fit=crop',
//         ],
//         isCorrect: false,
//         description: 'Lapin',
//         name: 'Doudou',
//     },
//     {
//         id: '13',
//         images: [
//             'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=300&h=300&fit=crop',
//         ],
//         isCorrect: true,
//         description: 'Chat gris',
//         name: 'Tommy',
//     },
//     {
//         id: '14',
//         images: [
//             'https://images.unsplash.com/photo-1544568100-847a948585b9?w=300&h=300&fit=crop',
//         ],
//         isCorrect: false,
//         name: 'Tom',
//         description: 'Chien',
//     },
// ];
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

let functionProps = {};
const buttons = [
    {
        label: '🔄 Nouvelles Images',
        className: 'primary',
        functions: { onClick: (e) => loadNewImages({ e, ...functionProps }) },
    },
    {
        label: '🗑️ Réinitialiser',
        className: 'danger',
        functions: { onClick: (e) => resetSystem({ e, ...functionProps }) },
    },
    {
        label: '🔮 Prédire Tout',
        className: 'success',
        functions: {
            onClick: (e) => predictAllImages({ e, ...functionProps }),
        },
    },
    {
        label: '🔧 Entraîner le Modèle',
        className: 'success',
        functions: {
            onClick: (e) => trainModel({ e, ...functionProps }),
        },
    },
    {
        label: '💾 Sauvegarder',
        className: 'primary',
        functions: { onClick: (e) => saveModel({ e, ...functionProps }) },
    },
    {
        label: '📂 Charger',
        className: 'primary',
        functions: { onClick: (e) => loadModel({ e, ...functionProps }) },
    },
];

export function App() {
    const [onLoad, setOnLoad] = useState(true);
    const [resetSystem, setResetSystem] = useState(false);
    const [count, setCount] = useState(0);
    const [predictionsCount, setPredictionsCount] = useState(0);
    const [trainingCount, setTrainingCount] = useState(0);
    const [accuracy, setAccuracy] = useState(0);
    const [showClassifier, setShowClassifier] = useState(true);

    // useEffect(() => {
    //     // Initialiser le classificateur d'images
    //     if (window.imageClassifier) {
    //         window.imageClassifier.createModel().then((success) => {
    //             if (success) {
    //                 setShowClassifier(true);
    //             } else {
    //                 console.error('Échec de la création du modèle');
    //             }
    //         });
    //     } else {
    //         console.error('Le classificateur d\'images n\'est pas disponible');
    //     }
    // }, []);

    useEffect(() => {
        if (resetSystem) {
            setOnLoad(true);
            setCount(0);
            setPredictionsCount(0);
            setTrainingCount(0);
            setAccuracy(0);
            setShowClassifier(false);

            const timer = setTimeout(() => {
                setResetSystem(false);
            }, 2000);
            return () => clearTimeout(timer);
            // } else {
            //     setOnLoad(true);
        }
    }, [resetSystem]);

    // useEffect(() => {
    //     if (resetSystem) {
    //         const timer = setTimeout(() => {
    //             setResetSystem(false);
    //         }, 2000);
    //         return () => clearTimeout(timer);
    //     }
    // }, [resetSystem]);

    const animalName = 'Chat';

    functionProps = {
        ...functionProps,
        onLoad,
        setOnLoad,
        predictionsCount,
        setPredictionsCount,
        trainingCount,
        setTrainingCount,
        setCount,
        count,
        setResetSystem,
    };
    // if (showClassifier) {
    //     return <ImageClassifier />;
    // }

    const shuffledAnimals = [...animals].sort(() => 0.5 - Math.random());
    // console.log(shuffledAnimals);
    return (
        <>
            <Header />
            <Tasks>chats</Tasks>
            <Controls buttons={buttons} />
            <Status
                // trainingCount={trainingCount}
                accuracy={accuracy}
                predictionsCount={predictionsCount}
                resetSystem={resetSystem}
                setResetSystem={setResetSystem}
            />
            {(onLoad || count > 0) && (
                <>
                    {shuffledAnimals.map((animal, index) => {
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
            <ComparePets />
            <Instructions />
            <ScrollTop />
        </>
    );
}
