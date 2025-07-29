/**
 * Système d'identification d'animaux avec TensorFlow.js
 * Utilise un réseau siamois pour comparer si deux images contiennent le même animal
 */

class AnimalIdentificationTF {
    #localStorageKey = 'pair-array';
    #siameseModelInitialized = false;
    #pairsArrayForSaving = [];
    #params = {
        epochs: 100,
        validationSplit: 0.2,
    };
    #defaultDataArray = [];
    constructor(taskName = 'animal-identification') {
        this.taskName = taskName;
        this.featureExtractor = null;
        this.siameseModel = null;
        this.isTraining = false;
        this.trainingPairs = [];
        this.finalAccuracy = 0;
        this.comparisonCount = 0;
        this.imageSize = 224;
        this.featureSize = 256;
        this.isInitialized = false;

        this.loadData();

        console.log("🏗️ Système d'identification d'animaux initialisé");
    }

    // Configurer le backend optimal avec fallback
    async setupOptimalBackend() {
        try {
            if (tf.getBackend() === 'webgl') {
                return;
                // throw new Error('WebGL déjà actif');
            }
            await tf.setBackend('webgl');
            console.log('✅ Backend WebGL configuré');
        } catch (error) {
            await tf.setBackend('cpu');
            console.log('✅ Fallback vers CPU');
        }
    }

    // Créer le modèle d'extraction de features
    async createFeatureExtractor() {
        try {
            this.featureExtractor = tf.sequential({
                layers: [
                    tf.layers.conv2d({
                        inputShape: [this.imageSize, this.imageSize, 3],
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
                        units: this.featureSize,
                        activation: 'tanh',
                        name: 'feature_embedding',
                    }),
                ],
            });

            console.log('✅ Feature Extractor créé');
            return true;
        } catch (error) {
            console.error('❌ Erreur création feature extractor:', error);
            return false;
        }
    }

    // Créer le modèle siamois complet
    createSiameseModel() {
        if (this.#siameseModelInitialized) {
            console.log('✅ Modèle siamois déjà créé');
            return true;
        }
        try {
            const inputA = tf.input({
                shape: [this.imageSize, this.imageSize, 3],
                name: 'image_a',
            });
            const inputB = tf.input({
                shape: [this.imageSize, this.imageSize, 3],
                name: 'image_b',
            });

            // Extraire les features des deux images
            const featuresA = this.featureExtractor.apply(inputA);
            const featuresB = this.featureExtractor.apply(inputB);

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

            this.siameseModel = tf.model({
                inputs: [inputA, inputB],
                outputs: prediction,
                name: 'siamese_network',
            });

            const optimizer = tf.train.adam(0.0001);
            this.siameseModel.compile({
                optimizer: optimizer,
                loss: 'binaryCrossentropy',
                metrics: ['accuracy'],
            });

            this.#siameseModelInitialized = true;
            console.log('✅ Modèle siamois créé');
            return true;
        } catch (error) {
            console.error('❌ Erreur création modèle siamois:', error);
            return false;
        }
    }

    // Initialiser tous les modèles
    async initializeModels() {
        if (this.isInitialized) {
            console.log('✅ Modèles déjà initialisés');
            return true;
        }
        console.log('🔄 Initialisation des modèles...');
        try {
            // Attendre que TensorFlow soit complètement prêt
            await tf.ready();
            console.log(`Backend actif: ${tf.getBackend()}`);

            // Configuration backend avec gestion d'erreur
            await this.setupOptimalBackend();

            const featureSuccess = await this.createFeatureExtractor();
            if (!featureSuccess) return;
            // if (!featureSuccess) return false;

            const siameseSuccess = this.createSiameseModel();

            // if (siameseSuccess) {
            //     this.isInitialized = true;
            //     console.log('✅ Modèles initialisés avec succès');
            // }
            this.isInitialized = siameseSuccess;
            console.log('✅ Modèles initialisés avec succès');
            return this.isInitialized;
        } catch (error) {
            console.error(
                "❌ Erreur lors de l'initialisation des modèles:",
                error
            );
            return false;
        }
    }

    // Préprocesser une image
    preprocessImage(imageElement, augment = true) {
        return tf.tidy(() => {
            try {
                let tensor = tf.browser.fromPixels(imageElement);

                tensor = tf.image.resizeBilinear(tensor, [
                    this.imageSize,
                    this.imageSize,
                ]);

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

    // Extraire les features d'une image
    async extractFeatures(imageElement) {
        if (!this.featureExtractor) {
            console.log('⚠️ Feature extractor non initialisé');
            return null;
        }

        try {
            const preprocessed = this.preprocessImage(imageElement);
            const features = this.featureExtractor.predict(preprocessed);

            // Nettoyer l'image preprocessed mais garder les features
            preprocessed.dispose();

            return features;
        } catch (error) {
            console.error(
                "❌ Erreur lors de l'extraction des features:",
                error
            );
            return null;
        }
    }

    // Ajouter une paire d'images pour l'entraînement
    async addTrainingPair(imagesArray, isSameAnimal) {
        // Saving the pair in order to load datas if needed
        this.#pairsArrayForSaving.push({
            image1Url: imagesArray[0].src,
            image2Url: imagesArray[1].src,
            isSameAnimal,
        });

        try {
            const img1 = this.preprocessImage(imagesArray[0], false);
            const img2 = this.preprocessImage(imagesArray[1], false);
            const label = isSameAnimal ? 1 : 0;

            this.trainingPairs.push({
                image1: img1,
                image2: img2,
                label: label,
            });

            console.log(
                `📊 Paire ajoutée: ${this.trainingPairs.length} paires d'entraînement`
            );
        } catch (error) {
            console.error("❌ Erreur lors de l'ajout de la paire:", error);
        }
    }

    // Vérifier l'équilibre des données d'entraînement
    getDataBalance() {
        const positive = this.trainingPairs.filter(
            (pair) => pair.label === 1
        ).length;
        const negative = this.trainingPairs.filter(
            (pair) => pair.label === 0
        ).length;
        const total = this.trainingPairs.length;

        console.log(`📊 Balance: ${positive} positives, ${negative} négatives`);
        return { positive, negative, total };
    }

    // Entraînement simple
    async trainModel(config = {}) {
        if (this.trainingPairs.length < 4) {
            console.log("⚠️ Pas assez de paires pour l'entraînement");
            return;
        }

        if (this.isTraining) {
            console.log('⚠️ Entraînement déjà en cours');
            return;
        }

        // Initialiser les modèles s'ils ne sont pas créés
        if (!this.siameseModel || !this.isInitialized) {
            this.initializeModels();
            if (!this.isInitialized) {
                return;
            }
        }

        const balance = this.getDataBalance();
        if (
            balance.positive > balance.negative * 1.2 ||
            balance.negative > balance.positive * 1.2
        ) {
            console.log(
                `⚠️ Déséquilibre des données: ${balance.positive} positives, ${balance.negative} négatives`
            );
            return;
        }

        this.isTraining = true;

        this.#params = {
            ...this.#params,
            batchSize: 4,
            // batchSize: Math.max(
            //     2,
            //     Math.min(6, Math.floor(this.trainingPairs.length / 4))
            // ),
            ...config,
        };

        try {
            // this.shuffleArray(this.trainingPairs);
            // const valSplit =
            //     config.validationSplit ?? this.#params.validationSplit;
            // const splitIdx = Math.floor(
            //     this.trainingPairs.length * (1 - valSplit)
            // );
            // const trainPairs = this.trainingPairs.slice(0, splitIdx);
            // const valPairs = this.trainingPairs.slice(splitIdx);

            // Dataset pour l'entraînement
            // const trainDataset = tf.data
            //     .generator(() =>
            //         this.siameseDataGenerator(
            //             trainPairs,
            //             this.#params.batchSize
            //         )
            //     )
            //     .repeat();

            // Dataset pour la validation
            // const valDataset = tf.data
            //     .generator(() =>
            //         this.siameseDataGenerator(valPairs, this.#params.batchSize)
            //     )
            //     .repeat();

            // const dataset = tf.data
            //     .generator(() =>
            //         this.siameseDataGenerator(
            //             this.trainingPairs,
            //             this.#params.batchSize
            //         )
            //     )
            //     .repeat(this.#params.epochs);

            const images1 = [];
            const images2 = [];
            const labels = [];

            this.trainingPairs.forEach((pair) => {
                images1.push(pair.image1);
                images2.push(pair.image2);
                labels.push(pair.label);
            });

            const xs1 = tf.concat(images1);
            const xs2 = tf.concat(images2);
            const ys = tf.tensor1d(labels, 'float32');

            console.log('Training...', this.#params);

            // await this.siameseModel.fitDataset(trainDataset, {
            //     epochs: this.#params.epochs,
            //     batchesPerEpoch: Math.ceil(
            //         trainPairs.length / this.#params.batchSize
            //     ),
            //     validationData: valDataset,
            //     validationBatches: Math.ceil(
            //         valPairs.length / this.#params.batchSize
            //     ),
            //     verbose: 1,
            //     callbacks: {
            //         onEpochEnd: (epoch, logs) => {
            //             console.log(
            //                 `Epoch ${epoch + 1}: loss=${logs.loss?.toFixed(
            //                     4
            //                 )}, accuracy=${logs.acc?.toFixed(4)}`
            //             );
            //         },
            //     },
            // });
            const history = await this.siameseModel.fit([xs1, xs2], ys, {
                epochs: this.#params.epochs,
                batchSize: this.#params.batchSize,
                validationSplit: this.#params.validationSplit,
                shuffle: true,
                verbose: 1,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        console.log(
                            `Epoch ${epoch + 1}: loss=${logs.loss?.toFixed(
                                4
                            )}, accuracy=${logs.acc?.toFixed(4)}`
                        );
                    },
                },
            });

            xs1.dispose();
            xs2.dispose();
            ys.dispose();

            console.log('✅ Entraînement terminé');
            return history;
        } catch (error) {
            console.error("❌ Erreur lors de l'entraînement:", error.message);
        } finally {
            this.isTraining = false;
        }
    }

    shuffleArray(array) {
        // array.sort(() => Math.random() - 0.5);
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        // console.log(array);
    }

    *siameseDataGenerator(trainingPairs, batchSize = 4) {
        let index = 0;
        while (index < trainingPairs.length) {
            const batchPairs = trainingPairs.slice(index, index + batchSize);
            const images1 = batchPairs.map((pair) => pair.image1);
            const images2 = batchPairs.map((pair) => pair.image2);
            const labels = batchPairs.map((pair) => pair.label);

            yield {
                xs: [tf.concat(images1), tf.concat(images2)],
                ys: tf.tensor2d(labels, [labels.length, 1], 'float32'),
            };
            index += batchSize;
        }
    }

    // Comparer deux images
    async compareAnimals(imageArray) {
        // Initialiser les modèles s'ils ne sont pas créés
        if (!this.siameseModel || !this.isInitialized) {
            this.initializeModels();
            if (!this.isInitialized) {
                return;
            }
        }
        try {
            if (imageArray.length !== 2) {
                throw new Error(
                    '⚠️ Deux images sont nécessaires pour la comparaison'
                );
            }

            const img1 = this.preprocessImage(imageArray[0], false);
            const img2 = this.preprocessImage(imageArray[1], false);

            const prediction = this.siameseModel.predict([img1, img2]);
            const similarity = await prediction.data();

            img1.dispose();
            img2.dispose();
            prediction.dispose();

            const score = similarity[0];
            this.comparisonCount++;
            console.log(
                `🔍 Comparaison ${this.comparisonCount}: score=${score.toFixed(
                    4
                )}`
            );
            const threshold = 0.7;
            return {
                similarity: score,
                sameAnimal: score > threshold,
                confidence: Math.abs(score - 0.5) * 2,
                details: {
                    threshold,
                },
            };
        } catch (error) {
            console.error('❌ Erreur lors de la comparaison:', error);
            return null;
        }
    }

    // Réinitialiser le modèle
    async reset() {
        this.trainingPairs.forEach((pair) => {
            if (pair.image1) pair.image1.dispose();
            if (pair.image2) pair.image2.dispose();
        });

        this.trainingPairs = [];
        this.comparisonCount = 0;

        this.initializeModels();
        console.log('🔄 Modèle réinitialisé');
    }

    // Sauvegarder le modèle dans un fichier JSON
    async saveModel(name = null) {
        if (!this.siameseModel || !this.featureExtractor) {
            console.log('⚠️ Aucun modèle à sauvegarder');
            return;
        }

        const modelName = name || `animal-identifier-${this.taskName}`;

        try {
            // Utiliser un IOHandler personnalisé pour capturer les données
            const siameseHandler = tf.io.withSaveHandler(
                async (artifacts) => artifacts
            );
            const featureHandler = tf.io.withSaveHandler(
                async (artifacts) => artifacts
            );

            const siameseArtifacts = await this.siameseModel.save(
                siameseHandler
            );
            const featureArtifacts = await this.featureExtractor.save(
                featureHandler
            );

            // Créer l'objet de données complet
            const modelData = {
                metadata: {
                    name: modelName,
                    taskName: this.taskName,
                    timestamp: new Date().toISOString(),
                    imageSize: this.imageSize,
                    featureSize: this.featureSize,
                    trainingPairsCount: this.trainingPairs.length,
                    comparisonCount: this.comparisonCount,
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
            this.saveTrainingPairs();

            console.log(`💾 Modèle sauvegardé: ${modelName}.json`);
            console.log(
                '📁 Le fichier sera téléchargé dans votre dossier de téléchargements'
            );
        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
        }
    }

    saveTrainingPairs() {
        try {
            localStorage.setItem(
                this.#localStorageKey,
                JSON.stringify(this.#pairsArrayForSaving)
            );
            console.log("💾 Paires d'entraînement sauvegardées");
        } catch (error) {
            console.error(
                "❌ Erreur sauvegarde des paires d'entraînement:",
                error
            );
        }
    }

    /**
     * Load a model from a JSON file or data
     *
     * @description If jsonData is null, it will prompt the user to select a JSON
     *
     * @param jsonData - Optional JSON data to load the model from
     * @returns {Promise<boolean>} - Returns true if the model was loaded successfully, false otherwise
     */
    async loadModel(jsonData = null) {
        try {
            if (!jsonData) {
                return await this.createFileHandler();
            } else {
                return await this.loadModelFromData(jsonData);
            }
        } catch (error) {
            return error;
        }
    }

    async createFileHandler() {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const target = e.target;
                const file = target.files[0];

                try {
                    if (!target || !target.files || !file) {
                        throw new Error('Aucun fichier sélectionné');
                    }

                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        const result = e.target?.result;
                        try {
                            if (
                                !result ||
                                typeof result !== 'string' ||
                                file.type !== 'application/json'
                            ) {
                                throw new Error(
                                    "Ce fichier n'est pas un compatible JSON"
                                );
                            }
                            const data = JSON.parse(result);
                            const status = await this.loadModelFromData(data);
                            if (status) {
                                resolve({ status: true, error: null });
                            } else {
                                throw new Error(
                                    'Échec du chargement du modèle'
                                );
                            }
                        } catch (error) {
                            reject({
                                status: false,
                                error:
                                    'Erreur lors de la lecture du fichier : ' +
                                    error.message,
                            });
                        }
                    };
                    reader.onerror = () => {
                        reject({
                            status: false,
                            error: 'Erreur de lecture du fichier',
                        });
                    };
                    reader.readAsText(file);
                } catch (error) {
                    reject({
                        status: false,
                        error:
                            '❌ Erreur dans le chargement de votre fichier JSON: ' +
                            error.message,
                    });
                }
            };
            input.click();
        });
    }

    // Charger un modèle depuis les données JSON
    async loadModelFromData(modelData) {
        try {
            // Vérifier la structure des données
            if (!modelData.siameseModel || !modelData.featureExtractor) {
                throw new Error('Structure de données invalide');
            }

            // Restaurer les métadonnées si disponibles
            if (modelData.metadata) {
                this.taskName = modelData.metadata.taskName || this.taskName;
                this.imageSize = modelData.metadata.imageSize || this.imageSize;
                this.featureSize =
                    modelData.metadata.featureSize || this.featureSize;
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
                    convertedBy: 'AnimalIdentificationTF',
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
                    convertedBy: 'AnimalIdentificationTF',
                    userDefinedMetadata: {},
                }),
            };

            console.log('🔄 Chargement du feature extractor...');
            this.featureExtractor = await tf.loadLayersModel(featureHandler);
            console.log('✅ Feature extractor chargé');

            console.log('🔄 Chargement du modèle siamois...');
            this.siameseModel = await tf.loadLayersModel(siameseHandler);
            console.log('✅ Modèle siamois chargé');

            this.siameseModel.compile({
                optimizer: tf.train.adam(0.0001),
                loss: 'binaryCrossentropy',
                metrics: ['accuracy'],
            });

            this.isInitialized = true;
            const modelName = modelData.metadata?.name || 'modèle-chargé';

            // this.loadData();

            console.log(`📂 Modèle chargé avec succès: ${modelName}`);
            return true;
        } catch (error) {
            console.error('❌ Impossible de charger le modèle:', error);
            return false;
        }
    }

    async loadData() {
        try {
            const trainingPairs = JSON.parse(
                localStorage.getItem(this.#localStorageKey)
            );

            if (!trainingPairs) {
                throw new Error(
                    "Aucune paire d'entraînement trouvée dans le stockage local"
                );
            }

            await Promise.all(
                trainingPairs.map(async (element) => {
                    const { image1Url, image2Url, isSameAnimal } = element;
                    const img1 = await this.loadImageElement(image1Url);
                    const img2 = await this.loadImageElement(image2Url);
                    this.addTrainingPair([img1, img2], isSameAnimal);
                })
            );
            console.log(
                `📊 Paires d'entraînement restaurées: ${this.trainingPairs.length}`
            );
            this.getDataBalance();
        } catch (error) {
            console.error(error.message);
        }
    }

    loadImageElement(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    // Méthode utilitaire pour charger un modèle depuis le dossier data
    async loadModelFromFile(fileName) {
        try {
            const response = await fetch(`/data/${fileName}`);
            if (!response.ok) {
                throw new Error(`Fichier non trouvé: ${fileName}`);
            }
            const modelData = await response.json();
            return await this.loadModelFromData(modelData);
        } catch (error) {
            console.error(
                `❌ Erreur lors du chargement de ${fileName}:`,
                error
            );
            return false;
        }
    }

    // Exporter les données d'entraînement au format JSON
    exportTrainingData(name = null) {
        const dataName = name || `training-data-${this.taskName}`;
        const trainingData = {
            metadata: {
                name: dataName,
                taskName: this.taskName,
                timestamp: new Date().toISOString(),
                imageSize: this.imageSize,
                totalPairs: this.trainingPairs.length,
            },
            balance: this.getDataBalance(),
            // Note: Les tensors ne peuvent pas être sérialisés directement
            // Cette méthode exporte uniquement les métadonnées
            pairsMetadata: this.trainingPairs.map((pair, index) => ({
                index,
                label: pair.label,
                labelText:
                    pair.label === 1 ? 'même animal' : 'animaux différents',
            })),
        };

        const jsonString = JSON.stringify(trainingData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`📊 Données d'entraînement exportées: ${dataName}.json`);
    }

    // Méthode de test pour vérifier l'intégrité du modèle chargé
    async testModelIntegrity() {
        if (
            !this.isInitialized ||
            !this.siameseModel ||
            !this.featureExtractor
        ) {
            console.log('⚠️ Modèle non initialisé');
            return false;
        }

        try {
            console.log("🔍 Test d'intégrité du modèle...");

            // Créer des tenseurs de test
            const testTensor1 = tf.randomNormal([
                1,
                this.imageSize,
                this.imageSize,
                3,
            ]);
            const testTensor2 = tf.randomNormal([
                1,
                this.imageSize,
                this.imageSize,
                3,
            ]);

            // Tester l'extracteur de features
            console.log("🧪 Test de l'extracteur de features...");
            const features1 = this.featureExtractor.predict(testTensor1);
            const features2 = this.featureExtractor.predict(testTensor2);

            console.log(`✅ Features extraites: [${features1.shape}]`);

            // Tester le modèle siamois
            console.log('🧪 Test du modèle siamois...');
            const similarity = this.siameseModel.predict([
                testTensor1,
                testTensor2,
            ]);
            const similarityValue = await similarity.data();

            console.log(
                `✅ Prédiction de similarité: ${similarityValue[0].toFixed(4)}`
            );

            // Nettoyer les tenseurs de test
            testTensor1.dispose();
            testTensor2.dispose();
            features1.dispose();
            features2.dispose();
            similarity.dispose();

            console.log("✅ Test d'intégrité réussi !");
            return true;
        } catch (error) {
            console.error("❌ Échec du test d'intégrité:", error);
            return false;
        }
    }

    async loadDefaultDataArray() {
        try {
            const defaultData = await import('../data/saved-array.json');
            if (!defaultData || !defaultData.default) {
                throw new Error(
                    '❌ Erreur lors du chargement des données par défaut'
                );
            }
            this.#defaultDataArray = defaultData.default;
            this.#pairsArrayForSaving = defaultData.default;
            this.saveTrainingPairs();
        } catch (error) {
            console.error('Error :', error);
        }
    }
}

/**
 * Init Global Animal Identification
 *
 * @description Will init once the page is fully loaded
 */
async function initAnimalIdentification() {
    if (!window.animalIdentifier) {
        try {
            window.animalIdentifier = new AnimalIdentificationTF(
                'pet-identification'
            );
            const success = await window.animalIdentifier.initializeModels();

            if (!success) {
                throw new Error(`❌ Échec de l'initialisation: ${success}`);
            }

            console.log("✅ Système d'identification prêt!");
            console.log('💡 Utilisez window.animalIdentifier pour interagir');
        } catch (error) {
            console.error(error);
        }
    } else {
        console.log("✅ Système d'identification déjà prêt!");
    }
}

// Page already loaded
if (document.readyState !== 'loading') {
    // initAnimalIdentification();
} else {
    // Not yet fully loaded, wait for DOMContentLoaded
    // document.addEventListener('DOMContentLoaded', initAnimalIdentification);
}
