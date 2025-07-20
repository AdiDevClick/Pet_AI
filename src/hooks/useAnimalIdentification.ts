import { useState, useEffect, useCallback } from 'react';

// Hook personnalisé pour l'identification d'animaux
export function useAnimalIdentification() {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isTraining, setIsTraining] = useState(false);
    const [isComparing, setIsComparing] = useState(false);
    const [stats, setStats] = useState({
        trainingPairs: 0,
        comparisons: 0,
        accuracy: 0,
    });
    const [lastResult, setLastResult] = useState(null);

    // Initialiser le système d'identification
    const initialize = useCallback(async () => {
        try {
            if (!window.animalIdentifier) {
                console.error('AnimalIdentificationTF not loaded');
                return false;
            }

            const success = await window.animalIdentifier.initializeModels();
            setIsInitialized(success);

            if (success) {
                updateStats();
            }

            return success;
        } catch (error) {
            console.error(
                "Erreur d'initialisation de l'identification:",
                error
            );
            return false;
        }
    }, []);

    // Mettre à jour les statistiques
    const updateStats = useCallback(() => {
        if (window.animalIdentifier) {
            setStats({
                trainingPairs: window.animalIdentifier.trainingPairs.length,
                comparisons: window.animalIdentifier.comparisonCount,
                accuracy:
                    parseFloat(window.animalIdentifier.finalAccuracy) || 0,
            });
        }
    }, []);

    // Ajouter une paire d'entraînement
    const addTrainingPair = useCallback(
        async (image1Element, image2Element, isSameAnimal) => {
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
                await initialize();
            } else {
                console.error(
                    "Impossible de charger le script d'identification"
                );
            }
        };

        initializeSystem();
    }, [initialize]);

    return {
        // État
        isInitialized,
        isTraining,
        isComparing,
        stats,
        lastResult,

        // Actions
        initialize,
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
