import * as tf from '@tensorflow/tfjs';
import type {
    AddTrainingPairToModelProps,
    AddTrainingPairToModelResults,
    CompareImagesProps,
    CompareImagesResults,
    CreateFeatureExtractorProps,
    CreateFeatureExtractorResult,
    CreateSiameseModelProps,
    CreateSiameseModelResults,
    GetDataBalanceProps,
    GetDataBalanceResults,
    InitializeProps,
    InitializeResults,
    LoadImageElementProps,
    LoadStorageDataProps,
    LoadStorageDataResults,
    PairsArrayForSaving,
    PreprocessImageProps,
    PreprocessImageResults,
    TrainingPair,
    TrainModelProps,
} from '@/hooks/models/useAnimalIdentificationTypes.ts';
import type { CustomError } from '@/mainTypes.ts';

/**
 * Get the data balance of the training pairs.
 *
 * @param trainingPairs - The parameters for getting the data balance.
 * @returns An object containing the count of positive, negative, and total pairs.
 * @example
 * > **Successful result:**
 * > ```json
 * > {
 * >    positive: 12,
 * >    negative: 5,
 * >    total: 17
 * > }
 * ```
 */
export function getDataBalance({
    trainingPairs,
}: GetDataBalanceProps): GetDataBalanceResults {
    let positive = 0;
    let negative = 0;
    let total = 0;

    if (trainingPairs && trainingPairs.length > 0) {
        positive = trainingPairs.filter((pair) => pair.label === 1).length;
        negative = trainingPairs.filter((pair) => pair.label === 0).length;
        total = trainingPairs.length;
    }

    return {
        positive,
        negative,
        total,
    };
}

/**
 * Load training pairs from local storage.
 *
 * @description This function loads training pairs from local storage,
 *
 * @param isInitialized - A boolean indicating if the model is initialized.
 * @param config - The configuration object for the model.
 * @param trainingPairs - An array of training pairs to be loaded.
 * @returns A promise that resolves to the result of adding training pairs to the model.
 * @throwsError - If no training pairs are found in local storage or if
 * an error occurs while trying to reconstruct the tensors.
 *
 * @example
 * // Awaited result example:
 * {
 *   pairsArrayForSaving: [
 *     {
 *       image1Url: "url1",
 *       image2Url: "url2",
 *       isSameAnimal: true
 *     }
 *   ],
 *   trainingPairs: [
 *     {
 *       image1: tensor1,
 *       image2: tensor2,
 *       label: 1
 *     }
 *   ]
 * }
 *
 * // Error case example:
 * {
 *   error: {
 *     message: "Message d'erreur",
 *     status: 500
 *   }
 * }
 */
export async function loadStorageData({
    isInitialized,
    config,
    trainingPairs = [],
}: LoadStorageDataProps): Promise<LoadStorageDataResults> {
    const tensorPairs: TrainingPair[] = [];
    const savingPairs: PairsArrayForSaving[] = [];
    try {
        if (!trainingPairs) {
            throw new Error(
                "Aucune paire d'entraînement trouvée dans le stockage local",
                {
                    cause: {
                        status: 404,
                        message: 'No training pairs found',
                    },
                }
            );
        }

        await Promise.all(
            trainingPairs.map(async (element) => {
                const { image1Url, image2Url, isSameAnimal } = element;
                const img1 = await loadImageElement({ imageUrl: image1Url });
                const img2 = await loadImageElement({ imageUrl: image2Url });

                const pairs = addTrainingPairToModel({
                    imgArray: [img1, img2],
                    isSameAnimal,
                    config,
                    isInitialized,
                });

                if ('error' in pairs) {
                    return Promise.reject(
                        new Error("Erreur d'ajout de tensor paires", {
                            cause: {
                                status: pairs.error.status || 500,
                                message:
                                    pairs.error.message ||
                                    'Error loading pairs',
                            },
                        })
                    );
                }
                tensorPairs.push(pairs.trainingPairs);
                savingPairs.push(pairs.pairsArrayForSaving);
            })
        );

        return {
            pairsArrayForSaving: savingPairs,
            trainingPairs: tensorPairs,
        };
    } catch (error) {
        return {
            error: {
                message:
                    (error as CustomError).cause?.message ||
                    (error as Error).message,
                status: (error as CustomError).cause?.status || 500,
            },
        };
    }
}

