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
import type {
    AddTrainingPairCallBackProps,
    AnimalIdentification,
    CompareImagesProps,
    ConfigTypes,
    ModelTypes,
    StatusTypes,
} from '@/hooks/models/useAnimalIdentificationTypes.ts';
import { wait } from '@/lib/utils.ts';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// Hook personnalisé pour l'identification d'animaux
export function useAnimalIdentification(): AnimalIdentification {
    const [model, setModel] = useState<ModelTypes>({
        isInitialized: false,
        featureExtractor: null!,
        siameseModel: null!,
    });

    const [status, setStatus] = useState<StatusTypes>({
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
    const configRef = useRef<ConfigTypes>({
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
    const statusRef = useRef(status);

    /**
     * Update the status reference whenever the status changes.
     * Used to avoid unnecessary re-renders due
     * to closures in callbacks.
     */
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    const updateStatus = useCallback((newStatus: Partial<StatusTypes>) => {
        setStatus((prev) => {
            const merged = { ...prev };
            Object.entries(newStatus).forEach(([key, value]) => {
                // Si la propriété existe et est un tableau, et la nouvelle valeur est aussi un tableau
                if (Array.isArray(prev[key])) {
                    merged[key] = [
                        ...prev[key],
                        ...(Array.isArray(value) ? value : [value]),
                    ];
                } else {
                    merged[key] = value;
                }
            });

            return merged;
        });
        // setStatus((prev) => {
        // const merged = { ...prev };
        // Object.entries(newStatus).forEach(([key, value]) => {
        //     // Spread uniquement pour les propriétés tableau
        //     if (
        //         (key === 'trainingPairs' || key === 'pairsArrayForSaving') &&
        //         Array.isArray(prev[key])
        //     ) {
        //         merged[key] = [
        //             ...prev[key],
        //             ...(Array.isArray(value) ? value : [value]),
        //         ];
        //     } else {
        //         merged[key] = value;
        //     }
        // });
        // return merged;
        // });
    }, []);

    /**
     * Initialize the animal identification model.
     */
    const initializeModel = useCallback(() => {
        if (!model.isInitialized) {
            const results = initialize({
                config: configRef.current,
                isInitialized: model.isInitialized,
            });
            if (results) {
                if ('error' in results) {
                    updateStatus({
                        ...results,
                    });
                    return;
                }

                setModel((prev) => ({
                    ...prev,
                    ...results,
                }));
                updateStatus({
                    siameseModelInitialized: true,
                    featureExtractorInitialized: true,
                    loadingState: {
                        message: 'Modèle initialisé',
                        isLoading: 'done',
                        type: 'initializing',
                    },
                });
            }
        }
    }, [model.isInitialized]);

    /**
     * This will start training the model.
     * It checks if the model is initialized and if the training state is not already 'training
     */
    const startModelTraining = useCallback(() => {
        if (!model.isInitialized) {
            updateStatus({
                error: {
                    status: 'error',
                    message: "Le modèle n'est pas initialisé",
                },
            });
            return;
        }

        if (statusRef.current.loadingState.isLoading !== 'training') {
            updateStatus({
                loadingState: {
                    message: "Début de l'entraînement...",
                    isLoading: 'training',
                    type: 'training',
                },
            });
            trainModel({
                status: statusRef.current,
                updateStatus,
                model,
                config: configRef.current,
                initializeModel,
            });
        }
    }, [model]);

    /**
     * Compares two images to identify if
     * they belong to the same animal.
     *
     * @param imagesArray - An array containing two image elements.
     * @return A promise that resolves to the comparison result.
     * `exemple : { similarityScore: 0.85, sameAnimal: true, confidence: 0.7 }`
     */
    const compareAnimals = useCallback(
        async (imagesArray: CompareImagesProps['imageArray']) => {
            updateStatus({
                loadingState: {
                    message: 'Comparaison des images...',
                    isLoading: 'comparison',
                    type: 'comparison',
                },
            });
            // Avoid the first lag
            if (statusRef.current.comparisonsCount === 0) await wait(100);
            // try {
            // checkIfInitialized(model.isInitialized);
            const results = await compareImages({
                imageArray: imagesArray,
                config: configRef.current,
                model,
                initializeModel,
            });

            if ('error' in results) {
                updateStatus({
                    ...results,
                });
                return results;
            }

            updateStatus({
                comparisonsCount: statusRef.current.comparisonsCount + 1,
                ...results,
                loadingState: {
                    message: `Comparaison ${
                        statusRef.current.comparisonsCount + 1
                    } terminée`,
                    isLoading: 'done',
                    type: 'comparison',
                },
            });
            return results;
            // } catch (error) {
            //     updateStatus({
            //         error: {
            //             status: 'error',
            //             message: `Erreur lors de la comparaison: ${error.message}`,
            //         },
            //     });
            // }
        },
        [model]
    );

    // Réinitialiser le modèle
    const resetModel = useCallback(() => {
        if (!model.isInitialized) return false;

        try {
            statusRef.current.trainingPairs.forEach((pair) => {
                if (pair.image1) pair.image1.dispose();
                if (pair.image2) pair.image2.dispose();
            });
            // setLastResult(null);
            updateStatus({
                trainingPairs: [],
                comparisonCount: 0,
            });

            initializeModel();
        } catch (error) {
            updateStatus({
                error: {
                    status: 'error',
                    message: `Erreur lors de la réinitialisation: ${error.message}`,
                },
            });
        }
    }, [model.isInitialized, statusRef.current.trainingPairs]);

    // Sauvegarder le modèle
    const saveModel = useCallback(
        async (name = null) => {
            try {
                checkIfInitialized(model.isInitialized);
                save({
                    name,
                    status: statusRef.current,
                    updateStatus,
                    model,
                    config: configRef.current,
                });
            } catch (error) {
                updateStatus({
                    error: {
                        status: 'error',
                        message: `Erreur lors de la sauvegarde: ${error.message}`,
                    },
                });
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
            updateStatus,
        });
    }, []);

    /**
     * Add a training pair to the model.
     *
     * @description This will update the status with
     * the new image pair transformed into a tensor.
     *
     * @param imgArray - An array containing two image elements.
     * @param isSameAnimal - A boolean indicating if the images are of the same animal.
     */
    const addTrainingPair = useCallback(
        async ({
            imgArray,
            isSameAnimal,
            count,
        }: AddTrainingPairCallBackProps) => {
            updateStatus({
                loadingState: {
                    message: "Ajout de la paire d'entraînement...",
                    isLoading: 'adding',
                    type: 'adding',
                },
            });
            // Avoid the first lag
            if (count === 0) await wait(100);
            const pair = addTrainingPairToModel({
                imgArray,
                isSameAnimal,
                config: configRef.current,
                isInitialized: model.isInitialized,
            });
            if (pair) {
                if ('error' in pair) {
                    updateStatus({
                        ...pair,
                    });
                    return;
                }
                updateStatus({
                    trainingPairs: pair.trainingPairs,
                    pairsArrayForSaving: pair.pairsArrayForSaving,
                    loadingState: {
                        message: "Paire d'entraînement ajoutée avec succès",
                        isLoading: 'done',
                        type: 'adding',
                    },
                });
            }
        },
        [model.isInitialized]
    );

    /**
     * Load image pairs from local storage.
     *
     * @description Each pair will be transformed into a tensor
     * and added to the training pairs state.
     */
    const loadFromStorageData = useCallback(async () => {
        if (
            !model.isInitialized ||
            statusRef.current.localStorageDataLoaded ||
            statusRef.current.loadingState.isLoading !== 'storage'
        )
            return;

        const trainingPairs = JSON.parse(
            localStorage.getItem(configRef.current.localStorageKey)
        );

        const results = await loadStorageData({
            isInitialized: model.isInitialized,
            config: configRef.current,
            trainingPairs,
        });

        if (results) {
            if (
                'error' in results &&
                results.error?.status.toString() === '404'
            ) {
                // Helps the toaster to be able to show the message
                await wait(100);
                updateStatus({
                    ...results,
                    localStorageDataLoaded: true,
                });
                return;
            }
            updateStatus({
                ...results,
                loadingState: {
                    message: 'Données image chargées',
                    isLoading: 'done',
                    type: 'storage',
                },
                localStorageDataLoaded: true,
            });
        }
    }, [
        model.isInitialized,
        statusRef.current.localStorageDataLoaded,
        statusRef.current.loadingState.isLoading,
        statusRef.current.loadingState.type,
        statusRef.current.loadingState.message,
    ]);

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
        if (!model.isInitialized || status.localStorageDataLoaded) return;
        updateStatus({
            loadingState: {
                message: 'Chargement des données images...',
                isLoading: 'storage',
                type: 'storage',
            },
        });
        loadFromStorageData();
    }, [
        model.isInitialized,
        status.localStorageDataLoaded,
        status.loadingState.isLoading,
    ]);

    /**
     * Error Toaster Handler
     * @description This will show an error message
     * if there is an error in the statusRef.current.
     */
    useEffect(() => {
        if (status.error.message) {
            // toast.dismiss();
            toast.dismiss(`loading-${status.loadingState.type}`);

            // toast.getHistory().forEach((t) => {
            //     if (t.type === 'loading') toast.dismiss(t.id);
            // });
            toast.error(status.error.message, {
                position: 'top-right',
            });
            updateStatus({
                error: { status: '', message: '' },
                loadingState: { message: '', isLoading: '', type: '' },
            });
        }
    }, [
        status.error.message,
        status.loadingState.type,
        // statusRef.current.error,
    ]);

    /**
     * Toaster Handler
     * @description Triggers a toaster notification when
     * the loadingstate changes.
     */
    useEffect(() => {
        if (status.error.message || !status.loadingState.message) {
            return;
        }
        if (status.loadingState.isLoading) {
            console.log(
                'jentre dans le toaster handler',
                status.loadingState.type
            );

            // Show success message when loading is done
            if (status.loadingState.isLoading === 'done') {
                console.log('done : ', status.loadingState.type);
                toast.dismiss(`loading-${status.loadingState.type}`);
                toast.success(status.loadingState.message, {
                    position: 'top-right',
                });
                updateStatus({
                    loadingState: {
                        message: '',
                        isLoading: '',
                        type: '',
                    },
                });
            }
            if (status.loadingState.isLoading !== 'done') {
                console.log('object : ', status.loadingState.type);
                // toast.dismiss(`loading-${status.loadingState.type}`);
                toast.loading(status.loadingState.message, {
                    position: 'top-right',
                    id: `loading-${status.loadingState.type}`,
                });
            }
        }
    }, [
        status.loadingState.isLoading,
        status.loadingState.type,
        status.loadingState.message,
    ]);

    /**
     * Calculates the balance of training pairs.
     * This will trigger each time the training pairs are updated.
     * @description -It counts the number of positive and negative pairs.
     */
    useEffect(() => {
        const results = getDataBalance({
            trainingPairs: status.trainingPairs,
        });
        updateStatus({
            balance: results,
        });
    }, [status.trainingPairs]);

    // console.log('JE RERENDER LE HOOK USEANIMALIDENTIFICATION');
    return {
        /** State */
        isInitialized: model.isInitialized,
        model,
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
