/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ==============================================================================
 */

// Système avancé de classification d'images avec TensorFlow.js
// Permet l'entraînement interactif similaire aux captchas de Google

class ImageClassifierTF {
    constructor() {
        this.model = null;
        this.isTraining = false;
        this.trainingData = [];
        this.classes = ['incorrect', 'correct'];
        this.imageSize = 224;
    }

    // Créer et compiler le modèle CNN
    async createModel() {
        try {
            this.model = tf.sequential({
                layers: [
                    // Première couche de convolution
                    tf.layers.conv2d({
                        inputShape: [this.imageSize, this.imageSize, 3],
                        filters: 32,
                        kernelSize: 3,
                        activation: 'relu',
                        padding: 'same',
                    }),
                    tf.layers.maxPooling2d({ poolSize: 2 }),

                    // Deuxième couche de convolution
                    tf.layers.conv2d({
                        filters: 64,
                        kernelSize: 3,
                        activation: 'relu',
                        padding: 'same',
                    }),
                    tf.layers.maxPooling2d({ poolSize: 2 }),

                    // Troisième couche de convolution
                    tf.layers.conv2d({
                        filters: 128,
                        kernelSize: 3,
                        activation: 'relu',
                        padding: 'same',
                    }),
                    tf.layers.maxPooling2d({ poolSize: 2 }),

                    // Aplatir pour les couches denses
                    tf.layers.flatten(),

                    // Couches entièrement connectées
                    tf.layers.dense({
                        units: 128,
                        activation: 'relu',
                    }),
                    tf.layers.dropout({ rate: 0.5 }),

                    tf.layers.dense({
                        units: 64,
                        activation: 'relu',
                    }),
                    tf.layers.dropout({ rate: 0.3 }),

                    // Couche de sortie
                    tf.layers.dense({
                        units: this.classes.length,
                        activation: 'softmax',
                    }),
                ],
            });

            // Compiler le modèle
            this.model.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'sparseCategoricalCrossentropy',
                metrics: ['accuracy'],
            });

