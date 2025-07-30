export function getDataBalance({ trainingPairs, updateStatus }) {
    // if (!trainingPairs || trainingPairs.length === 0) {
    //     return updateStatus({
    //         balance: { positive: 0, negative: 0, total: 0 },
    //     });
    // }
    const positive = trainingPairs.filter((pair) => pair.label === 1).length;
    const negative = trainingPairs.filter((pair) => pair.label === 0).length;
    const total = trainingPairs.length;

    updateStatus({
        balance: { positive, negative, total },
    });
}

export async function loadStorageData({
    updateStatus,
    isInitialized,
    config,
    trainingPairs = [],
}) {
    const tensorPairs = [];
    const savingPairs = [];
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
                const img1 = await loadImageElement(image1Url);
                const img2 = await loadImageElement(image2Url);

                const pairs = addTrainingPairToModel({
                    imgArray: [img1, img2],
                    isSameAnimal,
                    config,
                    isInitialized,
                });

                if (pairs.error) {
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
        console.log('Catch ?');
        return {
            error: {
                message: error.cause?.message || error.message,
                status: error.cause?.status || 500,
            },
        };
    }
}

export function loadImageElement(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;

        img.onload = () => resolve(img);
        img.onerror = () =>
            reject(new Error(`Failed to load image: ${imageUrl}`));
    });
}

export function addTrainingPairToModel({
    imgArray,
    isSameAnimal,
    config,
    isInitialized,
}) {
    try {
        checkIfInitialized(isInitialized);

        const img1 = preprocessImage(imgArray[0], config);
        const img2 = preprocessImage(imgArray[1], config);
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
                message: error.cause?.message || error.message,
                status: error.cause?.status || 500,
            },
        };
    }
}

export function preprocessImage(imageElement, config) {
    const { imageSize, augment } = config;
    return tf.tidy(() => {
        try {
            let tensor = tf.browser.fromPixels(imageElement);

            tensor = tf.image.resizeBilinear(tensor, [imageSize, imageSize]);

            tensor = tensor.toFloat();

            // Augmentation simple si demandée
            if (augment) {
                if (tensor.rank === 3) {
                    tensor = tensor.expandDims(0);
                }
                // Flip horizontal (déjà présent)
                if (Math.random() < 0.5) {
                    tensor = tf.image.flipLeftRight(tensor);
                }
                // Flip vertical (rare mais possible)
                if (Math.random() < 0.1) {
                    tensor = tensor.reverse(1);
                }
                // Rotation légère (±15°)
                if (Math.random() < 0.2) {
                    const angle = (Math.random() - 0.5) * (Math.PI / 6); // -15° à +15°
                    tensor = tf.image.rotateWithOffset(tensor, angle, 0);
                }
                // Décalage (translation) légère
                if (Math.random() < 0.2) {
                    const dx = Math.floor((Math.random() - 0.5) * 10); // -5 à +5 px
                    const dy = Math.floor((Math.random() - 0.5) * 10);
                    const transformMatrix = [[1, 0, dx, 0, 1, dy, 0, 0]];
                    tensor = tf.image.transform(tensor, transformMatrix);
                }
                // Variation de luminosité
                if (Math.random() < 0.2) {
                    const brightnessDelta = (Math.random() - 0.5) * 0.2;
                    tensor = tensor.add(brightnessDelta);
                }
                // Variation de contraste
                if (Math.random() < 0.2) {
                    const contrastFactor = 1 + (Math.random() - 0.5) * 0.3;
                    const mean = tensor.mean();
                    tensor = tensor.sub(mean).mul(contrastFactor).add(mean);
                }
                tensor = tensor.squeeze(0);
            }

            // Normalisation
            tensor = tensor.div(255.0);
            tensor = tensor.sub([0.485, 0.456, 0.406]);
            tensor = tensor.div([0.229, 0.224, 0.225]);

            return tensor.expandDims(0);
        } catch (error) {
            throw new Error("Erreur de prétraitement de l'image", {
                cause: {
                    status: 500,
                    message: error.message || 'Image preprocessing failed',
                },
            });
        }
    });
}

