import { useEffect, useState } from 'react';

// Types pour l'interface avec le script global
interface ImageClassifierTF {
    model: any;
    isTraining: boolean;
    trainingData: Array<{ image: any; label: number }>;
    addTrainingData: (imageElement: HTMLImageElement, isCorrect: boolean) => Promise<void>;
    predict: (imageElement: HTMLImageElement) => Promise<{
        incorrect: number;
        correct: number;
        prediction: 'correct' | 'incorrect';
        confidence: number;
    }>;
    reset: () => Promise<void>;
    saveModel: (name?: string) => Promise<void>;
    loadModel: (name?: string) => Promise<boolean>;
}

declare global {
    interface Window {
        imageClassifier: ImageClassifierTF;
    }
}

export function useTensorFlowScript() {
    const [isReady, setIsReady] = useState(false);
    const [trainingCount, setTrainingCount] = useState(0);
    
    useEffect(() => {
        // Vérifier si le classificateur est prêt
        const checkReady = setInterval(() => {
            if (window.imageClassifier?.model) {
                setIsReady(true);
                clearInterval(checkReady);
            }
        }, 500);

        return () => clearInterval(checkReady);
    }, []);

    // Mettre à jour le compteur d'entraînement
    useEffect(() => {
        const updateStats = setInterval(() => {
            if (window.imageClassifier?.trainingData) {
                setTrainingCount(window.imageClassifier.trainingData.length);
            }
        }, 1000);

        return () => clearInterval(updateStats);
    }, []);

    const addTrainingData = async (imageElement: HTMLImageElement, isCorrect: boolean) => {
        if (window.imageClassifier) {
            await window.imageClassifier.addTrainingData(imageElement, isCorrect);
        }
    };

    const predict = async (imageElement: HTMLImageElement) => {
        if (window.imageClassifier) {
            return await window.imageClassifier.predict(imageElement);
        }
        return null;
    };

    const resetModel = async () => {
        if (window.imageClassifier) {
            await window.imageClassifier.reset();
        }
    };

    const saveModel = async (name?: string) => {
        if (window.imageClassifier) {
            await window.imageClassifier.saveModel(name);
        }
    };

    const loadModel = async (name?: string) => {
        if (window.imageClassifier) {
            return await window.imageClassifier.loadModel(name);
        }
        return false;
    };

    return {
        isReady,
        trainingCount,
        addTrainingData,
        predict,
        resetModel,
        saveModel,
        loadModel,
        classifier: window.imageClassifier
    };
}