            console.log('✅ Modèle CNN créé avec succès');
            this.model.summary();
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de la création du modèle:', error);
            return false;
        }
    }

    // Préprocesser une image pour l'entraînement/prédiction
    preprocessImage(imageElement) {
        return tf.tidy(() => {
            // Convertir l'image en tensor
            const tensor = tf.browser
                .fromPixels(imageElement)
                .resizeNearestNeighbor([this.imageSize, this.imageSize])
                .toFloat()
                .div(255.0);

            // Normalisation avancée (optionnel)
            const mean = tensor.mean();
            const std = tensor.sub(mean).square().mean().sqrt();
            const normalized = tensor.sub(mean).div(std.add(1e-7));

            return normalized.expandDims(0);
        });
    }

    // Ajouter des données d'entraînement
    async addTrainingData(imageElement, isCorrect) {
        try {
            const preprocessed = this.preprocessImage(imageElement);
            const label = isCorrect ? 1 : 0;

            this.trainingData.push({
                image: preprocessed,
                label: label,
            });

            console.log(
                `📊 Données ajoutées: ${this.trainingData.length} échantillons`
            );

            // Entraîner automatiquement après avoir collecté suffisamment de données
            if (
                this.trainingData.length >= 8 &&
                this.trainingData.length % 4 === 0
            ) {
                await this.trainModel();
            }
        } catch (error) {
            console.error("❌ Erreur lors de l'ajout des données:", error);
        }
    }

    // Entraîner le modèle avec les données collectées
    async trainModel() {
        if (!this.model || this.trainingData.length < 4) {
            console.log("⚠️ Pas assez de données pour l'entraînement");
            return;
        }

        if (this.isTraining) {
            console.log('⚠️ Entraînement déjà en cours');
            return;
        }

        this.isTraining = true;
        console.log("🚀 Début de l'entraînement...");

        try {
            // Préparer les données
            const images = this.trainingData.map((item) => item.image);
            const labels = this.trainingData.map((item) => item.label);

            const xs = tf.concat(images);
            const ys = tf.tensor1d(labels, 'int32');

            // Entraîner le modèle
            const history = await this.model.fit(xs, ys, {
                epochs: 10,
                batchSize: Math.min(4, this.trainingData.length),
                validationSplit: 0.2,
                shuffle: true,
                verbose: 1,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        console.log(
                            `Epoch ${epoch + 1}: loss=${logs.loss.toFixed(
                                4
                            )}, accuracy=${logs.acc.toFixed(4)}`
                        );

                        // Mettre à jour l'affichage si l'élément existe
                        const outputDiv =
                            document.getElementById('micro-out-div');
                        if (outputDiv) {
                            outputDiv.innerHTML = `
                                <strong>Entraînement en cours...</strong><br>
                                Epoch: ${epoch + 1}/10<br>
                                Loss: ${logs.loss.toFixed(4)}<br>
                                Accuracy: ${(logs.acc * 100).toFixed(1)}%<br>
                                Données: ${
                                    this.trainingData.length
                                } échantillons
                            `;
                        }
                    },
                    onTrainEnd: () => {
                        const outputDiv =
                            document.getElementById('micro-out-div');
                        if (outputDiv) {
                            outputDiv.innerHTML = `
                                <strong>✅ Entraînement terminé!</strong><br>
                                Précision finale: ${(
                                    history.history.acc[
                                        history.history.acc.length - 1
                                    ] * 100
                                ).toFixed(1)}%<br>
                                Données utilisées: ${
                                    this.trainingData.length
                                } échantillons
                            `;
                        }
                    },
                },
            });

            // Nettoyer les tensors
            xs.dispose();
            ys.dispose();

            console.log('✅ Entraînement terminé avec succès');
            return history;
        } catch (error) {
            console.error("❌ Erreur lors de l'entraînement:", error);
        } finally {
            this.isTraining = false;
        }
    }

    // Faire une prédiction sur une nouvelle image
    async predict(imageElement) {
        if (!this.model) {
            console.log('⚠️ Modèle non initialisé');
            return null;
        }

        try {
            const preprocessed = this.preprocessImage(imageElement);
            const prediction = this.model.predict(preprocessed);
            const probabilities = await prediction.data();

            // Nettoyer
            preprocessed.dispose();
            prediction.dispose();

            return {
                incorrect: probabilities[0],
                correct: probabilities[1],
                prediction: probabilities[1] > 0.5 ? 'correct' : 'incorrect',
                confidence: Math.max(probabilities[0], probabilities[1]),
            };
        } catch (error) {
            console.error('❌ Erreur lors de la prédiction:', error);
            return null;
        }
    }

    // Réinitialiser le modèle et les données
    async reset() {
        // Nettoyer les tensors existants
        this.trainingData.forEach((item) => {
            if (item.image) {
                item.image.dispose();
            }
        });

        this.trainingData = [];

        // Recréer le modèle
        await this.createModel();

        console.log('🔄 Modèle réinitialisé');
    }

    // Sauvegarder le modèle
    async saveModel(name = 'image-classifier') {
        if (!this.model) {
            console.log('⚠️ Aucun modèle à sauvegarder');
            return;
        }

        try {
            // await this.model.save(`localstorage://${name}`);
            window.localStorage.setItem(name, JSON.stringify(this.model));
            console.log(`💾 Modèle sauvegardé: ${name}`);
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
        }
    }

    // Charger un modèle sauvegardé
    async loadModel(name = 'image-classifier') {
        try {
            const modelJSON = window.localStorage.getItem(name);
            if (modelJSON) {
                this.model = await tf.loadLayersModel(
                    tf.io.fromMemory(JSON.parse(modelJSON))
                );
                console.log(`📂 Modèle chargé: ${name}`);
                return true;
            }
        } catch (error) {
            console.log(`⚠️ Impossible de charger le modèle: ${name}`);
            return false;
        }
    }
}

// Initialiser le classificateur global
window.imageClassifier = new ImageClassifierTF();

// Fonction principale d'exécution
async function run() {
    console.log("🚀 Initialisation du classificateur d'images...");

    const success = await window.imageClassifier.createModel();

    if (success) {
        const outputDiv = document.getElementById('micro-out-div');
        if (outputDiv) {
            outputDiv.innerHTML = `
                <strong>🤖 Classificateur d'Images IA Prêt!</strong><br>
                <small>Modèle CNN initialisé avec succès</small><br>
                <small>Prêt pour l'entraînement interactif</small>
            `;
        }

        console.log("✅ Système prêt pour l'entraînement interactif!");
    } else {
        console.error("❌ Échec de l'initialisation");
    }
}

// Démarrer le système
run();