export function createFeatureExtractor({
    // setFeatureExtractor,
    config = { imageSize: 224, featureSize: 256 },
}) {
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
    } catch (error) {
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
 */
export function createSiameseModel({ status, config, featureExtractor }) {
    if (status.siameseModelInitialized) {
        return true;
    }
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
        const featuresA = featureExtractor.apply(inputA);
        const featuresB = featureExtractor.apply(inputB);

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
            outputs: prediction,
            name: 'siamese_network',
        });

        siameseModel.compile({
            optimizer: config.optimizer || tf.train.adam(0.0001),
            loss: config.loss || 'binaryCrossentropy',
            metrics: config.metrics || ['accuracy'],
        });
        return { siameseModel: siameseModel, success: true };
    } catch (error) {
        return { success: false };
    }
}

/**
 * Initialize the animal identification model.
 *
 * @description This function sets up the TensorFlow.js backend,
 * creates the feature extractor and the Siamese model.
 */
export function initialize({ isInitialized, config, status }) {
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

        if (!feature.success) {
            throw new Error(`Échec de l'initialisation: ${feature.success}`, {
                cause: {
                    status: 500,
                    message: 'Feature extraction failed',
                },
            });
        }

        const siamese = createSiameseModel({
            status,
            config,
            featureExtractor: feature.extractor,
        });

        if (!siamese.success) {
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
                message: error.cause?.message || error.message,
                status: error.cause?.status || 500,
            },
        };
    }
}

export async function trainModel({
    status,
    model,
    config = {},
    updateStatus,
    initializeModel,
}) {
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
        if (!model.siameseModel || !model.isInitialized) {
            initializeModel();
            checkIfInitialized(model.isInitialized);
        }

        if (
            status.balance.positive > status.balance.negative * 1.2 ||
            status.balance.negative > status.balance.positive * 1.2
        ) {
            throw new Error(
                `⚠️ Déséquilibre des données : ${status.balance.positive} positives, ${status.balance.negative} négatives`,
                {
                    cause: {
                        status: 500,
                        message: 'Data imbalance detected',
                    },
                }
            );
        }

        const images1 = [];
        const images2 = [];
        const labels = [];

        status.trainingPairs.forEach((pair) => {
            images1.push(pair.image1);
            images2.push(pair.image2);
            labels.push(pair.label);
        });

        const xs1 = tf.concat(images1);
        const xs2 = tf.concat(images2);

        const ys = tf.tensor1d(labels, 'float32');

        await model.siameseModel.fit([xs1, xs2], ys, {
            epochs: config.epochs,
            batchSize: config.batchSize,
            validationSplit: config.validationSplit,
            shuffle: true,
            verbose: 1,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    console.log(
                        `Epoch ${epoch + 1}: loss=${logs.loss?.toFixed(
                            4
                        )}, accuracy=${logs.acc?.toFixed(4)}`
                    );
                    updateStatus({
                        trainEpochCount: epoch + 1,
                        loss: logs.loss,
                        accuracy: (logs.acc * 100).toFixed(1),
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
        // return history;
    } catch (error) {
        updateStatus({
            error: {
                message: "Erreur lors de l'entraînement \n" + error.message,
                status: error.cause?.status || 500,
            },
            loadingState: {
                message: '',
                isLoading: '',
                type: '',
            },
        });
    }
}

export async function compareImages({
    imageArray,
    config,
    model,
    initializeModel,
}) {
    try {
        if (!model.siameseModel || !model.isInitialized) {
            initializeModel();
            checkIfInitialized(model.isInitialized);
        }

        if (imageArray.length !== 2) {
            throw new Error(
                '⚠️ Deux images sont nécessaires pour la comparaison',
                {
                    cause: {
                        status: 400,
                        message: 'Bad Request',
                    },
                }
            );
        }

        const img1 = preprocessImage(imageArray[0], config);
        const img2 = preprocessImage(imageArray[1], config);

        const prediction = model.siameseModel.predict([img1, img2]);
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
                message: error.cause?.message || error.message,
                status: error.cause?.status || 500,
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

export function checkIfInitialized(isInitialized) {
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
