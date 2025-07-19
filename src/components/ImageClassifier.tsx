import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import './ImageClassifier.css';

interface ImageData {
    id: string;
    url: string;
    isCorrect?: boolean;
    userLabel?: boolean;
}

interface TrainingData {
    image: HTMLImageElement;
    label: number;
}

const ImageClassifier: React.FC = () => {
    const [images, setImages] = useState<ImageData[]>([]);
    const [model, setModel] = useState<tf.LayersModel>(null!);
    const [isTraining, setIsTraining] = useState(false);
    const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
    const [currentTask] = useState(
        'Sélectionnez toutes les images qui contiennent des chats'
    );
    const [accuracy, setAccuracy] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Initialiser le modèle TensorFlow.js
    useEffect(() => {
        initializeModel();
        loadSampleImages();
    }, []);

    const initializeModel = async () => {
        try {
            // Créer un modèle CNN pour la classification d'images
            const model = tf.sequential({
                layers: [
                    tf.layers.conv2d({
                        inputShape: [224, 224, 3],
                        filters: 32,
                        kernelSize: 3,
                        activation: 'relu',
                    }),
                    tf.layers.maxPooling2d({ poolSize: 2 }),
                    tf.layers.conv2d({
                        filters: 64,
                        kernelSize: 3,
                        activation: 'relu',
                    }),
                    tf.layers.maxPooling2d({ poolSize: 2 }),
                    tf.layers.conv2d({
                        filters: 64,
                        kernelSize: 3,
                        activation: 'relu',
                    }),
                    tf.layers.flatten(),
                    tf.layers.dense({ units: 64, activation: 'relu' }),
                    tf.layers.dropout({ rate: 0.5 }),
                    tf.layers.dense({ units: 2, activation: 'softmax' }), // 2 classes: correct/incorrect
                ],
            });

            model.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'sparseCategoricalCrossentropy',
                metrics: ['accuracy'],
            });

            setModel(model);
            console.log('Modèle initialisé avec succès');
        } catch (error) {
            console.error("Erreur lors de l'initialisation du modèle:", error);
        }
    };

    const loadSampleImages = () => {
        // Images d'exemple (vous pouvez remplacer par vos propres images)
        const sampleImages: ImageData[] = [
            {
                id: '1',
                url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=300&fit=crop',
                isCorrect: true,
            },
            {
                id: '2',
                url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=300&h=300&fit=crop',
                isCorrect: false,
            },
            {
                id: '3',
                url: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=300&h=300&fit=crop',
                isCorrect: true,
            },
            {
                id: '4',
                url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=300&fit=crop',
                isCorrect: false,
            },
            {
                id: '5',
                url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300&h=300&fit=crop',
                isCorrect: true,
            },
            {
                id: '6',
                url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&h=300&fit=crop',
                isCorrect: false,
            },
            {
                id: '7',
                url: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=300&h=300&fit=crop',
                isCorrect: true,
            },
            {
                id: '8',
                url: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=300&h=300&fit=crop',
                isCorrect: false,
            },
        ];

        setImages(sampleImages);
    };

    const preprocessImage = async (
        imageElement: HTMLImageElement
    ): Promise<tf.Tensor4D> => {
        return tf.tidy(() => {
            // Créer un tensor à partir de l'image
            const tensor = tf.browser
                .fromPixels(imageElement)
                .resizeNearestNeighbor([224, 224])
                .toFloat()
                .div(255.0)
                .expandDims(0);

            return tensor as tf.Tensor4D;
        });
    };

    const handleImageClick = async (imageId: string, userThinks: boolean) => {
        const imageData = images.find((img) => img.id === imageId);
        if (!imageData) return;

        // Mettre à jour l'état de l'image avec le choix de l'utilisateur
        setImages((prev) =>
            prev.map((img) =>
                img.id === imageId ? { ...img, userLabel: userThinks } : img
            )
        );

        // Ajouter aux données d'entraînement
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async () => {
            const newTrainingData: TrainingData = {
                image: img,
                label: userThinks ? 1 : 0,
            };

            setTrainingData((prev) => [...prev, newTrainingData]);

            // Entraîner le modèle si nous avons suffisamment de données
            if (trainingData.length >= 4) {
                await trainModel();
            }
        };
        img.src = imageData.url;
    };

    const trainModel = async () => {
        if (!model || trainingData.length === 0) return;

        setIsTraining(true);

        try {
            // Préparer les données d'entraînement
            const imageTensors: tf.Tensor4D[] = [];
            const labels: number[] = [];

            for (const data of trainingData) {
                const preprocessed = await preprocessImage(data.image);
                imageTensors.push(preprocessed);
                labels.push(data.label);
            }

            const xs = tf.concat(imageTensors);
            const ys = tf.tensor1d(labels, 'int32');

            // Entraîner le modèle
            await model.fit(xs, ys, {
                epochs: 5,
                batchSize: 2,
                validationSplit: 0.2,
                shuffle: true,
                callbacks: {
                    onEpochEnd: (epoch: number, logs: tf.Logs | undefined) => {
                        if (logs && logs.acc) {
                            console.log(
                                `Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(
                                    4
                                )}, accuracy = ${logs.acc.toFixed(4)}`
                            );
                            setAccuracy(logs.acc as number);
                        }
                    },
                },
            });

            // Nettoyer les tensors
            xs.dispose();
            ys.dispose();
            imageTensors.forEach((tensor) => tensor.dispose());

            console.log('Entraînement terminé');
        } catch (error) {
            console.error("Erreur lors de l'entraînement:", error);
        } finally {
            setIsTraining(false);
        }
    };

    const resetTraining = () => {
        setTrainingData([]);
        setImages((prev) =>
            prev.map((img) => ({ ...img, userLabel: undefined }))
        );
        setAccuracy(0);
        initializeModel(); // Réinitialiser le modèle
    };

    const loadNewImages = () => {
        loadSampleImages();
        setImages((prev) =>
            prev.map((img) => ({ ...img, userLabel: undefined }))
        );
    };

    return (
        <div className="image-classifier">
            <div className="header">
                <h2>Classificateur d'Images IA</h2>
                <p className="task">{currentTask}</p>
                <div className="stats">
                    <span>Précision: {(accuracy * 100).toFixed(1)}%</span>
                    <span>Données d'entraînement: {trainingData.length}</span>
                    {isTraining && (
                        <span className="training">🔄 Entraînement...</span>
                    )}
                </div>
            </div>

            <div className="controls">
                <button onClick={resetTraining} className="btn-reset">
                    Réinitialiser l'entraînement
                </button>
                <button onClick={loadNewImages} className="btn-new">
                    Nouvelles images
                </button>
            </div>

            <div className="images-grid">
                {images.map((image) => (
                    <div
                        key={image.id}
                        className={`image-card ${
                            image.userLabel === true
                                ? 'selected-correct'
                                : image.userLabel === false
                                ? 'selected-incorrect'
                                : ''
                        }`}
                    >
                        <img
                            src={image.url}
                            alt={`Image ${image.id}`}
                            crossOrigin="anonymous"
                        />
                        <div className="image-actions">
                            <button
                                onClick={() => handleImageClick(image.id, true)}
                                className="btn-correct"
                                disabled={isTraining}
                            >
                                ✓ Correct
                            </button>
                            <button
                                onClick={() =>
                                    handleImageClick(image.id, false)
                                }
                                className="btn-incorrect"
                                disabled={isTraining}
                            >
                                ✗ Incorrect
                            </button>
                        </div>
                        {image.userLabel !== undefined && (
                            <div className="feedback">
                                {image.isCorrect === image.userLabel
                                    ? '✅'
                                    : '❌'}
                                {image.isCorrect !== undefined &&
                                    ` (Réalité: ${
                                        image.isCorrect
                                            ? 'Correct'
                                            : 'Incorrect'
                                    })`}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="instructions">
                <h3>Instructions:</h3>
                <ul>
                    <li>
                        Cliquez sur "Correct" ou "Incorrect" pour chaque image
                        selon la tâche demandée
                    </li>
                    <li>
                        Le modèle s'entraîne automatiquement avec vos réponses
                    </li>
                    <li>
                        Plus vous donnez d'exemples, plus le modèle devient
                        précis
                    </li>
                    <li>
                        La précision s'affiche en temps réel pendant
                        l'entraînement
                    </li>
                </ul>
            </div>

            <canvas
                ref={canvasRef}
                className="hidden-canvas"
                width="224"
                height="224"
            />
        </div>
    );
};

export default ImageClassifier;
