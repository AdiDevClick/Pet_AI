import {
    addTrainingPairToModel,
    checkIfInitialized,
    compareImages,
    getDataBalance,
    initialize,
    loadModelFromData,
    loadStorageData,
    save,
    trainModel,
} from '@/hooks/models/modelHookFunctions.ts';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// Hook personnalisé pour l'identification d'animaux
export function useAnimalIdentification() {
    const [model, setModel] = useState({
        isInitialized: false,
        featureExtractor: null,
        siameseModel: null,
    });
    const [status, setStatus] = useState({
        loadingState: {
            message: 'Initialisation du modèle',
            isLoading: 'initializing',
            type: 'initializing',
        },
        siameseModelInitialized: false,
        featureExtractorInitialized: false,
        localStorageDataLoaded: false,
        trainingPairs: [],
        comparisonsCount: 0,
        accuracy: 0,
        pairsArrayForSaving: [],
        balance: { positive: 0, negative: 0, total: 0 },
        similarityScore: 0,
        sameAnimal: false,
        confidence: 0,
        trainEpochCount: 0,
        loss: 0,
        error: {
            status: '',
            message: '',
        },
    });
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
     * Toaster Handler
     * @description Triggers a toaster notification when
     * the loadingstate changes.
     */
    useEffect(() => {
        if (status.error.message) {
            toast.dismiss(`loading-${status.loadingState.type}`);
            return;
        }
        if (status.loadingState.isLoading) {
            toast.dismiss(`loading-${status.loadingState.type}`);

            // Show success message when loading is done
            if (status.loadingState.isLoading === 'done') {
                toast.success(status.loadingState.message, {
                    position: 'top-right',
                });
            }

            // Show loading state messages
            if (status.loadingState.isLoading !== 'done') {
                toast.loading(status.loadingState.message, {
                    position: 'top-right',
                    id: `loading-${status.loadingState.type}`,
                });
            }
        }
    }, [status.loadingState, status.error.message]);

    /**
     * Error Toaster Handler
     * @description This will show an error message
     * if there is an error in the status.
     */
    useEffect(() => {
        // Show error message if there is an error in the status
        if (status.error.message) {
            toast.dismiss(`loading-${status.loadingState.type}`);

            // toast.getHistory().forEach((t) => {
            //     if (t.type === 'loading') toast.dismiss(t.id);
            // });
            toast.error(status.error.message, {
                position: 'top-right',
            });
            setStatus((prev) => ({
                ...prev,
                error: { status: '', message: '' },
                loadingState: { message: '', isLoading: '', type: '' },
            }));
        }
    }, [status.error.message, status.error.status, status.loadingState.type]);

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
        if (!model.isInitialized || status.localStorageDataLoaded) {
            // setStatus((prev) => ({
            //     ...prev,
            //     error: {
            //         status: 'error',
            //         message: 'Modèle non initialisé',
            //     },
            // }));
            return;
        }

        if (!status.localStorageDataLoaded) {
            setStatus((prev) => ({
                ...prev,
                loadingState: {
                    message: 'Chargement des données images...',
                    isLoading: 'storage',
                    type: 'storage',
                },
            }));

            const trainingPairs = JSON.parse(
                localStorage.getItem(configRef.current.localStorageKey)
            );

            loadStorageData({
                setStatus,
                isInitialized: model.isInitialized,
                config: configRef.current,
                trainingPairs,
            });
        }
    }, [model.isInitialized, status.localStorageDataLoaded]);

    /**
     * Initialize the animal identification model.
     */
    const initializeModel = useCallback(() => {
        if (!model.isInitialized) {
            initialize({
                setStatus,
                setModel,
                config: configRef.current,
                isInitialized: model.isInitialized,
                status,
            });
        }
    }, [status.siameseModelInitialized, model.isInitialized]);

    /**
     * Calculates the balance of training pairs.
     * This will trigger each time the training pairs are updated.
     * @description -It counts the number of positive and negative pairs.
     */
    useEffect(() => {
        getDataBalance({ trainingPairs: status.trainingPairs, setStatus });
    }, [status.trainingPairs]);

    /**
     * This will start training the model.
     * It checks if the model is initialized and if the training state is not already 'training
     */
    const startModelTraining = useCallback(() => {
        if (!model.isInitialized) {
            setStatus((prev) => ({
                ...prev,
                error: {
                    status: 'error',
                    message: "Le modèle n'est pas initialisé",
                },
            }));
            return;
        }

        if (status.loadingState.isLoading !== 'training') {
            setStatus((prev) => ({
                ...prev,
                loadingState: {
                    message: "Début de l'entraînement...",
                    isLoading: 'training',
                    type: 'training',
                },
            }));
            trainModel({
                status,
                setStatus,
                model,
                config: configRef.current,
                initializeModel,
            });
        }
    }, [model, initializeModel, status]);

    /**
     * Compares two images to identify if
     * they belong to the same animal.
     * @param {Array} imagesArray - An array containing two image elements.
     */
    const compareAnimals = useCallback(
        (imagesArray) => {
            try {
                checkIfInitialized(model.isInitialized);
                compareImages({
                    imageArray: imagesArray,
                    config: configRef.current,
                    setStatus,
                    model,
                    status,
                    initializeModel,
                });
            } catch (error) {
                setStatus((prev) => ({
                    ...prev,
                    error: {
                        status: 'error',
                        message: `Erreur lors de la comparaison: ${error.message}`,
                    },
                }));
            }
        },
        [model.isInitialized, model.siameseModel, status]
    );

    // Réinitialiser le modèle
    const resetModel = useCallback(() => {
        if (!model.isInitialized) return false;

        try {
            status.trainingPairs.forEach((pair) => {
                if (pair.image1) pair.image1.dispose();
                if (pair.image2) pair.image2.dispose();
            });
            // setLastResult(null);
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
    }, [model.isInitialized, status.trainingPairs]);

    // Sauvegarder le modèle
    const saveModel = useCallback(
        async (name = null) => {
            try {
                checkIfInitialized(model.isInitialized);
                save({
                    name,
                    status,
                    setStatus,
                    model,
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
        [
            model.featureExtractor,
            model.siameseModel,
            status,
            model.isInitialized,
        ]
    );

    // Charger un modèle
    const loadModel = useCallback(async (modelData = null) => {
        loadModelFromData({
            modelData,
            setModel,
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
        isInitialized: model.isInitialized,
        status,

        /** Actions */
        initializeModel,
        addTrainingPair,
        startModelTraining,
        compareAnimals,
        // findMatches,
        resetModel,
        saveModel,
        loadModel,
    };
}
