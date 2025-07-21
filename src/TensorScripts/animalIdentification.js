/**
 * Système d'identification d'animaux avec TensorFlow.js
 * Utilise un réseau siamois pour comparer si deux images contiennent le même animal
 */

class AnimalIdentificationTF {
    #localStorageKey = 'pair-array';
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

        console.log("🏗️ Système d'identification d'animaux initialisé");
    }

    // Configurer le backend optimal avec fallback
    async setupOptimalBackend() {
        try {
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
    async createSiameseModel() {
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

        try {
            // Attendre que TensorFlow soit complètement prêt
            await tf.ready();
            console.log(`Backend actif: ${tf.getBackend()}`);

            // Configuration backend avec gestion d'erreur
            await this.setupOptimalBackend();

            const featureSuccess = await this.createFeatureExtractor();
            if (!featureSuccess) return false;

            const siameseSuccess = await this.createSiameseModel();
            if (siameseSuccess) {
                this.isInitialized = true;
                console.log('✅ Modèles initialisés avec succès');
            }
            return siameseSuccess;
        } catch (error) {
            console.error(
                "❌ Erreur lors de l'initialisation des modèles:",
                error
            );
            return false;
        }
    }

    // Préprocesser une image
    preprocessImage(imageElement, augment = false) {
        return tf.tidy(() => {
            let tensor = tf.browser.fromPixels(imageElement);

            tensor = tf.image.resizeBilinear(tensor, [
                this.imageSize,
                this.imageSize,
            ]);

            tensor = tensor.toFloat();

            // Augmentation simple si demandée
            if (augment && Math.random() < 0.5) {
                const withBatch = tensor.expandDims(0);
                const flipped = tf.image.flipLeftRight(withBatch);
                tensor = flipped.squeeze(0);
            }

            // Normalisation
            tensor = tensor.div(255.0);
            tensor = tensor.sub([0.485, 0.456, 0.406]);
            tensor = tensor.div([0.229, 0.224, 0.225]);

            return tensor.expandDims(0);
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
            console.log('🔄 Initialisation des modèles...');
            const initSuccess = await this.initializeModels();
            if (!initSuccess) {
                console.error("❌ Échec de l'initialisation des modèles");
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

        const params = {
            epochs: 20,
            batchSize: Math.max(
                2,
                Math.min(8, Math.floor(this.trainingPairs.length / 4))
            ),
            validationSplit: 0.15,
            ...config,
        };

        try {
            const images1 = this.trainingPairs.map((pair) => pair.image1);
            const images2 = this.trainingPairs.map((pair) => pair.image2);
            const labels = this.trainingPairs.map((pair) => pair.label);

            const xs1 = tf.concat(images1);
            const xs2 = tf.concat(images2);
            const ys = tf.tensor1d(labels, 'float32');

            const history = await this.siameseModel.fit([xs1, xs2], ys, {
                epochs: params.epochs,
                batchSize: params.batchSize,
                validationSplit: params.validationSplit,
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
            console.error("❌ Erreur lors de l'entraînement:", error);
        } finally {
            this.isTraining = false;
        }
    }

    // Comparer deux images
    async compareAnimals(imageArray) {
        // async compareAnimals(image1Element, image2Element) {
        if (!this.siameseModel || !this.isInitialized) {
            console.log('⚠️ Modèle siamois non initialisé, initialisation...');
            const initSuccess = await this.initializeModels();
            if (!initSuccess) {
                console.error("❌ Impossible d'initialiser le modèle");
                return null;
            }
        }

        try {
            const img1 = this.preprocessImage(imageArray[0], false);
            const img2 = this.preprocessImage(imageArray[1], false);

            const prediction = this.siameseModel.predict([img1, img2]);
            const similarity = await prediction.data();

            img1.dispose();
            img2.dispose();
            prediction.dispose();

            const score = similarity[0];
            this.comparisonCount++;

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

        await this.initializeModels();
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
            localStorage.setItem(
                this.#localStorageKey,
                JSON.stringify(this.trainingPairs)
            );

            console.log(`💾 Modèle sauvegardé: ${modelName}.json`);
            console.log(
                '📁 Le fichier sera téléchargé dans votre dossier de téléchargements'
            );
        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
        }
    }

    // Charger un modèle depuis un fichier JSON
    async loadModel(jsonData = null) {
        try {
            if (!jsonData) {
                // Créer un input file pour sélectionner le fichier JSON
                return new Promise((resolve, reject) => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = async (event) => {
                        const target = event.target;
                        if (!target || !target.files) {
                            reject(new Error('Aucun fichier sélectionné'));
                            return;
                        }

                        const file = target.files[0];
                        if (!file) {
                            reject(new Error('Aucun fichier sélectionné'));
                            return;
                        }

                        console.log(`📁 Chargement du fichier: ${file.name}`);

                        const reader = new FileReader();
                        reader.onload = async (e) => {
                            try {
                                const result = e.target?.result;
                                if (typeof result !== 'string') {
                                    throw new Error(
                                        'Erreur de lecture du fichier'
                                    );
                                }

                                console.log('🔄 Analyse du fichier JSON...');
                                const data = JSON.parse(result);
                                console.log(
                                    '✅ JSON analysé, chargement du modèle...'
                                );

                                const success = await this.loadModelFromData(
                                    data
                                );
                                resolve(success);
                            } catch (error) {
                                console.error(
                                    "❌ Erreur lors de l'analyse JSON:",
                                    error
                                );
                                reject(error);
                            }
                        };
                        reader.onerror = () => {
                            reject(new Error('Erreur de lecture du fichier'));
                        };
                        reader.readAsText(file);
                    };
                    input.click();
                });
            } else {
                return await this.loadModelFromData(jsonData);
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement:', error);
            return false;
        }
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
            const trainingPairs = JSON.parse(
                localStorage.getItem(this.#localStorageKey)
            );
            if (trainingPairs) {
                this.trainingPairs = trainingPairs;
                console.log(
                    `📊 Paires d'entraînement restaurées: ${this.trainingPairs.length}`
                );
            } else {
                console.log("📊 Aucune paire d'entraînement restaurée");
            }
            console.log(`📂 Modèle chargé avec succès: ${modelName}`);
            return true;
        } catch (error) {
            console.error('❌ Impossible de charger le modèle:', error);
            return false;
        }
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
}

// Initialiser le système d'identification global
window.animalIdentifier = new AnimalIdentificationTF('pet-identification');

// Auto-initialiser les modèles avec délai approprié
async function initAnimalIdentification() {
    try {
        // Attendre un peu pour s'assurer que TensorFlow.js est complètement chargé
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const success = await window.animalIdentifier.initializeModels();

        if (success) {
            console.log("✅ Système d'identification prêt!");
            console.log('💡 Utilisez window.animalIdentifier pour interagir');
        } else {
            console.error("❌ Échec de l'initialisation");
        }
    } catch (error) {
        console.error("❌ Erreur d'initialisation:", error);
    }
}

// Démarrer après le chargement complet de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimalIdentification);
} else {
    // Si la page est déjà chargée, attendre un peu puis initialiser
    setTimeout(initAnimalIdentification, 1000);
}
