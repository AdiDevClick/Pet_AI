import { useState, useEffect, useCallback } from 'react';

// Hook personnalisé pour l'identification d'animaux
export function useAnimalIdentification() {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isTraining, setIsTraining] = useState(false);
    const [isComparing, setIsComparing] = useState(false);
    const [status, setStatus] = useState({
        trainingPairs: 0,
        comparisons: 0,
        accuracy: 0,
    });
    const [lastResult, setLastResult] = useState(null);

    /**
     * Initialize the animal identification model.
     */
    const initializeModel = useCallback(async () => {
        if (!window.animalIdentifier) {
            try {
                // throw new Error('AnimalIdentificationTF not loaded', {
                //     cause: { status: 404, message: 'Script not found' },
                // });

                const success =
                    await window.animalIdentifier.initializeModels();

                if (!success) {
                    throw new Error(
                        `❌ Échec de l'initialisation: ${success}`,
                        {
                            cause: {
                                status: 500,
                                message: 'Initialization failed',
                            },
                        }
                    );
                }
                setIsInitialized(success);
                updateStats();
                return;
            } catch (error) {
                setStatus((prev) => ({ ...prev, error: error.message }));
            }
        }
        setIsInitialized(true);
    }, []);

    // Mettre à jour les statistiques
    const updateStats = useCallback(() => {
        if (isInitialized) {
            setStatus({
                trainingPairs: window.animalIdentifier.trainingPairs.length,
                comparisons: window.animalIdentifier.comparisonCount,
                accuracy:
                    parseFloat(window.animalIdentifier.finalAccuracy) || 0,
            });
        }
    }, [isInitialized]);

    // Ajouter une paire d'entraînement
    const addTrainingPair = useCallback(
        async (imgPairArray, isSameAnimal) => {
            if (!isInitialized || !window.animalIdentifier) {
                console.error("Système d'identification non initialisé");
                return false;
            }

            try {
                setIsTraining(true);
                await window.animalIdentifier.addTrainingPair(
                    image1Element,
                    image2Element,
                    isSameAnimal
                );
                updateStats();
                return true;
            } catch (error) {
                console.error(
                    "Erreur lors de l'ajout de la paire d'entraînement:",
                    error
                );
                return false;
            } finally {
                setIsTraining(false);
            }
        },
        [isInitialized, updateStats]
    );

    // Entraîner le modèle manuellement
    const trainModel = useCallback(async () => {
        if (!isInitialized || !window.animalIdentifier) {
            console.error("Système d'identification non initialisé");
            return false;
        }

        try {
            setIsTraining(true);
            await window.animalIdentifier.trainModel();
            updateStats();
            return true;
        } catch (error) {
            console.error("Erreur lors de l'entraînement:", error);
            return false;
        } finally {
            setIsTraining(false);
        }
    }, [isInitialized, updateStats]);

    // Comparer deux images
    const compareAnimals = useCallback(
        async (image1Element, image2Element) => {
            if (!isInitialized || !window.animalIdentifier) {
                console.error("Système d'identification non initialisé");
                return null;
            }

            try {
                setIsComparing(true);
                const result = await window.animalIdentifier.compareAnimals(
                    image1Element,
                    image2Element
                );

                if (result) {
                    setLastResult(result);
                    updateStats();
                }

                return result;
            } catch (error) {
                console.error('Erreur lors de la comparaison:', error);
                return null;
            } finally {
                setIsComparing(false);
            }
        },
        [isInitialized, updateStats]
    );

    // Trouver des correspondances
    const findMatches = useCallback(
        async (targetImage, candidateImages, threshold = 0.7) => {
            if (!isInitialized || !window.animalIdentifier) {
                console.error("Système d'identification non initialisé");
                return [];
            }

            try {
                setIsComparing(true);
                const matches = await window.animalIdentifier.findMatches(
                    targetImage,
                    candidateImages,
                    threshold
                );
                updateStats();
                return matches;
            } catch (error) {
                console.error(
                    'Erreur lors de la recherche de correspondances:',
                    error
                );
                return [];
            } finally {
                setIsComparing(false);
            }
        },
        [isInitialized, updateStats]
    );

    // Réinitialiser le modèle
    const resetModel = useCallback(async () => {
        if (!window.animalIdentifier) return false;

        try {
            await window.animalIdentifier.reset();
            setLastResult(null);
            updateStats();
            return true;
        } catch (error) {
            console.error('Erreur lors de la réinitialisation:', error);
            return false;
        }
    }, [updateStats]);

    // Sauvegarder le modèle
    const saveModel = useCallback(
        async (name = null) => {
            if (!isInitialized || !window.animalIdentifier) return false;

            try {
                await window.animalIdentifier.saveModel(name);
                return true;
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                return false;
            }
        },
        [isInitialized]
    );

    // Charger un modèle
    const loadModel = useCallback(
        async (name = null) => {
            if (!window.animalIdentifier) return false;

            try {
                const success = await window.animalIdentifier.loadModel(name);
                if (success) {
                    setIsInitialized(true);
                    updateStats();
                }
                return success;
            } catch (error) {
                console.error('Erreur lors du chargement:', error);
                return false;
            }
        },
        [updateStats]
    );

    // Initialiser automatiquement au montage du composant
    useEffect(() => {
        const initializeSystem = async () => {
            // Attendre que le script soit chargé
            let attempts = 0;
            const maxAttempts = 50;

            const waitForScript = () => {
                return new Promise((resolve) => {
                    const checkScript = () => {
                        if (
                            window.animalIdentifier ||
                            attempts >= maxAttempts
                        ) {
                            resolve(true);
                        } else {
                            attempts++;
                            setTimeout(checkScript, 100);
                        }
                    };
                    checkScript();
                });
            };

            await waitForScript();

            if (window.animalIdentifier) {
                await initializeModel();
            } else {
                console.error(
                    "Impossible de charger le script d'identification"
                );
            }
        };

        initializeSystem();
    }, [initializeModel]);

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
        trainModel,
        compareAnimals,
        findMatches,
        resetModel,
        saveModel,
        loadModel,
        updateStats,
    };
}

export default useAnimalIdentification;
