import {
    addTrainingPairToModel,
    checkIfInitialized,
    compareImages,
    getDataBalance,
    initialize,
    loadData,
    loadModelFromData,
    loadStorageData,
    save,
    trainModel,
} from '@/hooks/models/modelHookFunctions.ts';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// Hook personnalisé pour l'identification d'animaux
export function useAnimalIdentification() {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isTraining, setIsTraining] = useState(false);
    const [isComparing, setIsComparing] = useState(false);
    const [featureExtractor, setFeatureExtractor] = useState(null);
    const [siameseModel, setSiameseModel] = useState(null);
    const [status, setStatus] = useState({
        loadingState: { message: '', isLoading: '' },
        siameseModelInitialized: false,
        featureExtractorInitialized: false,
        localStorageDataLoaded: false,
        trainingPairs: [],
        comparisons: 0,
        accuracy: 0,
        pairsArrayForSaving: [],
        balance: { positive: 0, negative: 0, total: 0 },
        similarity: 0,
        sameAnimal: false,
        confidence: 0,
        trainEpochCount: 0,
        loss: 0,
        error: {
            status: '',
            message: '',
        },
    });
    const [lastResult, setLastResult] = useState(null);
    const configRef = useRef({
        featureSize: 256,
        imageSize: 224,
        localStorageKey: 'pair-array',
        augment: true,
        epochs: 100,
        batchSize: 4,
        validationSplit: 0.2,
        learningRate: 0.001,
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy'],
        predictionThreshold: 0.7,
        taskName: 'task',
    });

    /**
     * Initialized the feature extractor and Siamese model.
     * This will be called on component mount.
     */
    useEffect(() => {
        initializeModel();
    }, []);

    /**
     * Load training pairs from local storage.
     * This will be triggered after the model is initialized.
     */
    useEffect(() => {
        if (!isInitialized) return;

        if (!status.loadingState.isLoading && !status.localStorageDataLoaded) {
            setStatus((prev) => ({
                ...prev,
                loadingState: {
                    message: 'Chargement des données images...',
                    isLoading: 'storage',
                },
            }));

            const trainingPairs = JSON.parse(
                localStorage.getItem(configRef.current.localStorageKey)
            );

            loadStorageData({
                setStatus,
                setIsTraining,
                isInitialized,
                status,
                config: configRef.current,
                trainingPairs,
            });
        }
    }, [isInitialized, status.loadingState]);

    /**
     * Triggers a toaster notification when the loading state changes.
     */
    useEffect(() => {
        // Show loading state messages
        if (
            status.loadingState.isLoading &&
            status.loadingState.isLoading !== 'done'
        ) {
            toast.loading(status.loadingState.message, {
                position: 'top-right',
            });
        }
        // Show success message when loading is done
        if (
            status.loadingState.isLoading &&
            status.loadingState.isLoading === 'done'
        ) {
            setStatus((prev) => ({
                ...prev,
                loadingState: { ...prev.loadingState, isLoading: '' },
            }));
            toast.dismiss();
            toast.success(status.loadingState.message, {
                position: 'top-right',
            });
        }
    }, [status.loadingState]);

    /**
     * Initialize the animal identification model.
     */
    const initializeModel = useCallback(() => {
        setStatus((prev) => ({
            ...prev,
            loadingState: {
                message: 'Initialisation du modèle',
                isLoading: 'initializing',
            },
        }));
        initialize({
            setStatus,
            setIsInitialized,
            setFeatureExtractor,
            setSiameseModel,
            config: configRef.current,
            isInitialized,
            featureExtractor,
            status,
        });
    }, [status, isInitialized, featureExtractor]);

    /**
     * Calculates the balance of training pairs.
     * This will trigger each time the training pairs are updated.
     * @description -It counts the number of positive and negative pairs.
     */
    useEffect(() => {
        getDataBalance({ trainingPairs: status.trainingPairs, setStatus });
    }, [status.trainingPairs]);

    // Entraîner le modèle manuellement
    const startModelTraining = useCallback(async () => {
        if (!isInitialized) {
            console.error("Système d'identification non initialisé");
            return false;
        }

        trainModel({
            status,
            setStatus,
            siameseModel,
            isInitialized,
            config: configRef.current,
            isTraining,
            setIsTraining,
            startModelTraining,
        });
    }, []);

    // Comparer deux images
    const compareAnimals = useCallback(
        (image1Element, image2Element) => {
            try {
                checkIfInitialized(isInitialized);
                setIsComparing(true);
                compareImages({
                    imageArray: [image1Element, image2Element],
                    config: configRef.current,
                    setStatus,
                    isInitialized,
                    siameseModel,
                    status,
                    startModelTraining,
                });

                setIsComparing(false);
            } catch (error) {
                setIsComparing(false);
                setStatus((prev) => ({
                    ...prev,
                    error: {
                        status: 'error',
                        message: `Erreur lors de la comparaison: ${error.message}`,
                    },
                }));
            }
        },
        [isInitialized, siameseModel, status]
    );

    // Réinitialiser le modèle
    const resetModel = useCallback(() => {
        if (!isInitialized) return false;

        try {
            status.trainingPairs.forEach((pair) => {
                if (pair.image1) pair.image1.dispose();
                if (pair.image2) pair.image2.dispose();
            });
            setLastResult(null);
            setStatus((prev) => ({
                ...prev,
                trainingPairs: [],
                comparisonCount: 0,
            }));

            initializeModel();
        } catch (error) {
            setStatus((prev) => ({
                ...prev,
                error: {
                    status: 'error',
                    message: `Erreur lors de la réinitialisation: ${error.message}`,
                },
            }));
        }
    }, [isInitialized, status.trainingPairs]);

    // Sauvegarder le modèle
    const saveModel = useCallback(
        async (name = null) => {
            try {
                checkIfInitialized(isInitialized);
                save({
                    name,
                    status,
                    setStatus,
                    featureExtractor,
                    siameseModel,
                    config: configRef.current,
                });
            } catch (error) {
                setStatus((prev) => ({
                    ...prev,
                    error: {
                        status: 'error',
                        message: `Erreur lors de la sauvegarde: ${error.message}`,
                    },
                }));
            }
        },
        [featureExtractor, siameseModel, status, isInitialized]
    );

    // Charger un modèle
    const loadModel = useCallback(async (modelData = null) => {
        loadModelFromData({
            modelData,
            setIsInitialized,
            setFeatureExtractor,
            setSiameseModel,
            config: configRef.current,
            setStatus,
        });
    }, []);

    const addTrainingPair = useCallback(
        async (image1Element, image2Element, isSameAnimal) => {
            addTrainingPairToModel({
                imgPairArray: [image1Element, image2Element],
                isSameAnimal,
                setStatus,
                setIsTraining,
                isInitialized,
                status,
                config: configRef.current,
            });
        },
        []
    );

    return {
        /** State */
        isInitialized,
        isTraining,
        isComparing,
        status,
        lastResult,

        /** Actions */
        initializeModel,
        addTrainingPair,
        startModelTraining,
        compareAnimals,
        // findMatches,
        resetModel,
        saveModel,
        loadModel,
        // updateStats,
    };
}