/**
 * Load an image element from a URL.
 *
 * @description This function creates a new Image object,
 * sets its source to the provided URL,
 *
 * @param imageUrl - The URL of the image to load.
 * @returns A promise that resolves to the loaded image element.
 */
export function loadImageElement({
    imageUrl,
}: LoadImageElementProps): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;

        img.onload = () => resolve(img);
        img.onerror = () =>
            reject(new Error(`Failed to load image: ${imageUrl}`));
    });
}

/**
 * Add a training pair to the model.
 *
 * @description This function preprocesses two images, checks if the model is initialized,
 * and adds the training pair to the model.
 *
 * @param imgArray - An array containing two image elements to be preprocessed.
 * @param isSameAnimal - A boolean indicating if the two images are of the same animal.
 * @param config - The configuration object for preprocessing.
 * @param isInitialized - A boolean indicating if the model is initialized.
 *
 * @returns An object containing the preprocessed images and their label,
 * or an error object if the model is not initialized or if an error occurs.
 *
 * @throws {Error} If the model is not initialized or if image preprocessing fails.
 */
export function addTrainingPairToModel({
    imgArray,
    isSameAnimal,
    config,
    isInitialized,
}: AddTrainingPairToModelProps): AddTrainingPairToModelResults {
    try {
        checkIfInitialized(isInitialized);

        const img1 = preprocessImage({ imageElement: imgArray[0], config });
        const img2 = preprocessImage({ imageElement: imgArray[1], config });
        const label = isSameAnimal ? 1 : 0;
        return {
            pairsArrayForSaving: {
                image1Url: imgArray[0].src,
                image2Url: imgArray[1].src,
                isSameAnimal,
            },

            trainingPairs: { image1: img1, image2: img2, label: label },
        };
    } catch (error) {
        return {
            error: {
                status: (error as CustomError).cause?.status || '500',
                message:
                    (error as CustomError).cause?.message ||
                    (error as Error).message,
            },
        };
    }
}

/**
 * Preprocess an image for model input.
 * @description This function resizes, normalizes, and applies augmentations to the image.
 * It returns a tensor ready for model input.
 *
 * @param imageElement - The image element to preprocess.
 * @param config - The configuration for preprocessing.
 * @param config.augment - If `true`, apply data augmentation.
 * @returns The preprocessed image tensor and its dimensions.
 * @throws {Error} If the image preprocessing fails.
 */
export function preprocessImage({
    imageElement,
    config,
}: PreprocessImageProps): PreprocessImageResults {
    const { imageSize, augment } = config;
    return tf.tidy(() => {
        try {
            let tensor3d: tf.Tensor3D | tf.Tensor4D =
                tf.browser.fromPixels(imageElement);

            tensor3d = tf.image.resizeBilinear(tensor3d, [
                imageSize,
                imageSize,
            ]);

            tensor3d = tensor3d.toFloat();

            // Augmentation simple si demandée
            if (augment) {
                if (tensor3d.rank === 3) {
                    tensor3d = tensor3d.expandDims(0);
                }
                // Flip horizontal (déjà présent)
                if (Math.random() < 0.5) {
                    tensor3d = tf.image.flipLeftRight(tensor3d as tf.Tensor4D);
                }
                // Flip vertical (rare mais possible)
                if (Math.random() < 0.1) {
                    tensor3d = tensor3d.reverse(1);
                }
                // Rotation légère (±15°)
                if (Math.random() < 0.2) {
                    const angle = (Math.random() - 0.5) * (Math.PI / 6); // -15° à +15°
                    tensor3d = tf.image.rotateWithOffset(
                        tensor3d as tf.Tensor4D,
                        angle,
                        0
                    );
                }
                // Décalage (translation) légère
                if (Math.random() < 0.2) {
                    const dx = Math.floor((Math.random() - 0.5) * 10); // -5 à +5 px
                    const dy = Math.floor((Math.random() - 0.5) * 10);
                    const transformMatrix = [[1, 0, dx, 0, 1, dy, 0, 0]];
                    tensor3d = tf.image.transform(
                        tensor3d as tf.Tensor4D,
                        transformMatrix
                    );
                }
                // Variation de luminosité
                if (Math.random() < 0.2) {
                    const brightnessDelta = (Math.random() - 0.5) * 0.2;
                    tensor3d = tensor3d.add(brightnessDelta);
                }
                // Variation de contraste
                if (Math.random() < 0.2) {
                    const contrastFactor = 1 + (Math.random() - 0.5) * 0.3;
                    const mean = tensor3d.mean();
                    tensor3d = tensor3d.sub(mean).mul(contrastFactor).add(mean);
                }
                tensor3d = tensor3d.squeeze([0]);
            }

            // Normalisation
            tensor3d = tensor3d.div(255.0);
            tensor3d = tensor3d.sub([0.485, 0.456, 0.406]);
            tensor3d = tensor3d.div([0.229, 0.224, 0.225]);

            return tensor3d.expandDims(0) as tf.Tensor4D;
        } catch (error) {
            throw new Error("Erreur de prétraitement de l'image", {
                cause: {
                    status: 500,
                    message:
                        (error as Error).message ||
                        'Image preprocessing failed',
                },
            });
        }
    });
}

