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
    PairArrayForSaving,
    StatusTypes,
    TrainingPair,
} from '@/hooks/models/useAnimalIdentificationTypes.ts';
import { updateState, wait } from '@/lib/utils.ts';
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
        epochs: 10,
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
     * Update the status state with new values.
     * @description This function merges the new status
     */
    // const updateStatus = useCallback((newStatus: Partial<StatusTypes>) => {
    //     setStatus((prev) => {
    //         return Object.entries(newStatus).reduce(
    //             (acc, [key, value]) => {
    //                 const k = key as keyof StatusTypes;
    //                 // The preview key is not an array
    //                 // we simply assign the new value
    //                 if (!Array.isArray(prev[k])) {
    //                     return {
    //                         ...acc,
    //                         [k]: value,
    //                     };
    //                 }
    //                 // If the previous value is an array
    //                 // We spread it
    //                 if (Array.isArray(value)) {
    //                     return {
    //                         ...acc,
    //                         [k]: [...prev[k], ...value],
    //                     };
    //                 }
    //                 // If the new value is not an array
    //                 // We simply push it to the array
    //                 return {
    //                     ...acc,
    //                     [k]: [...prev[k], value],
    //                 };
    //             },
    //             { ...prev }
    //         );
    //     });
    // }, []);

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
                    updateState(
                        {
                            ...results,
                        },
                        setStatus
                    );
                    return;
                }

                setModel((prev) => ({
                    ...prev,
                    ...results,
                }));
                updateState(
                    {
                        siameseModelInitialized: true,
                        featureExtractorInitialized: true,
                        loadingState: {
                            message: 'Modèle initialisé',
                            isLoading: 'done',
                            type: 'initializing',
                        },
                    },
                    setStatus
                );
            }
        }
    }, [model.isInitialized]);

    /**
     * This will start training the model.
     * It checks if the model is initialized and if the training state is not already training
     */
    const startModelTraining = useCallback(async () => {
        if (!model.isInitialized) {
            updateState(
                {
                    error: {
                        status: 'error',
                        message: "Le modèle n'est pas initialisé",
                    },
                },
                setStatus
            );
            return;
        }

        if (statusRef.current.loadingState.isLoading !== 'training') {
            updateState(
                {
                    loadingState: {
                        message: "Début de l'entraînement...",
                        isLoading: 'training',
                        type: 'training',
                    },
                },
                setStatus
            );
        }

        const result = await trainModel({
            status: statusRef.current,
            model,
            config: configRef.current,
            initializeModel,
            onEpochEnd: (epoch, logs) => {
                console.log(
                    `Epoch ${epoch + 1}: loss=${logs.loss?.toFixed(
                        4
                    )}, accuracy=${logs.acc?.toFixed(4)}`
                );
                updateState(
                    {
                        trainEpochCount: epoch + 1,
                        loss: logs.loss,
                        accuracy:
                            typeof logs.acc === 'number'
                                ? (logs.acc * 100).toFixed(1)
                                : 'N/A',
                    },
                    setStatus
                );
            },
        });

        if (result) {
            updateState(
                {
                    ...result,
                },
                setStatus
            );
            return;
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
            if (statusRef.current.loadingState.isLoading !== 'training') {
                updateState(
                    {
                        loadingState: {
                            message: 'Comparaison des images...',
                            isLoading: 'comparison',
                            type: 'comparison',
                        },
                    },
                    setStatus
                );
            }
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
                updateState(
                    {
                        ...results,
                    },
                    setStatus
                );
                return results;
            }

            updateState(
                {
                    comparisonsCount: statusRef.current.comparisonsCount + 1,
                    ...results,
                    loadingState: {
                        message: `Comparaison ${
                            statusRef.current.comparisonsCount + 1
                        } terminée`,
                        isLoading: 'done',
                        type: 'comparison',
                    },
                },
                setStatus
            );
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
            updateState(
                {
                    trainingPairs: [],
                    comparisonCount: 0,
                },
                setStatus
            );

            initializeModel();
        } catch (error) {
            updateState(
                {
                    error: {
                        status: 'error',
                        message: `Erreur lors de la réinitialisation: ${error.message}`,
                    },
                },
                setStatus
            );
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
                    setStatus,
                    model,
                    config: configRef.current,
                });
            } catch (error) {
                updateState(
                    {
                        error: {
                            status: 'error',
                            message: `Erreur lors de la sauvegarde: ${error.message}`,
                        },
                    },
                    setStatus
                );
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
            updateState(
                {
                    loadingState: {
                        message: "Ajout de la paire d'entraînement...",
                        isLoading: 'adding',
                        type: 'adding',
                    },
                },
                setStatus
            );
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
                    updateState(
                        {
                            ...pair,
                        },
                        setStatus
                    );
                    return;
                }
                updateState(
                    {
                        trainingPairs: pair.trainingPair as TrainingPair[],
                        pairsArrayForSaving:
                            pair.pairArrayForSaving as PairArrayForSaving[],
                        loadingState: {
                            message: "Paire d'entraînement ajoutée avec succès",
                            isLoading: 'done',
                            type: 'adding',
                        },
                    },
                    setStatus
                );
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
                updateState(
                    {
                        ...results,
                        localStorageDataLoaded: true,
                    },
                    setStatus
                );
                return;
            }
            updateState(
                {
                    ...results,
                    loadingState: {
                        message: 'Données image chargées',
                        isLoading: 'done',
                        type: 'storage',
                    },
                    localStorageDataLoaded: true,
                },
                setStatus
            );
        }
    }, [
        model.isInitialized,
        statusRef.current.localStorageDataLoaded,
        statusRef.current.loadingState.isLoading,
        statusRef.current.loadingState.type,
        statusRef.current.loadingState.message,
    ]);

    /**
     * Error Toaster Handler
     *
     * @description This will show an error message
     * if there is an error in the statusRef.current.
     */
    useEffect(() => {
        if (status.error.message) {
            const currentType = status.loadingState.type;
            const message = status.error.message;
            const toastId = `loading-${currentType}`;
            console.log(`error loading-${currentType}`);

            if (status.error.status.toString() === '409') {
                toast.warning(message, {
                    position: 'top-right',
                });

                updateState(
                    {
                        error: { status: '', message: '' },
                    },
                    setStatus
                );
                return;
            }
            toast.dismiss(toastId);

            // toast.getHistory().forEach((t) => {
            //     if (t.type === 'loading') toast.dismiss(t.id);
            // });
            toast.error(message, {
                position: 'top-right',
            });
            updateState(
                {
                    error: { status: '', message: '' },
                    loadingState: { message: '', isLoading: '', type: '' },
                },
                setStatus
            );
        }
    }, [status.error.message, status.loadingState.type]);

    /**
     * Update the status reference whenever the status changes.
     * Used to avoid unnecessary re-renders due
     * to closures in callbacks.
     */
    useEffect(() => {
        statusRef.current = status;
    }, [status]);
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
        updateState(
            {
                loadingState: {
                    message: 'Chargement des données images...',
                    isLoading: 'storage',
                    type: 'storage',
                },
            },
            setStatus
        );
        loadFromStorageData();
    }, [
        model.isInitialized,
        status.localStorageDataLoaded,
        status.loadingState.isLoading,
    ]);

    /**
     * Toaster Handler
     * @description Triggers a toaster notification when
     * the loadingstate changes.
     */
    useEffect(() => {
        // if (status.error.message || !status.loadingState.message) {
        //     return;
        // }
        if (status.loadingState.isLoading) {
            const type = status.loadingState.type;
            const toastId = `loading-${type}`;
            const message = status.loadingState.message;

            // Show success message when loading is done
            if (status.loadingState.isLoading === 'done') {
                toast.dismiss(toastId);
                toast.success(message, {
                    position: 'top-right',
                });
                updateState(
                    {
                        loadingState: {
                            message: '',
                            isLoading: '',
                            type: '',
                        },
                    },
                    setStatus
                );
            }
            if (status.loadingState.isLoading !== 'done') {
                console.log('object : ', type);
                // toast.dismiss();
                // toast.dismiss(`loading-${status.loadingState.type}`);
                toast.loading(message, {
                    position: 'top-right',
                    id: `loading-${type}`,
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
        updateState(
            {
                balance: results,
            },
            setStatus
        );
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
