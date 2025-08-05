import * as tf from "@tensorflow/tfjs";
import type {
   AddTrainingPairToModelProps,
   AddTrainingPairToModelResults,
   ArtifactProperties,
   CheckForErrorAndUpdateStateProps,
   CheckIfModelsFoundProps,
   CompareImagesProps,
   CompareImagesResults,
   CreateCompleteDataStructureProps,
   CreateCompleteDataStructureResults,
   CreateFeatureExtractorProps,
   CreateFeatureExtractorResult,
   CreateFeatureHandlerProps,
   CreatePropertiesFromItemProps,
   CreateSiameseModelProps,
   CreateSiameseModelResults,
   GetDataBalanceProps,
   GetDataBalanceResults,
   InitializeProps,
   InitializeResults,
   LoadImageElementProps,
   LoadModelFromDataProps,
   LoadModelFromDataResults,
   LoadStorageDataProps,
   LoadStorageDataResults,
   MetadataProperties,
   PairArrayForSaving,
   PreprocessImageProps,
   PreprocessImageResults,
   SaveModelArtifactsProps,
   SaveModelAsLocalProps,
   SaveModelAsLocalResults,
   SaveModelToFileProps,
   SaveModelToFileResults,
   TrainingPair,
   TrainModelProps,
   TrainModelResults,
} from "@/hooks/models/useAnimalIdentificationTypes.ts";
import type { CustomError } from "@/mainTypes.ts";
import {
   ARTIFACTS_PROPERTIES_FROM_ARTIFACTS,
   METADATA_PROPERTIES_FROM_CONFIG,
} from "@/configs/file.config.ts";
import { updateState, wait } from "@/lib/utils.ts";

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
   const savingPairs: PairArrayForSaving[] = [];
   try {
      if (!trainingPairs || trainingPairs.length === 0) {
         throw new Error(
            "Aucune paire d'entraînement trouvée dans le stockage local",
            {
               cause: {
                  status: 404,
                  message: "No training pairs found",
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

            if ("error" in pairs) {
               return Promise.reject(
                  new Error("Erreur d'ajout de tensor paires", {
                     cause: {
                        status: pairs.error.status || 500,
                        message: pairs.error.message || "Error loading pairs",
                     },
                  })
               );
            }
            tensorPairs.push(pairs.trainingPair as TrainingPair);
            savingPairs.push(pairs.pairArrayForSaving as PairArrayForSaving);
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
      img.crossOrigin = "anonymous";
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
         pairArrayForSaving: {
            image1Url: imgArray[0].src,
            image2Url: imgArray[1].src,
            isSameAnimal,
         },

         trainingPair: { image1: img1, image2: img2, label: label },
      };
   } catch (error) {
      return {
         error: {
            status: (error as CustomError).cause?.status || "500",
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

         tensor3d = tf.image.resizeBilinear(tensor3d, [imageSize, imageSize]);

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
                  (error as Error).message || "Image preprocessing failed",
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
 * >   "extractor": featureExtractor,
 * >   "success": true
 * > }
 *
 * > **Error case:**
 * > ```json
 * > {
 * >   "success": false
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
               activation: "relu",
               padding: "same",
            }),
            tf.layers.maxPooling2d({ poolSize: 2 }),
            tf.layers.dropout({ rate: 0.1 }),

            tf.layers.conv2d({
               filters: 64,
               kernelSize: 3,
               activation: "relu",
               padding: "same",
            }),
            tf.layers.maxPooling2d({ poolSize: 2 }),
            tf.layers.dropout({ rate: 0.15 }),

            tf.layers.conv2d({
               filters: 128,
               kernelSize: 3,
               activation: "relu",
               padding: "same",
            }),
            tf.layers.maxPooling2d({ poolSize: 2 }),
            tf.layers.dropout({ rate: 0.2 }),

            tf.layers.conv2d({
               filters: 256,
               kernelSize: 3,
               activation: "relu",
               padding: "same",
            }),
            tf.layers.globalAveragePooling2d({
               dataFormat: "channelsLast",
            }),

            tf.layers.dense({
               units: 512,
               activation: "relu",
            }),
            tf.layers.dropout({ rate: 0.3 }),

            tf.layers.dense({
               units: config.featureSize,
               activation: "tanh",
               name: "feature_embedding",
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
   if (tf.getBackend() === "webgl") {
      return;
   }
   tf.setBackend("webgl");
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
         name: "image_a",
      });
      const inputB = tf.input({
         shape: [config.imageSize, config.imageSize, 3],
         name: "image_b",
      });

      // Extraire les features des deux images
      const featuresA = featureExtractor.apply(inputA) as tf.SymbolicTensor;
      const featuresB = featureExtractor.apply(inputB) as tf.SymbolicTensor;

      // Concaténer les features des deux images
      const concatenated = tf.layers
         .concatenate({
            name: "features_concat",
         })
         .apply([featuresA, featuresB]);

      // Réseau de décision pour déterminer la similarité
      let decision = tf.layers
         .dense({
            units: 256,
            activation: "relu",
            name: "main_decision",
         })
         .apply(concatenated);

      decision = tf.layers
         .dropout({ rate: 0.3, name: "main_dropout" })
         .apply(decision);

      decision = tf.layers
         .dense({
            units: 128,
            activation: "relu",
            name: "secondary_decision",
         })
         .apply(decision);

      decision = tf.layers
         .dropout({ rate: 0.2, name: "secondary_dropout" })
         .apply(decision);

      decision = tf.layers
         .dense({
            units: 64,
            activation: "relu",
            name: "tertiary_decision",
         })
         .apply(decision);

      const prediction = tf.layers
         .dense({
            units: 1,
            activation: "sigmoid",
            name: "final_prediction",
         })
         .apply(decision);
      const siameseModel = tf.model({
         inputs: [inputA, inputB],
         outputs: prediction as tf.SymbolicTensor,
         name: "siamese_network",
      });

      siameseModel.compile({
         optimizer: config.optimizer || tf.train.adam(0.0001),
         loss: config.loss || "binaryCrossentropy",
         metrics: config.metrics || ["accuracy"],
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
 * > {
 * >   "siameseModel": "model",
 * >   "featureExtractor": "extractor",
 * >   "isInitialized": true
 * > }
 *
 * > **Error case:**
 * > ```json
 * > {
 * >   "error": {
 * >     "status": 500,
 * >     "message": "Feature extraction failed"
 * >   }
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
               message: "Already initialized",
            },
         });
      }

      tf.ready();

      // Backend setup
      setupOptimalBackend();

      const feature = createFeatureExtractor({
         config,
      });

      if (!feature.success || !("extractor" in feature)) {
         throw new Error(`Échec de l'initialisation: ${feature.success}`, {
            cause: {
               status: 500,
               message: "Feature extraction failed",
            },
         });
      }

      const siamese = createSiameseModel({
         config,
         featureExtractor: feature.extractor,
      });

      if (!siamese.success || !("siameseModel" in siamese)) {
         throw new Error(`Échec de l'initialisation: ${siamese}`, {
            cause: {
               status: 500,
               message: "Siamese model initialization failed",
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
 * @param setStatus - Setter for the `Status` State of the model.
 * @param initializeModel - A function to initialize the model if it is not already initialized.
 */
export async function trainModel({
   status,
   model,
   config = {},
   initializeModel,
   onEpochEnd,
}: TrainModelProps): Promise<TrainModelResults> {
   try {
      if (status.trainingPairs.length < 4) {
         throw new Error("Pas assez de paires pour l'entraînement", {
            cause: {
               status: 404,
               message:
                  "Not enough training pairs. At least 4 pairs are required",
            },
         });
      }
      if (status.loadingState.isLoading === "training") {
         throw new Error("Entraînement déjà en cours", {
            cause: {
               status: 409,
               message: "Training already in progress",
            },
         });
      }
      // No models found, initialize them
      if (
         !model.siameseModel ||
         !model.isInitialized ||
         !model.featureExtractor
      ) {
         // Try to initialize models
         initializeModel();
         // Throw error if not initialized
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
                  message: "Data imbalance detected",
               },
            }
         );
      }

      const images1: TrainingPair["image1"][] = [];
      const images2: TrainingPair["image2"][] = [];
      const labels: TrainingPair["label"][] = [];

      status.trainingPairs.forEach((pair) => {
         if (isTensor4D(pair.image1) && isTensor4D(pair.image2)) {
            images1.push(pair.image1);
            images2.push(pair.image2);
            labels.push(pair.label);
         }
      });

      const xs1 = tf.concat(images1 as tf.Tensor4D[]);
      const xs2 = tf.concat(images2 as tf.Tensor4D[]);

      const ys = tf.tensor1d(labels, "float32");

      if (!model.siameseModel) {
         throw new Error("Le modèle Siamese non initialisé", {
            cause: {
               status: 500,
               message: "Siamese model is not found",
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
               if (logs) onEpochEnd(epoch, logs);
            },
         },
      });

      xs1.dispose();
      xs2.dispose();
      ys.dispose();

      return {
         loadingState: {
            message: "Entraînement du modèle terminé",
            isLoading: "done",
            type: "training",
         },
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
 * >   "error": {
 * >     "status": 404,
 * >     "message": "Siamese model not found"
 * >   }
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
      if (!model.isInitialized) {
         initializeModel();
         checkIfInitialized(model.isInitialized);
      }

      if (imageArray.length !== 2) {
         throw new Error("Deux images sont nécessaires pour la comparaison", {
            cause: {
               status: 400,
               message: "Bad Request, you need two images",
            },
         });
      }

      const img1 = preprocessImage({ imageElement: imageArray[0], config });
      const img2 = preprocessImage({ imageElement: imageArray[1], config });

      if (!model.siameseModel) {
         throw new Error("Modèle Siamese non trouvé", {
            cause: {
               status: 404,
               message: "Siamese model not found",
            },
         });
      }

      if (!isTensor4D(img1) || !isTensor4D(img2)) {
         throw new Error("Erreur de prétraitement des images", {
            cause: {
               status: 500,
               message: "Image preprocessing failed, ensure images are tensors",
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

/**
 * Save training pairs to local storage.
 *
 * @description This function saves the training pairs to local storage.
 *
 * @param config - The configuration object for the model, including local storage key.
 * @param status - The current status of the model, including pairs to be saved.
 * @return An object containing the status and message of the save operation.
 * @ThrowsError If an error occurs during the save operation.
 *
 * @example
 * > **Successful result:**
 * > ```json
 * > {
 * >   "status": 200,
 * >   "message": "Paires d’entraînement sauvegardées avec succès"
 * > }
 *
 * > **Error case:**
 * > ```json
 * > {
 * >   "error": {
 * >     "status": 404,
 * >     "message": "Aucune paire d'entraînement à sauvegarder"
 * >   }
 * > }
 * ```
 */
// export function saveTrainingPairs({
//     config,
//     status,
// }: SaveTrainingPairsProps): SaveModelAsLocalResults {
//     try {
//         if (
//             !status.pairsArrayForSaving ||
//             status.pairsArrayForSaving.length === 0
//         ) {
//             throw new Error("Aucune paire d'entraînement à sauvegarder", {
//                 cause: {
//                     status: 404,
//                     message: 'No training pairs to save were found',
//                 },
//             });
//         }

//         localStorage.setItem(
//             config.localStorageKey,
//             JSON.stringify(status.pairsArrayForSaving)
//         );
//         return {
//             status: 200,
//             message: 'Sauvegarde locale des paires d’entraînement réussie',
//         };
//     } catch (error) {
//         return {
//             error: {
//                 status: (error as CustomError).cause?.status || 500,
//                 message:
//                     (error as CustomError).cause?.message ||
//                     "Erreur lors de la sauvegarde des paires d'entraînement",
//             },
//         };
//     }
// }

/**
 * Capture model data artifacts.
 *
 * @param modelTosave - The model for capturing model data artifacts.
 * @returns A promise that resolves to the captured model data artifacts.
 */
export async function captureModelArtifacts({
   modelTosave,
}: SaveModelArtifactsProps): Promise<tf.io.ModelArtifacts> {
   const handler = tf.io.withSaveHandler(
      async (artifacts: tf.io.ModelArtifacts) => ({
         modelArtifactsInfo: {
            dateSaved: new Date(),
            modelTopologyType: "JSON",
         },
         ...artifacts,
      })
   );
   return (await modelTosave.save(handler)) as tf.io.ModelArtifacts;
}

/**
 * Save training pairs to local storage.
 *
 * @description This function saves the model as a JSON file,
 * including metadata and model artifacts.
 * It also saves the training pairs to local storage.
 *
 * @param status - The current status of the model, including training pairs and comparisons.
 * @param model - The model object containing the Siamese model and feature extractor.
 * @param config - The configuration object for the model, including task name and image size.
 *
 * @returns An object containing the status and message of the save operation.
 * @example
 * > **Successful result:**
 * > ```json
 * > {
 * >   "status": 200,
 * >   "message": "Modèle sauvegardé avec succès"
 * > }
 * > ```
 *
 * > **Error case:**
 * > ```json
 * > {
 * >   "error": {
 * >     "status": 404,
 * >     "message": "Aucune paire d'entraînement à sauvegarder"
 * >   }
 * > }
 * ```
 */
export function saveModelAsLocal({
   status,
   model,
   config,
   silentSave = false,
}: SaveModelAsLocalProps): SaveModelAsLocalResults {
   try {
      // Throws error if model is not initialized
      checkIfInitialized(model.isInitialized);

      if (
         !silentSave &&
         (!status.pairsArrayForSaving ||
            status.pairsArrayForSaving.length === 0)
      ) {
         throw new Error("Aucune paire d'entraînement à sauvegarder", {
            cause: {
               status: 404,
               message: "No training pairs to save were found",
            },
         });
      }

      localStorage.setItem(
         config.localStorageKey,
         JSON.stringify(status.pairsArrayForSaving)
      );

      return {
         status: 200,
         message: "Sauvegarde locale des paires d'entraînement réussie",
      };
   } catch (error) {
      console.log(error);
      return {
         error: {
            status: (error as CustomError).cause?.status || 500,
            message:
               (error as CustomError).cause?.message ||
               "Erreur lors de la sauvegarde du modèle",
         },
      };
   }
}

/**
 * Prepares the model data structure for saving to a file.
 *
 * @description This function creates a complete data structure for the model,
 * including metadata, model artifacts, and training pairs.
 *
 * @param config - The configuration object for the model, including task name and image size.
 * @param status - The current status of the model, including training pairs and comparisons.
 * @param name - The name of the model to be saved.
 * @param model - The model object containing the Siamese model and feature extractor.
 * @returns A promise that resolves to the model data structure ready for saving.
 * @throws {Error} If the model is not initialized or if an error occurs while saving artifacts.
 * @example
 *
 * >**Successful result:**
 * >```ts
 * > {
 * >    "modelData": {
 * >      "metadata": {
 * >        "name": "IAModelSave",
 * >        "timestamp": "2023-10-01T12:00:00Z",
 * >        "trainingPairsCount": 10,
 * >        "imageSize": 224,
 * >        "taskName": "Animal Identification",
 * >        "comparisonCount": 5
 * >      },
 * >      "siameseModel": {
 * >        "weightData": "base64_encoded_data",
 * >        "modelTopology": {},
 * >        "weightSpecs": []
 * >      },
 * >      "featureExtractor": {
 * >        "weightData": "base64_encoded_data",
 * >        "modelTopology": {},
 * >        "weightSpecs": []
 * >      }
 * >    },
 * >    "status": 200,
 * >    "message": "Modèle sauvegardé avec succès",
 * >    "type": "savingToFile"
 * > }
 *
 * >**Error case:**
 * >```ts
 * > {
 * >   "error": {
 * >     "status": 404,
 * >     "message": "Aucune paire d'entraînement à sauvegarder",
 * >     "type": "savingToFile"
 * >   }
 * > }
 * ```
 */
export async function saveModelToFile({
   status,
   name = "IAModelSave",
   model,
   config,
}: SaveModelToFileProps): Promise<SaveModelToFileResults> {
   try {
      checkIfInitialized(model.isInitialized);
      checkIfModelsFound({
         siameseModel: model.siameseModel,
         featureExtractor: model.featureExtractor,
      });

      const modelName = name || config.taskName;

      // Data capture for the models
      const siameseArtifacts = await captureModelArtifacts({
         modelTosave: model.siameseModel!,
      });
      const featureArtifacts = await captureModelArtifacts({
         modelTosave: model.featureExtractor!,
      });
      if (!siameseArtifacts || !featureArtifacts) {
         throw new Error("Échec de la sauvegarde des artefacts du modèle", {
            cause: {
               status: 500,
               message: "Failed to save model artifacts",
            },
         });
      }
      // Create object to save
      const modelData = createCompleteDataStructure({
         siameseArtifacts,
         featureArtifacts,
         config,
         status,
         modelName,
      });

      if ("error" in modelData) {
         throw new Error("Échec de la création de la structure de données", {
            cause: {
               status: 500,
               message: "Failed to create model data structure",
            },
         });
      }

      return {
         modelData,
         status: 200,
         message: "Modèle sauvegardé avec succès",
         type: "savingToFile",
      };
   } catch (error) {
      return {
         error: {
            type: "savingToFile",
            status: (error as CustomError).cause?.status || 500,
            message:
               (error as CustomError).cause?.message ||
               "Erreur lors de la sauvegarde du modèle",
         },
      };
   }
}

/**
 * Creates a complete data structure for the model.
 * ready to be saved or used in JSON Format.
 *
 * @description This function creates a complete data structure for the model,
 *
 * @param siameseArtifacts - The artifacts of the Siamese model.
 * @param featureArtifacts - The artifacts of the feature extractor model.
 * @param config - The configuration object for the model.
 * @param status - The current status of the model, including training pairs and comparisons.
 * @param modelName - The name of the model.
 *
 * @returns The complete data structure for the model.
 */
function createCompleteDataStructure({
   siameseArtifacts,
   featureArtifacts,
   config,
   status,
   modelName,
}: CreateCompleteDataStructureProps): CreateCompleteDataStructureResults {
   try {
      // Attributes to save
      const metadataProperties = createPropertiesFromItem({
         item: config,
         configVariable: METADATA_PROPERTIES_FROM_CONFIG,
      });
      const siameseProperties = createPropertiesFromItem({
         item: siameseArtifacts,
         configVariable: ARTIFACTS_PROPERTIES_FROM_ARTIFACTS,
      });
      const featureProperties = createPropertiesFromItem({
         item: featureArtifacts,
         configVariable: ARTIFACTS_PROPERTIES_FROM_ARTIFACTS,
      });

      const modelData = {
         metadata: {
            name: modelName,
            timestamp: new Date().toISOString(),
            trainingPairsCount: status.trainingPairs.length,
            comparisonCount: status.comparisonCount,
            ...metadataProperties,
         },
         siameseModel: {
            weightData: arrayBufferToBase64(
               siameseArtifacts.weightData as ArrayBuffer
            ),
            // weightData: Array.from(
            //     new Uint8Array(siameseArtifacts.weightData)
            // ),
            // weightData: btoa(
            //     String.fromCharCode(
            //         ...new Uint8Array(
            //             siameseArtifacts.weightData as ArrayBuffer
            //         )
            //     )
            // ),
            ...siameseProperties,
         },
         featureExtractor: {
            weightData: arrayBufferToBase64(
               featureArtifacts.weightData as ArrayBuffer
            ),

            // weightData: Array.from(
            //     new Uint8Array(featureArtifacts.weightData)
            // ),
            // weightData: btoa(
            //     String.fromCharCode(
            //         ...new Uint8Array(
            //             featureArtifacts.weightData as ArrayBuffer
            //         )
            //     )
            // ),
            ...featureProperties,
         },
      };
      return modelData;
   } catch (error) {
      return {
         error: {
            message: (error as CustomError).message || "Erreur inconnue",
            status: 500,
         },
      };
   }
}

/**
 * Converts an ArrayBuffer to a Base64 string.
 *
 * @param buffer - The ArrayBuffer to convert.
 * @returns The Base64 string representation of the ArrayBuffer.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
   let binary = "";
   const bytes = new Uint8Array(buffer);
   const chunkSize = 0x8000; // 32k
   for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(
         null,
         Array.from(bytes.subarray(i, i + chunkSize))
      );
   }
   return btoa(binary);
}

/**
 * Returns a record of properties from the item based on the provided configuration variable.
 *
 * @param item - The item from which to create properties.
 * @description This function creates properties from the item based on the provided configuration variable.
 * It filters the item's properties to include only those that are present in the config variable.
 * @param configVariable - The configuration variable that determines which properties to include.
 * @returns A record containing the filtered properties.
 */
function createPropertiesFromItem({
   item,
   configVariable,
}: CreatePropertiesFromItemProps): Partial<
   ArtifactProperties | MetadataProperties
> {
   return Object.fromEntries(
      Object.entries(item).filter(([key]) =>
         configVariable.includes(key as (typeof configVariable)[number])
      )
   );
}

/**
 * Checks for errors in the results and updates the state accordingly.
 *
 * @description A small `Timeout 100ms` is added to ensure
 * the loader can be displayed in certain circumstances.
 *
 * @param results - The results object containing the data to update the state.
 * @param setStatus - The setter function to update the state.
 * @param newValues - Additional values to merge into the results before updating the state.
 * @returns A promise that resolves when the state is updated.
 */
export async function checkForErrorAndUpdateState<
   T extends Record<string, unknown>
>({
   results,
   setStatus,
   newValues = {},
}: CheckForErrorAndUpdateStateProps<T>): Promise<void> {
   if ("error" in results) {
      // Ensure the loader can be displayed
      // in certain circumstances
      await wait(100);
      updateState(
         {
            ...results,
         },
         setStatus
      );
      return;
   }
   updateState(
      {
         ...results,
         ...newValues,
      },
      setStatus
   );
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
 * @throwsError `400` If the model is not initialized.
 */
export function checkIfInitialized(isInitialized = false) {
   if (!isInitialized) {
      throw new Error("Système d'identification non initialisé", {
         cause: {
            status: 400,
            message: "System not initialized",
         },
      });
   }
}

/**
 * Checks if the siamese & feature extractor models are found.
 *
 * @param siameseModel - Siamese model.
 * @param featureExtractor - Feature extractor.
 * @throwsError `404` If the models are not found.
 */
export function checkIfModelsFound({
   siameseModel,
   featureExtractor,
}: CheckIfModelsFoundProps) {
   console.log(siameseModel, featureExtractor);
   if (!siameseModel || !featureExtractor) {
      throw new Error("Modèles non trouvés", {
         cause: {
            status: 404,
            message: "Models not found",
         },
      });
   }
}

export async function loadModelFromData({
   data,
   config,
}: LoadModelFromDataProps): Promise<LoadModelFromDataResults> {
   try {
      // Restaurer les métadonnées si disponibles
      if (!("metadata" in data)) {
         throw new Error("Aucune métadonnée trouvée dans les données", {
            cause: {
               status: 404,
               message: "Metadata not found",
            },
         });
      }

      // Vérifier la structure des données
      checkIfModelsFound({
         siameseModel: data.siameseModel,
         featureExtractor: data.featureExtractor,
      });

      config.taskName = data.metadata.taskName || config.taskName;
      config.imageSize = data.metadata.imageSize || config.imageSize;
      config.featureSize = data.metadata.featureSize || config.featureSize;

      const siameseWeightData = base64ToArrayBuffer(
         data.siameseModel.weightData
      );
      const featureWeightData = base64ToArrayBuffer(
         data.featureExtractor.weightData
      );

      // Créer des IOHandlers personnalisés pour le chargement
      const featureHandler = createFeatureHandler({
         weightData: featureWeightData,
         data: data.featureExtractor,
         metadata: data.metadata,
      });
      const siameseHandler = createFeatureHandler({
         weightData: siameseWeightData,
         data: data.siameseModel,
         metadata: data.metadata,
      });

      const featureExtractor = await tf.loadLayersModel(featureHandler);
      const siameseModel = await tf.loadLayersModel(siameseHandler);

      siameseModel.compile({
         optimizer: config.optimizer || tf.train.adam(0.0001),
         loss: config.loss || "binaryCrossentropy",
         metrics: config.metrics || ["accuracy"],
      });

      const modelName = data.metadata?.name || "modèle-chargé";

      return {
         status: 200,
         message: "Modèle chargé avec succès",
         siameseModel,
         featureExtractor,
         modelName,
      };
   } catch (error) {
      return {
         error: {
            message:
               (error as CustomError).cause?.message ||
               `Erreur lors du chargement du modèle: ${
                  error as Error
               }.message}`,
            status: (error as CustomError).cause?.status || 500,
         },
      };
   }
}

/**
 * Converts a Base64 string to an ArrayBuffer.
 *
 * @description This is used to convert the weight data from Base64 to ArrayBuffer format.
 *
 * @param base64 - The Base64 string to convert.
 * @returns The converted ArrayBuffer.
 */
function base64ToArrayBuffer(base64: number[]): ArrayBuffer {
   return new Uint8Array(base64).buffer;
}

/**
 * Creates a feature handler for loading the feature extractor model.
 *
 * @param featureArtifacts - The artifacts of the feature extractor model.
 * @param data - The data containing the feature extractor model topology and weight specs.
 * @description This function creates a feature handler for loading the feature extractor model.
 * @returns
 */
function createFeatureHandler({
   weightData,
   data,
   metadata = {},
}: CreateFeatureHandlerProps): tf.io.IOHandler | void {
   if ("error" in data) return;

   return {
      load: async () => ({
         modelTopology: data.modelTopology,
         weightSpecs: data.weightSpecs,
         weightData: weightData,
         format: "layers-model",
         generatedBy: "TensorFlow.js",
         convertedBy: "useAnimalIdentificationHook",
         userDefinedMetadata: { ...metadata },
      }),
   };
}