/**
 * Create a feature extractor model.
 *
 * @param config - The configuration object for the model.
 * @returns The created feature extractor model.
 * @example
 * > **Successful result:**
 * > ```json
 * > {
 * >   "pairsArrayForSaving": [
 * >     { "image1Url": "url1", "image2Url": "url2", "isSameAnimal": true }
 * >   ],
 * >   "trainingPairs": [
 * >     { "image1": "tensor1", "image2": "tensor2", "label": 1 }
 * >   ]
 * > }
 *
 * > **Error case:**
 * > ```json
 * > {
 * >   "error": { "message": "Message d'erreur", "status": 500 }
 * > }
 *  ```
 */
export function createFeatureExtractor({
    config = { imageSize: 224, featureSize: 256 },
}: CreateFeatureExtractorProps): CreateFeatureExtractorResult {
    try {
        const featureExtractor = tf.sequential({
            layers: [
                tf.layers.conv2d({
                    inputShape: [config.imageSize, config.imageSize, 3],
                    filters: 32,
                    kernelSize: 3,
                    activation: 'relu',
                    padding: 'same',
                }),
                tf.layers.maxPooling2d({ poolSize: 2 }),
                tf.layers.dropout({ rate: 0.1 }),

                tf.layers.conv2d({
                    filters: 64,
                    kernelSize: 3,
                    activation: 'relu',
                    padding: 'same',
                }),
                tf.layers.maxPooling2d({ poolSize: 2 }),
                tf.layers.dropout({ rate: 0.15 }),

                tf.layers.conv2d({
                    filters: 128,
                    kernelSize: 3,
                    activation: 'relu',
                    padding: 'same',
                }),
                tf.layers.maxPooling2d({ poolSize: 2 }),
                tf.layers.dropout({ rate: 0.2 }),

                tf.layers.conv2d({
                    filters: 256,
                    kernelSize: 3,
                    activation: 'relu',
                    padding: 'same',
                }),
                tf.layers.globalAveragePooling2d({
                    dataFormat: 'channelsLast',
                }),

                tf.layers.dense({
                    units: 512,
                    activation: 'relu',
                }),
                tf.layers.dropout({ rate: 0.3 }),

                tf.layers.dense({
                    units: config.featureSize,
                    activation: 'tanh',
                    name: 'feature_embedding',
                }),
            ],
        });

        return { extractor: featureExtractor, success: true };
    } catch {
        return { success: false };
    }
}

/**
 * Setup the optimal backend for TensorFlow.js.
 *
 * @description This function sets the backend to 'webgl' if available,
 * otherwise it falls back to 'cpu'.
 */
export function setupOptimalBackend() {
    // try {
    if (tf.getBackend() === 'webgl') {
        return;
    }
    tf.setBackend('webgl');
    // } catch (error) {
    //     tf.setBackend('cpu');
    // }
}

/**
 * Create a Siamese model for image similarity.
 *
 * @param status - The status object containing the current state of the model.
 * @param config - The configuration object for the model.
 * @param featureExtractor - The feature extractor model to be used.
 * @returns The created Siamese model or an error object.
 * @example
 * > **Successful result:**
 * > ```json
 * > {
 * >   "siameseModel": "model",
 * >   "success": true
 * > }
 *
 * > **Error case:**
 * > ```json
 * > {
 * >   "error": { "success": false }
 * > }
 *  ```
 */
