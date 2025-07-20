import React, { useState, useRef } from 'react';
import useAnimalIdentification from '../hooks/useAnimalIdentification';

const AnimalIdentification: React.FC = () => {
    const {
        isInitialized,
        isTraining,
        isComparing,
        stats,
        lastResult,
        addTrainingPair,
        trainModel,
        compareAnimals,
        resetModel,
        saveModel,
        loadModel,
    } = useAnimalIdentification();

    // Refs pour les éléments d'image
    const trainImg1Ref = useRef<HTMLImageElement>(null);
    const trainImg2Ref = useRef<HTMLImageElement>(null);
    const compareImg1Ref = useRef<HTMLImageElement>(null);
    const compareImg2Ref = useRef<HTMLImageElement>(null);

    // États pour les aperçus d'images
    const [trainImg1Preview, setTrainImg1Preview] = useState<string>('');
    const [trainImg2Preview, setTrainImg2Preview] = useState<string>('');
    const [compareImg1Preview, setCompareImg1Preview] = useState<string>('');
    const [compareImg2Preview, setCompareImg2Preview] = useState<string>('');

    // Gestionnaire de changement de fichier
    const handleFileChange = (
        event: React.ChangeEvent<HTMLInputElement>,
        setPreview: React.Dispatch<React.SetStateAction<string>>,
        imageRef: React.RefObject<HTMLImageElement>
    ) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setPreview(result);

                // Mettre à jour l'élément image
                if (imageRef.current) {
                    imageRef.current.src = result;
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddTrainingPair = async (isSameAnimal: boolean) => {
        if (!trainImg1Ref.current || !trainImg2Ref.current) {
            alert("Veuillez sélectionner les deux images d'entraînement");
            return;
        }

        const success = await addTrainingPair(
            trainImg1Ref.current,
            trainImg2Ref.current,
            isSameAnimal
        );

        if (success) {
            // Réinitialiser les aperçus
            setTrainImg1Preview('');
            setTrainImg2Preview('');
        }
    };

    const handleCompareImages = async () => {
        if (!compareImg1Ref.current || !compareImg2Ref.current) {
            alert('Veuillez sélectionner les deux images à comparer');
            return;
        }

        await compareAnimals(compareImg1Ref.current, compareImg2Ref.current);
    };

    if (!isInitialized) {
        return (
            <div className="animal-identification-container">
                <div className="loading-state">
                    <h3>🐾 Chargement du système d'identification...</h3>
                    <p>Initialisation des modèles en cours...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animal-identification-container">
            <h2>🐾 Identification d'Animaux</h2>

            {/* Section Entraînement */}
            <div className="training-section">
                <h3>🏋️ Entraînement du Modèle</h3>
                <p>Ajoutez des paires d'images pour entraîner le modèle.</p>

                <div className="image-pair-container">
                    <div className="image-upload">
                        <label htmlFor="train-img1">Image 1:</label>
                        <input
                            id="train-img1"
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                handleFileChange(
                                    e,
                                    setTrainImg1Preview,
                                    trainImg1Ref
                                )
                            }
                        />
                        <div className="image-preview">
                            {trainImg1Preview ? (
                                <img
                                    ref={trainImg1Ref}
                                    src={trainImg1Preview}
                                    alt="Image d'entraînement 1"
                                />
                            ) : (
                                <span>Sélectionnez une image</span>
                            )}
                        </div>
                    </div>

                    <div className="image-upload">
                        <label htmlFor="train-img2">Image 2:</label>
                        <input
                            id="train-img2"
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                handleFileChange(
                                    e,
                                    setTrainImg2Preview,
                                    trainImg2Ref
                                )
                            }
                        />
                        <div className="image-preview">
                            {trainImg2Preview ? (
                                <img
                                    ref={trainImg2Ref}
                                    src={trainImg2Preview}
                                    alt="Image d'entraînement 2"
                                />
                            ) : (
                                <span>Sélectionnez une image</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="training-buttons">
                    <button
                        className="same-animal-btn"
                        onClick={() => handleAddTrainingPair(true)}
                        disabled={isTraining}
                    >
                        ✅ Même Animal
                    </button>
                    <button
                        className="different-animal-btn"
                        onClick={() => handleAddTrainingPair(false)}
                        disabled={isTraining}
                    >
                        ❌ Animaux Différents
                    </button>
                    <button
                        className="train-btn"
                        onClick={trainModel}
                        disabled={isTraining}
                    >
                        {isTraining ? '🏋️ Entraînement...' : '🏋️ Entraîner'}
                    </button>
                </div>
            </div>

            {/* Section Comparaison */}
            <div className="comparison-section">
                <h3>🔍 Comparaison d'Images</h3>
                <p>
                    Comparez deux images pour voir si elles montrent le même
                    animal.
                </p>

                <div className="image-pair-container">
                    <div className="image-upload">
                        <label htmlFor="compare-img1">
                            Image à comparer 1:
                        </label>
                        <input
                            id="compare-img1"
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                handleFileChange(
                                    e,
                                    setCompareImg1Preview,
                                    compareImg1Ref
                                )
                            }
                        />
                        <div className="image-preview">
                            {compareImg1Preview ? (
                                <img
                                    ref={compareImg1Ref}
                                    src={compareImg1Preview}
                                    alt="Image de comparaison 1"
                                />
                            ) : (
                                <span>Sélectionnez une image</span>
                            )}
                        </div>
                    </div>

                    <div className="image-upload">
                        <label htmlFor="compare-img2">
                            Image à comparer 2:
                        </label>
                        <input
                            id="compare-img2"
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                handleFileChange(
                                    e,
                                    setCompareImg2Preview,
                                    compareImg2Ref
                                )
                            }
                        />
                        <div className="image-preview">
                            {compareImg2Preview ? (
                                <img
                                    ref={compareImg2Ref}
                                    src={compareImg2Preview}
                                    alt="Image de comparaison 2"
                                />
                            ) : (
                                <span>Sélectionnez une image</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="comparison-buttons">
                    <button
                        className="compare-btn"
                        onClick={handleCompareImages}
                        disabled={isComparing}
                    >
                        {isComparing ? '🔍 Comparaison...' : '🔮 Comparer'}
                    </button>
                </div>
            </div>

            {/* Résultats */}
            {lastResult && (
                <div className="results-section">
                    <h3>📊 Résultat de la Comparaison</h3>
                    <div
                        className={`result-card ${
                            lastResult.sameAnimal ? 'same' : 'different'
                        }`}
                    >
                        <div className="result-verdict">
                            <strong>
                                {lastResult.sameAnimal
                                    ? '✅ Même animal'
                                    : '❌ Animaux différents'}
                            </strong>
                        </div>
                        <div className="result-details">
                            <p>
                                Score de similarité:{' '}
                                {(lastResult.similarity * 100).toFixed(1)}%
                            </p>
                            <p>
                                Confiance:{' '}
                                {(lastResult.confidence * 100).toFixed(1)}%
                            </p>
                            <p>
                                Seuil utilisé:{' '}
                                {(lastResult.details.threshold * 100).toFixed(
                                    0
                                )}
                                %
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Statistiques */}
            <div className="stats-section">
                <h3>📈 Statistiques</h3>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{stats.trainingPairs}</div>
                        <div className="stat-label">Paires d'entraînement</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.comparisons}</div>
                        <div className="stat-label">
                            Comparaisons effectuées
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">
                            {stats.accuracy.toFixed(1)}%
                        </div>
                        <div className="stat-label">Précision du modèle</div>
                    </div>
                </div>
            </div>

            {/* Actions du modèle */}
            <div className="model-actions">
                <button onClick={resetModel}>🔄 Réinitialiser</button>
                <button onClick={() => saveModel()}>💾 Sauvegarder</button>
                <button onClick={() => loadModel()}>📂 Charger</button>
            </div>
        </div>
    );
};

export default AnimalIdentification;
