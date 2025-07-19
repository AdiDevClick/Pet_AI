import { useEffect, useState } from 'react';
import './App.css';
import '@css/_reset.css';
import { Header } from './components/Header/Header.tsx';
import { Tasks } from '@/components/Tasks/Tasks.tsx';
import { Controls } from '@/components/Controls/Controls.tsx';
import { Status } from '@/components/Status/Status.tsx';
import { CardsGrid } from '@/components/Cards/CardsGrid.tsx';
import { Instructions } from '@/components/Instructions/Instructions.tsx';
import {
    loadModel,
    loadNewImages,
    predictAllImages,
    resetSystem,
    saveModel,
} from '@/components/Controls/controlsFunctions.ts';
const images = [
    {
        id: '1',
        url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=300&fit=crop',
        isCorrect: true,
        description: 'Chat blanc et gris',
    },
    {
        id: '2',
        url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=300&h=300&fit=crop',
        isCorrect: false,
        description: 'Chien',
    },
    {
        id: '3',
        url: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=300&h=300&fit=crop',
        isCorrect: true,
        description: 'Chat orange',
    },
    {
        id: '4',
        url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=300&fit=crop',
        isCorrect: false,
        description: 'Chien',
    },
    {
        id: '5',
        url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300&h=300&fit=crop',
        isCorrect: true,
        description: 'Chat noir et blanc',
    },
    {
        id: '6',
        url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&h=300&fit=crop',
        isCorrect: false,
        description: 'Lapin',
    },
    {
        id: '7',
        url: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=300&h=300&fit=crop',
        isCorrect: true,
        description: 'Chat gris',
    },
    {
        id: '8',
        url: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=300&h=300&fit=crop',
        isCorrect: false,
        description: 'Chien',
    },
];

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

    useEffect(() => {
        if (resetSystem) {
            const timer = setTimeout(() => {
                setResetSystem(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [resetSystem]);

    const shuffledImages = [...images].sort(() => 0.5 - Math.random());

    return (
        <>
            <Header />
            <Tasks>chats</Tasks>
            <Controls buttons={buttons} />
            <Status
                trainingCount={trainingCount}
                accuracy={accuracy}
                predictionsCount={predictionsCount}
                resetSystem={resetSystem}
                setResetSystem={setResetSystem}
            />
            {(onLoad || count > 0) && (
                <CardsGrid key={count} images={shuffledImages} />
            )}
            <Instructions />
        </>
    );
}