export function createSiameseModel({
    config,
    featureExtractor,
}: CreateSiameseModelProps): CreateSiameseModelResults {
    try {
        const inputA = tf.input({
            shape: [config.imageSize, config.imageSize, 3],
            name: 'image_a',
        });
        const inputB = tf.input({
            shape: [config.imageSize, config.imageSize, 3],
            name: 'image_b',
        });

        // Extraire les features des deux images
        const featuresA = featureExtractor.apply(inputA) as tf.SymbolicTensor;
        const featuresB = featureExtractor.apply(inputB) as tf.SymbolicTensor;

        // Concaténer les features des deux images
        const concatenated = tf.layers
            .concatenate({
                name: 'features_concat',
            })
            .apply([featuresA, featuresB]);

        // Réseau de décision pour déterminer la similarité
        let decision = tf.layers
            .dense({
                units: 256,
                activation: 'relu',
                name: 'main_decision',
            })
            .apply(concatenated);

        decision = tf.layers
            .dropout({ rate: 0.3, name: 'main_dropout' })
            .apply(decision);

        decision = tf.layers
            .dense({
                units: 128,
                activation: 'relu',
                name: 'secondary_decision',
            })
            .apply(decision);

        decision = tf.layers
            .dropout({ rate: 0.2, name: 'secondary_dropout' })
            .apply(decision);

        decision = tf.layers
            .dense({
                units: 64,
                activation: 'relu',
                name: 'tertiary_decision',
            })
            .apply(decision);

        const prediction = tf.layers
            .dense({
                units: 1,
                activation: 'sigmoid',
                name: 'final_prediction',
            })
            .apply(decision);
        const siameseModel = tf.model({
            inputs: [inputA, inputB],
            outputs: prediction as tf.SymbolicTensor,
            name: 'siamese_network',
        });

        siameseModel.compile({
            optimizer: config.optimizer || tf.train.adam(0.0001),
            loss: config.loss || 'binaryCrossentropy',
            metrics: config.metrics || ['accuracy'],
        });
        return { siameseModel: siameseModel, success: true };
    } catch {
        return { success: false };
    }
}

/**
 * Initialize the animal identification model.
 *
 * @description This function sets up the TensorFlow.js backend,
 * creates the feature extractor and the Siamese model.
 *
 * @param isInitialized - A boolean indicating if the model is already initialized.
 * @param config - The configuration object for the model.
 *
 * @returns An object containing the initialized models or an error object.
 * @example
 * > **Successful result:**
 * > ```json
 * > { "siameseModel": "model",
 * >   "featureExtractor": "extractor",
 * >   "isInitialized": true
 * > }
 *
 * > **Error case:**
 * > ```json
 * > {
 * >   "error": { "message": "Error message", "status": 500 }
 * > }
 *  ```
 */
export function initialize({
    isInitialized,
    config,
}: InitializeProps): InitializeResults {
    try {
        if (isInitialized) {
            throw new Error("Le système d'identification est déjà initialisé", {
                cause: {
                    status: 400,
                    message: 'Already initialized',
                },
            });
        }

        tf.ready();

        // Backend setup
        setupOptimalBackend();

        const feature = createFeatureExtractor({
            config,
        });

        if (!feature.success || !('extractor' in feature)) {
            throw new Error(`Échec de l'initialisation: ${feature.success}`, {
                cause: {
                    status: 500,
                    message: 'Feature extraction failed',
                },
            });
        }

        const siamese = createSiameseModel({
            config,
            featureExtractor: feature.extractor,
        });

        if (!siamese.success || !('siameseModel' in siamese)) {
            throw new Error(`Échec de l'initialisation: ${siamese}`, {
                cause: {
                    status: 500,
                    message: 'Siamese model initialization failed',
                },
            });
        }

        return {
            siameseModel: siamese.siameseModel,
            featureExtractor: feature.extractor,
            isInitialized: siamese.success,
        };
    } catch (error) {
        return {
            error: {
                message:
                    (error as CustomError).cause?.message ||
                    (error as Error).message,
                status: (error as CustomError).cause?.status || 500,
            },
        };
    }
}

/**
 * Train the Siamese model with the provided training pairs.
 *
 * @description This function will update `Status` State at the end
 * of the training process.
 * It will also update the `Status` State after each epoch.
 *
 * @param model - The model object containing the Siamese model and its initialization status.
 * @param status - The current `Status` State of the model, including training pairs and loading state.
 * @param config - The configuration object for the model, including training parameters.
 * @param updateStatus - A function to update the `Status` State of the model.
 * @param initializeModel - A function to initialize the model if it is not already initialized.
 */
