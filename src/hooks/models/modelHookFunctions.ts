export function getDataBalance({ trainingPairs, setStatus }) {
    const positive = trainingPairs.filter((pair) => pair.label === 1).length;
    const negative = trainingPairs.filter((pair) => pair.label === 0).length;
    const total = trainingPairs.length;

    setStatus((prev) => ({
        ...prev,
        balance: { positive, negative, total },
    }));
}

export async function loadStorageData({
    setStatus,
    isInitialized,
    config,
    trainingPairs = [],
}) {
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

                addTrainingPairToModel({
                    imgArray: [img1, img2],
                    isSameAnimal,
                    setStatus,
                    config,
                    isInitialized,
                });
            })
        );
        setStatus((prev) => ({
            ...prev,
            loadingState: {
                message: 'Données image chargées',
                isLoading: 'done',
                type: 'storage',
            },
            localStorageDataLoaded: true,
        }));
    } catch (error) {
        setStatus((prev) => ({
            ...prev,
            error: {
                message: error.message,
                status: error.cause.status || 500,
            },
        }));
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
    setStatus,
    config,
    isInitialized,
}) {
    checkIfInitialized(isInitialized);

    try {
        const img1 = preprocessImage(imgArray[0], config);
        const img2 = preprocessImage(imgArray[1], config);
        const label = isSameAnimal ? 1 : 0;
        console.log(`📊 Nouvelle paire ajoutée à l'entraînement`);
        // console.log(
        //     `📊 Paire ajoutée: ${status.trainingPairs.length} paires d'entraînement`
        // );
        setStatus((prev) => ({
            ...prev,
            pairsArrayForSaving: [
                ...prev.pairsArrayForSaving,
                {
                    image1Url: imgArray[0].src,
                    image2Url: imgArray[1].src,
                    isSameAnimal,
                },
            ],
            trainingPairs: [
                ...prev.trainingPairs,
                { image1: img1, image2: img2, label: label },
            ],
        }));
        // setIsTraining(false);
    } catch (error) {
        setStatus((prev) => ({
            ...prev,
            error: {
                message: error.message,
                status: error.cause.status || 500,
            },
        }));
        // setIsTraining(false);
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
            throw new Error("Erreur de prétraitement de l'image", error);
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

export function setupOptimalBackend() {
    try {
        if (tf.getBackend() === 'webgl') {
            return;
            // throw new Error('WebGL déjà actif');
        }
        tf.setBackend('webgl');
        // console.log('✅ Backend WebGL configuré');
    } catch (error) {
        tf.setBackend('cpu');
        console.log('✅ Fallback vers CPU');
    }
}

export function createSiameseModel({
    // setStatus,
    status,
    config,
    featureExtractor,
    // setSiameseModel,
}) {
    if (status.siameseModelInitialized) {
        console.log('✅ Modèle siamois déjà créé');
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

        // setSiameseModel(siameseModel);
        // setStatus((prev) => ({
        //     ...prev,
        //     siameseModelInitialized: true,
        // }));
        return { siameseModel: siameseModel, success: true };
    } catch (error) {
        return { success: false };
    }
}

/**
 * Initialize the animal identification model.
 */
export function initialize({
    isInitialized,
    setStatus,
    config,
    setModel,
    status,
}) {
    try {
        if (isInitialized) {
            throw new Error("Le système d'identification est déjà initialisé", {
                cause: {
                    status: 400,
                    message: 'Already initialized',
                },
            });
        }
        // throw new Error('AnimalIdentificationTF not loaded', {
        //     cause: { status: 404, message: 'Script not found' },
        // });

        tf.ready();

        // Configuration backend avec gestion d'erreur
        setupOptimalBackend();

        const feature = createFeatureExtractor({
            // setFeatureExtractor,
            config,
        });

        if (!feature.success) {
            throw new Error(
                `❌ Échec de l'initialisation: ${feature.success}`,
                {
                    cause: {
                        status: 500,
                        message: 'Feature extraction failed',
                    },
                }
            );
        }
        // if (!featureSuccess) return false;

        const siamese = createSiameseModel({
            status,
            config,
            featureExtractor: feature.extractor,
        });

        if (!siamese.success) {
            throw new Error(`❌ Échec de l'initialisation: ${siamese}`, {
                cause: {
                    status: 500,
                    message: 'Initialization failed',
                },
            });
        }
        setStatus((prev) => ({
            ...prev,
            loadingState: {
                message: 'Modèle initialisé',
                isLoading: 'done',
                type: 'initializing',
            },
            siameseModelInitialized: true,
            featureExtractorInitialized: true,
        }));
        setModel((prev) => ({
            ...prev,
            siameseModel: siamese.siameseModel,
            featureExtractor: feature.extractor,
            isInitialized: siamese.success,
        }));
        console.log('modèle initialisé avec succès');
    } catch (error) {
        setStatus((prev) => ({
            ...prev,
            error: {
                message: "❌ Échec de l'initialisation :" + error.message,
                status: error.cause?.status || 500,
            },
        }));
    }
}

export async function trainModel({
    status,
    model,
    config = {},
    setStatus,
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
                    setStatus((prev) => ({
                        ...prev,
                        trainEpochCount: epoch + 1,
                        loss: logs.loss,
                        accuracy: (logs.acc * 100).toFixed(1),
                    }));
                },
            },
        });

        xs1.dispose();
        xs2.dispose();
        ys.dispose();

        setStatus((prev) => ({
            ...prev,
            loadingState: {
                message: 'Entraînement du modèle terminé',
                isLoading: 'done',
                type: 'training',
            },
        }));
        // return history;
    } catch (error) {
        setStatus((prev) => ({
            ...prev,
            error: {
                message: "Erreur lors de l'entraînement \n" + error.message,
                status: error.cause?.status || 500,
            },
            loadingState: {
                message: '',
                isLoading: '',
                type: '',
            },
        }));
    }
}

export async function compareImages({
    imageArray,
    config,
    model,
    setStatus,
    status,
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

        // console.log(
        //     `🔍 Comparaison ${status.comparisonsCount}: score=${score.toFixed(
        //         4
        //     )}`
        // );

        setStatus((prev) => ({
            ...prev,
            comparisonsCount: prev.comparisonsCount + 1,
            similarityScore: score,
            sameAnimal: score > config.predictionThreshold,
            confidence: Math.abs(score - 0.5) * 2,
        }));
    } catch (error) {
        setStatus((prev) => ({
            ...prev,
            error: {
                message: '❌ Erreur lors de la comparaison:' + error.message,
                status: error.cause?.status || 500,
            },
        }));
    }
}

export function saveTrainingPairs({ config, status, setStatus }) {
    try {
        localStorage.setItem(
            config.localStorageKey,
            JSON.stringify(status.pairsArrayForSaving)
        );
        console.log("💾 Paires d'entraînement sauvegardées");
    } catch (error) {
        setStatus((prev) => ({
            ...prev,
            error: {
                message:
                    "❌ Erreur lors de la sauvegarde des paires d'entraînement:" +
                    error.message,
                status: error.cause?.status || 500,
            },
        }));
    }
}

export async function save({
    name = null,
    status,
    setStatus,
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
        saveTrainingPairs({ config, status, setStatus });

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
    setStatus,
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
        setStatus((prev) => ({
            ...prev,
            error: {
                message: `❌ Erreur lors du chargement du modèle: ${error.message}`,
                status: error.cause?.status || 500,
            },
        }));
        return false;
    }
}