export async function trainModel({
    status,
    model,
    config = {},
    updateStatus,
    initializeModel,
}: TrainModelProps) {
    try {
        if (status.trainingPairs.length < 4) {
            throw new Error("Pas assez de paires pour l'entraînement", {
                cause: {
                    status: 404,
                    message: 'Not Found',
                },
            });
        }

        if (status.loadingState.isLoading === 'training') {
            throw new Error('⚠️ Entraînement déjà en cours', {
                cause: {
                    status: 500,
                    message: 'Training already in progress',
                },
            });
        }

        // Initialiser les modèles s'ils ne sont pas créés
        if (
            !model.siameseModel ||
            !model.isInitialized ||
            !model.featureExtractor
        ) {
            initializeModel();
            checkIfInitialized(model.isInitialized);
        }

        if (
            status.balance.positive > status.balance.negative * 1.2 ||
            status.balance.negative > status.balance.positive * 1.2
        ) {
            throw new Error(
                `Déséquilibre des données : ${status.balance.positive} positives, ${status.balance.negative} négatives`,
                {
                    cause: {
                        status: 500,
                        message: 'Data imbalance detected',
                    },
                }
            );
        }

        const images1: TrainingPair['image1'][] = [];
        const images2: TrainingPair['image2'][] = [];
        const labels: TrainingPair['label'][] = [];

        status.trainingPairs.forEach((pair) => {
            if (isTensor4D(pair.image1) && isTensor4D(pair.image2)) {
                images1.push(pair.image1);
                images2.push(pair.image2);
                labels.push(pair.label);
            }
        });

        const xs1 = tf.concat(images1 as tf.Tensor4D[]);
        const xs2 = tf.concat(images2 as tf.Tensor4D[]);

        const ys = tf.tensor1d(labels, 'float32');

        if (!model.siameseModel) {
            throw new Error('Le modèle Siamese non initialisé', {
                cause: {
                    status: 500,
                    message: 'Siamese model is not found',
                },
            });
        }

        await model.siameseModel.fit([xs1, xs2], ys, {
            epochs: config.epochs,
            batchSize: config.batchSize,
            validationSplit: config.validationSplit,
            shuffle: true,
            verbose: 1,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    console.log(
                        `Epoch ${epoch + 1}: loss=${logs?.loss?.toFixed(
                            4
                        )}, accuracy=${logs?.acc?.toFixed(4)}`
                    );
                    updateStatus({
                        trainEpochCount: epoch + 1,
                        loss: logs?.loss,
                        accuracy:
                            (logs && (logs.acc * 100).toFixed(1)) || 'N/A',
                    });
                },
            },
        });

        xs1.dispose();
        xs2.dispose();
        ys.dispose();

        updateStatus({
            loadingState: {
                message: 'Entraînement du modèle terminé',
                isLoading: 'done',
                type: 'training',
            },
        });
    } catch (error) {
        updateStatus({
            error: {
                message:
                    "Erreur lors de l'entraînement \n" +
                    (error as Error).message,
                status: (error as CustomError).cause?.status || 500,
            },
            loadingState: {
                message: '',
                isLoading: '',
                type: '',
            },
        });
    }
}

/**
 * Checks if the provided tensor is a 4D tensor.
 *
 * @description This is used in the `trainModel` function
 * to ensure that the tensors being processed are of the correct shape.
 *
 * @param tensor - The tensor to check.
 * @returns True if the tensor is a 4D tensor, false otherwise.
 */
function isTensor4D(tensor: unknown): tensor is tf.Tensor4D {
    return tensor instanceof tf.Tensor && tensor.rank === 4;
}

/**
 * Compare two images using the Siamese model.
 *
 * @param imageArray - An array containing two image elements to be compared.
 * @param config - The configuration object for the model, including preprocessing parameters.
 * @param model - The model object containing the Siamese model and its initialization status.
 * @returns A promise that resolves to the comparison result, including similarity score and confidence.
 *
 * @example
 * > **Successful result:**
 * > ```json
 * > {
 * >   "sameAnimal": true,
 * >   "confidence": 0.85,
 * >   "similarityScore": 0.85
 * > }
 *
 * > **Error case:**
 * > ```json
 * > {
 * >   "error": { "message": "Message d'erreur", "status": 500 }
 * > }
 * ```
 */
export async function compareImages({
    imageArray,
    config,
    model,
    initializeModel,
}: CompareImagesProps): Promise<CompareImagesResults> {
    try {
        if (!model.siameseModel || !model.isInitialized) {
            initializeModel();
            checkIfInitialized(model.isInitialized);
        }

        if (imageArray.length !== 2) {
            throw new Error(
                'Deux images sont nécessaires pour la comparaison',
                {
                    cause: {
                        status: 400,
                        message: 'Bad Request, you need two images',
                    },
                }
            );
        }

        const img1 = preprocessImage({ imageElement: imageArray[0], config });
        const img2 = preprocessImage({ imageElement: imageArray[1], config });

        if (!model.siameseModel) {
            throw new Error('Modèle Siamese non trouvé', {
                cause: {
                    status: 404,
                    message: 'Siamese model not found',
                },
            });
        }

        if (!isTensor4D(img1) || !isTensor4D(img2)) {
            throw new Error('Erreur de prétraitement des images', {
                cause: {
                    status: 500,
                    message:
                        'Image preprocessing failed, ensure images are tensors',
                },
            });
        }

        const predictionRaw = model.siameseModel.predict([img1, img2]);
        const prediction = Array.isArray(predictionRaw)
            ? predictionRaw[0]
            : predictionRaw;
        const similarity = await prediction.data();

        img1.dispose();
        img2.dispose();
        prediction.dispose();

        const score = similarity[0];
        return {
            sameAnimal: score > config.predictionThreshold,
            confidence: Math.abs(score - 0.5) * 2,
            similarityScore: score,
        };
    } catch (error) {
        return {
            error: {
                message:
                    (error as CustomError).cause?.message ||
                    (error as Error).message,
                status: (error as CustomError).cause?.status || 500,
            },
        };
    }
}

export function saveTrainingPairs({ config, status, updateStatus }) {
    try {
        localStorage.setItem(
            config.localStorageKey,
            JSON.stringify(status.pairsArrayForSaving)
        );
        console.log("💾 Paires d'entraînement sauvegardées");
    } catch (error) {
        updateStatus({
            error: {
                message:
                    "❌ Erreur lors de la sauvegarde des paires d'entraînement:" +
                    error.message,
                status: error.cause?.status || 500,
            },
        });
    }
}

export async function save({
    name = null,
    status,
    updateStatus,
    // featureExtractor,
    // siameseModel,
    model,
    config,
}) {
    try {
        if (!model.siameseModel || !model.featureExtractor) {
            throw new Error('⚠️ Aucun modèle à sauvegarder', {
                cause: {
                    status: 404,
                    message: 'Model not found',
                },
            });
        }

        const modelName = name || `animal-identifier-${config.taskName}`;
        // Utiliser un IOHandler personnalisé pour capturer les données
        const siameseHandler = tf.io.withSaveHandler(
            async (artifacts) => artifacts
        );
        const featureHandler = tf.io.withSaveHandler(
            async (artifacts) => artifacts
        );

        const siameseArtifacts = await model.siameseModel.save(siameseHandler);
        const featureArtifacts = await model.featureExtractor.save(
            featureHandler
        );

        // Créer l'objet de données complet
        const modelData = {
            metadata: {
                name: modelName,
                taskName: config.taskName,
                timestamp: new Date().toISOString(),
                imageSize: config.imageSize,
                featureSize: config.featureSize,
                trainingPairsCount: status.trainingPairs.length,
                comparisonCount: status.comparisonsCount,
            },
            siameseModel: {
                modelTopology: siameseArtifacts.modelTopology,
                weightSpecs: siameseArtifacts.weightSpecs,
                weightData: Array.from(
                    new Uint8Array(siameseArtifacts.weightData)
                ),
            },
            featureExtractor: {
                modelTopology: featureArtifacts.modelTopology,
                weightSpecs: featureArtifacts.weightSpecs,
                weightData: Array.from(
                    new Uint8Array(featureArtifacts.weightData)
                ),
            },
        };

        // Créer et télécharger le fichier JSON
        const jsonString = JSON.stringify(modelData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${modelName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Save the model to local storage for quick access
        saveTrainingPairs({ config, status, updateStatus });

        console.log(`💾 Modèle sauvegardé: ${modelName}.json`);
        console.log(
            '📁 Le fichier sera téléchargé dans votre dossier de téléchargements'
        );
    } catch (error) {
        throw new Error('Erreur lors de la sauvegarde du modèle ', {
            cause: {
                status: error.status || 500,
                message: error.message || 'Model not found',
            },
        });
    }
}

// export function reset({ status, setStatus }) {
//     status.trainingPairs.forEach((pair) => {
//         if (pair.image1) pair.image1.dispose();
//         if (pair.image2) pair.image2.dispose();
//     });

//     setStatus((prev) => ({
//         ...prev,
//         trainingPairs: [],
//         comparisonCount: 0,
//     }));

//     initialize({
//         isInitialized,
//         setIsInitialized,
//         setStatus,
//         config,
//         featureExtractor,
//         setFeatureExtractor,
//         setSiameseModel,
//         status,
//     });
//     console.log('🔄 Modèle réinitialisé');
// }

/**
 * Check if the model is initialized.
 *
 * @description This function checks if the model is initialized.
 * If not, it throws an error with a specific message and status code.
 *
 * @param isInitialized - A boolean indicating if the model is initialized.
 * @throws {Error} If the model is not initialized.
 */
export function checkIfInitialized(isInitialized = false) {
    if (!isInitialized) {
        throw new Error("Système d'identification non initialisé", {
            cause: {
                status: 400,
                message: 'System not initialized',
            },
        });
    }
}

export async function loadModelFromData({
    modelData,
    config,
    updateStatus,
    setModel,
}) {
    try {
        // Vérifier la structure des données
        if (!modelData.siameseModel || !modelData.featureExtractor) {
            throw new Error('Structure de données invalide', {
                cause: {
                    status: 400,
                    message: 'Invalid data structure',
                },
            });
        }

        // Restaurer les métadonnées si disponibles
        if (modelData.metadata) {
            config.taskName = modelData.metadata.taskName || config.taskName;
            config.imageSize = modelData.metadata.imageSize || config.imageSize;
            config.featureSize =
                modelData.metadata.featureSize || config.featureSize;
            console.log(
                `📋 Métadonnées restaurées: ${modelData.metadata.name}`
            );
        }

        // Reconvertir les données de poids
        const siameseWeightData = new Uint8Array(
            modelData.siameseModel.weightData
        ).buffer;
        const featureWeightData = new Uint8Array(
            modelData.featureExtractor.weightData
        ).buffer;

        // Créer des IOHandlers personnalisés pour le chargement
        const featureHandler = {
            load: async () => ({
                modelTopology: modelData.featureExtractor.modelTopology,
                weightSpecs: modelData.featureExtractor.weightSpecs,
                weightData: featureWeightData,
                format: 'layers-model',
                generatedBy: 'TensorFlow.js',
                convertedBy: 'useAnimalIdentificationHook',
                userDefinedMetadata: {},
            }),
        };

        const siameseHandler = {
            load: async () => ({
                modelTopology: modelData.siameseModel.modelTopology,
                weightSpecs: modelData.siameseModel.weightSpecs,
                weightData: siameseWeightData,
                format: 'layers-model',
                generatedBy: 'TensorFlow.js',
                convertedBy: 'useAnimalIdentificationHook',
                userDefinedMetadata: {},
            }),
        };

        console.log('🔄 Chargement du feature extractor...');

        const featureExtractor = await tf.loadLayersModel(featureHandler);
        console.log('✅ Feature extractor chargé');

        console.log('🔄 Chargement du modèle siamois...');
        const siameseModel = await tf.loadLayersModel(siameseHandler);
        console.log('✅ Modèle siamois chargé');

        siameseModel.compile({
            optimizer: config.optimizer || tf.train.adam(0.0001),
            loss: config.loss || 'binaryCrossentropy',
            metrics: config.metrics || ['accuracy'],
        });
        setModel(async (prev) => ({
            ...prev,
            siameseModel,
            isInitialized: true,
            featureExtractor,
        }));
        const modelName = modelData.metadata?.name || 'modèle-chargé';

        // this.loadData();

        console.log(`📂 Modèle chargé avec succès: ${modelName}`);
        return true;
    } catch (error) {
        updateStatus({
            error: {
                message: `❌ Erreur lors du chargement du modèle: ${error.message}`,
                status: error.cause?.status || 500,
            },
        });
        return false;
    }
}
