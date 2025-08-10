import * as tf from "@tensorflow/tfjs";
import { MODEL_LOADER_ID } from "@/configs/toaster.config.ts";
import {
   addTrainingPairToModel,
   checkForErrorAndUpdateState,
   compareImages,
   getDataBalance,
   initialize,
   loadModelFromData,
   loadStorageData,
   saveModelToFile,
   savePairsAsLocal,
   trainModel,
} from "@/hooks/models/modelHookFunctions.ts";
import type {
   AddTrainingPairCallBackProps,
   AnimalIdentification,
   CompareImagesProps,
   ConfigTypes,
   ModelTypes,
   PairArrayForSaving,
   SaveSelectionToLocalStorageProps,
   StatusTypes,
   TrainingPair,
} from "@/hooks/models/types/useAnimalIdentificationTypes";
import { updateState, wait } from "@/lib/utils.ts";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

/**
 * Custom hook for animal identification functionality.
 *
 * @description Provides methods to initialize the model, add training pairs, train the model,
 * compare animals, find matches, reset the model, save and load the model.
 *
 * @returns {AnimalIdentification} The animal identification model and its methods.
 */
export function useAnimalIdentification(): AnimalIdentification {
   const [model, setModel] = useState<ModelTypes>({
      isInitialized: false,
      featureExtractor: null!,
      siameseModel: null!,
   });

   const [status, setStatus] = useState<StatusTypes>({
      loadingState: {
         message: "Initialisation du modèle",
         isLoading: "initializing",
         type: "initializing",
      },
      siameseModelInitialized: false,
      featureExtractorInitialized: false,
      localStorageDataLoaded: false,
      trainingPairs: [],
      comparisonCount: 0,
      accuracy: 0,
      pairsArrayForSaving: [],
      balance: { positive: 0, negative: 0, total: 0 },
      similarityScore: 0,
      sameAnimal: false,
      confidence: 0,
      trainEpochCount: 0,
      loss: 0,
      error: {
         status: "",
         message: "",
      },
   });
   const configRef = useRef<ConfigTypes>({
      featureSize: 256,
      imageSize: 224,
      localStorageKey: "pair-array",
      augment: true,
      epochs: 10,
      batchSize: 4,
      validationSplit: 0.2,
      learningRate: 0.001,
      optimizer: "adam",
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
      predictionThreshold: 0.7,
      taskName: "task",
   });
   const statusRef = useRef(status);

   /**
    * Initialize the animal identification model.
    */
   const initializeModel = useCallback(() => {
      if (!model.isInitialized) {
         const results = initialize({
            config: configRef.current,
            isInitialized: model.isInitialized,
         });

         if (results) {
            setModel((prev) => ({
               ...prev,
               ...results,
            }));
            checkForErrorAndUpdateState({
               results,
               setStatus,
               successValues: {
                  siameseModelInitialized: true,
                  featureExtractorInitialized: true,
                  loadingState: {
                     message: "Modèle initialisé",
                     isLoading: "done",
                     type: "initializing",
                  },
               },
            });
         }
      }
   }, [model.isInitialized]);

   /**
    * This will start training the model.
    * It checks if the model is initialized and if the training state is not already training
    */
   const startModelTraining = useCallback(async () => {
      if (!model.isInitialized) {
         updateState(
            {
               error: {
                  status: "error",
                  message: "Le modèle n'est pas initialisé",
               },
            },
            setStatus
         );
         return;
      }

      if (statusRef.current.loadingState.isLoading !== "training") {
         updateState(
            {
               loadingState: {
                  message: "Début de l'entraînement...",
                  isLoading: "training",
                  type: "training",
               },
            },
            setStatus
         );
      }

      const result = await trainModel({
         status: statusRef.current,
         model,
         config: configRef.current,
         initializeModel,
         // onEpochEnd will update the state on each epoch end
         onEpochEnd: (epoch, logs) => {
            updateState(
               {
                  trainEpochCount: epoch + 1,
                  loss: logs.loss,
                  accuracy:
                     typeof logs.acc === "number"
                        ? (logs.acc * 100).toFixed(1)
                        : "N/A",
               },
               setStatus
            );
         },
      });

      if (result) {
         checkForErrorAndUpdateState({
            results: result,
            setStatus,
         });
      }
   }, [model]);

   /**
    * Compares two images to identify if
    * they belong to the same animal.
    *
    * @param imagesArray - An array containing two image elements.
    * @return A promise that resolves to the comparison result.
    * `exemple : { similarityScore: 0.85, sameAnimal: true, confidence: 0.7 }`
    */
   const compareAnimals = useCallback(
      async (imagesArray: CompareImagesProps["imageArray"]) => {
         if (statusRef.current.loadingState.isLoading !== "training") {
            updateState(
               {
                  loadingState: {
                     message: "Comparaison des images...",
                     isLoading: "comparison",
                     type: "comparison",
                  },
               },
               setStatus
            );
         }
         // Avoid the first lag
         if (statusRef.current.comparisonCount === 0) await wait(100);

         const results = await compareImages({
            imageArray: imagesArray,
            config: configRef.current,
            model,
            initializeModel,
         });

         if (results) {
            // Useful in the event of a huge predict task
            await wait(100);

            checkForErrorAndUpdateState({
               results,
               setStatus,
               successValues: {
                  comparisonCount: (statusRef.current.comparisonCount += 1),
                  ...results,
                  loadingState: {
                     message: `Comparaison ${(statusRef.current.comparisonCount += 1)} terminée`,
                     isLoading: "done",
                     type: "comparison",
                  },
               },
            });
         }
         return results;
      },
      [
         model,
         statusRef.current.comparisonCount,
         statusRef.current.loadingState.isLoading,
      ]
   );

   const compareAllAnimals = useCallback(
      async (imagesArray: CompareImagesProps["imageArray"]) => {
         if (statusRef.current.loadingState.isLoading !== "training") {
            updateState(
               {
                  loadingState: {
                     message: "Comparaison de toutes les images...",
                     isLoading: "comparison",
                     type: "comparison",
                  },
               },
               setStatus
            );
         }

         // Avoid the first lag
         if (statusRef.current.comparisonCount === 0) await wait(100);

         const results = await Promise.all(
            imagesArray.map((image, index) =>
               compareAnimals([image, imagesArray[index + 1]])
            )
         );

         if (results) {
            checkForErrorAndUpdateState({
               results,
               setStatus,
               successValues: {
                  comparisonCount: statusRef.current.comparisonCount + 1,
                  ...results,
                  loadingState: {
                     message: `Comparaison ${
                        statusRef.current.comparisonCount + 1
                     } terminée`,
                     isLoading: "done",
                     type: "comparison",
                  },
               },
            });
         }
         return results;
      },
      [
         model,
         statusRef.current.comparisonCount,
         statusRef.current.loadingState.isLoading,
      ]
   );

   // Réinitialiser le modèle
   const resetModel = useCallback(() => {
      if (!model.isInitialized) return false;

      try {
         statusRef.current.trainingPairs.forEach((pair) => {
            if (pair.image1) pair.image1.dispose();
            if (pair.image2) pair.image2.dispose();
         });
         // setLastResult(null);
         updateState(
            {
               trainingPairs: [],
               comparisonCount: 0,
            },
            setStatus
         );

         initializeModel();
      } catch (error) {
         updateState(
            {
               error: {
                  status: "error",
                  message: `Erreur lors de la réinitialisation: ${error.message}`,
               },
            },
            setStatus
         );
      }
   }, [model]);

   /**
    * Saves the current model localy as Local Storage.
    *
    * @description This will create a JSON compatible array
    */
   const saveSelectionToLocalStorage = useCallback(
      async ({ silentSave = false }: SaveSelectionToLocalStorageProps) => {
         updateState(
            {
               loadingState: {
                  message: "Sauvegarde locale du modèle...",
                  isLoading: "savingToLocalStorage",
                  type: "savingToLocalStorage",
               },
            },
            setStatus
         );

         // Ensure the loader can be displayed
         // then removed properly
         // await wait(100);

         const results = savePairsAsLocal({
            status: statusRef.current,
            model,
            config: configRef.current,
            silentSave,
         });

         if (results) {
            await wait(100);

            checkForErrorAndUpdateState({
               results,
               setStatus,
               successValues: {
                  loadingState: {
                     message: "Sauvegarde locale effectuée",
                     isLoading: "done",
                     type: "savingToLocalStorage",
                  },
               },
            });
         }

         return results;
      },
      [model]
   );

   /**
    * Prepare the model for saving.
    *
    * @description It will save the model to local storage first,
    * then prepare the model data to be saved as a file.
    *
    * @param name - **@default=`configRef.current.taskName`** The name of the model to be saved.
    *
    * @returns The prepared model data with the status
    * @example
    * ```ts
    *  const modelData = await saveModelAsFile({ name: 'myModel' });
    * ```
    *
    * **Success**
    * ```ts
    *  {
    *    status: 200,
    *    message: 'Model saved successfully',
    *    modelData: {
    *      featureExtractor: tf.LayersModel,
    *      siameseModel: tf.LayersModel,
    *      metadata: MetadataProperties
    *  }
    *  fileName: 'myModel.json'
    * ```
    *
    * **Error**
    * ```ts
    *  {
    *    error: {
    *      status: 409,
    *      message: 'Model already exists'
    *    }
    *  }
    * ```
    */
   const saveModelAsFile = useCallback(
      async ({ name = configRef.current.taskName }) => {
         const localSaveResult = await saveSelectionToLocalStorage({
            silentSave: true,
         });

         if ("error" in localSaveResult) {
            return localSaveResult;
         }
         await wait(100);
         updateState(
            {
               loadingState: {
                  message: "Préparation du modèle pour exportation...",
                  isLoading: "prepareForExport",
                  type: "prepareForExport",
               },
            },
            setStatus
         );

         const results = await saveModelToFile({
            name,
            status: statusRef.current,
            model,
            config: configRef.current,
         });

         if (results) {
            checkForErrorAndUpdateState({
               results,
               setStatus,
               successValues: {
                  loadingState: {
                     message: "Préparation du modèle terminée",
                     isLoading: "done",
                     type: "prepareForExport",
                  },
               },
            });
         }

         updateState(
            {
               loadingState: {
                  message: "Exportation du modèle en cours...",
                  isLoading: "savingToFile",
                  type: "savingToFile",
               },
            },
            setStatus
         );

         return results;
      },
      [
         model.featureExtractor,
         model.siameseModel,
         status,
         model.isInitialized,
         statusRef.current,
      ]
   );

   /**
    * Load a model from JSON data.
    *
    * @description This will only accept parsed JSON data.
    * It will update the model state with the loaded model data.
    *
    * @param data - The data of the model to be loaded.
    * @returns The loaded model data with the status.
    */
   const loadModel = useCallback(async (data: string | object) => {
      updateState(
         {
            loadingState: {
               message: "Chargement du modèle...",
               isLoading: "loading",
               type: "loading",
            },
         },
         setStatus
      );
      const parsedData = typeof data === "string" ? JSON.parse(data) : data;

      const results = await loadModelFromData({
         data: parsedData,
         config: configRef.current,
      });

      setModel((prev) => ({
         ...prev,
         siameseModel: results.siameseModel as tf.LayersModel,
         featureExtractor: results.featureExtractor as tf.LayersModel,
         isInitialized: results.status === 200,
      }));

      checkForErrorAndUpdateState({
         results: { ...results },
         setStatus,
         successValues: {
            loadingState: {
               message: "Chargement du modèle terminé",
               isLoading: "done",
               type: "loading",
            },
         },
      });
      return results;
   }, []);

   /**
    * Add a training pair to the model.
    *
    * @description This will update the status with
    * the new image pair transformed into a tensor.
    *
    * @param imgArray - An array containing two image elements.
    * @param isSameAnimal - A boolean indicating if the images are of the same animal.
    */
   const addTrainingPair = useCallback(
      async ({
         imgArray,
         isSameAnimal,
         count,
      }: AddTrainingPairCallBackProps) => {
         updateState(
            {
               loadingState: {
                  message: "Ajout de la paire d'entraînement...",
                  isLoading: "adding",
                  type: "adding",
               },
            },
            setStatus
         );
         // Avoid the first lag
         if (count === 0) await wait(100);
         const pair = addTrainingPairToModel({
            imgArray,
            isSameAnimal,
            config: configRef.current,
            isInitialized: model.isInitialized,
         });

         if (pair) {
            checkForErrorAndUpdateState({
               results: pair,
               setStatus,
               successValues: {
                  trainingPairs:
                     "trainingPair" in pair
                        ? (pair.trainingPair as TrainingPair[])
                        : undefined,
                  pairsArrayForSaving:
                     "pairArrayForSaving" in pair
                        ? (pair.pairArrayForSaving as PairArrayForSaving[])
                        : undefined,
                  loadingState: {
                     message: "Paire d'entraînement ajoutée avec succès",
                     isLoading: "done",
                     type: "adding",
                  },
               },
            });
         }
      },
      [model.isInitialized]
   );

   /**
    * Load image pairs from local storage.
    *
    * @description Each pair will be transformed into a tensor
    * and added to the training pairs state.
    */
   const loadFromStorageData = useCallback(async () => {
      if (
         !model.isInitialized ||
         statusRef.current.localStorageDataLoaded ||
         statusRef.current.loadingState.isLoading !== "storage"
      )
         return;

      const item = localStorage.getItem(configRef.current.localStorageKey);
      const trainingPairs = item ? JSON.parse(item) : [];

      const results = await loadStorageData({
         isInitialized: model.isInitialized,
         config: configRef.current,
         trainingPairs,
      });

      if (results) {
         checkForErrorAndUpdateState({
            results: { ...results, localStorageDataLoaded: true },
            setStatus,
            successValues: {
               loadingState: {
                  message: "Données image chargées",
                  isLoading: "done",
                  type: "storage",
               },
            },
         });
      }
   }, [
      model.isInitialized,
      statusRef.current.localStorageDataLoaded,
      statusRef.current.loadingState.isLoading,
      statusRef.current.loadingState.type,
      statusRef.current.loadingState.message,
   ]);

   /**
    * Error Toaster Handler
    *
    * @description This will show an error message
    * if there is an error in the statusRef.current.
    */
   useEffect(() => {
      if (status.error.message) {
         const currentType = status.loadingState.type;
         const message = status.error.message;
         const toastId = `${MODEL_LOADER_ID}${currentType}`;

         if (status.error.status.toString() === "409") {
            toast.warning(message, {
               position: "top-right",
            });

            updateState(
               {
                  error: { status: "", message: "" },
               },
               setStatus
            );
            return;
         }
         toast.dismiss(toastId);

         // toast.getHistory().forEach((t) => {
         //     if (t.type === 'loading') toast.dismiss(t.id);
         // });
         toast.error(message, {
            position: "top-right",
         });
         updateState(
            {
               error: { status: "", message: "" },
               loadingState: { message: "", isLoading: "", type: "" },
            },
            setStatus
         );
      }
   }, [status.error.message, status.loadingState.type]);

   /**
    * Update the status reference whenever the status changes.
    * Used to avoid unnecessary re-renders due
    * to closures in callbacks.
    */
   useEffect(() => {
      statusRef.current = status;
   }, [status]);
   /**
    * Initialized the feature extractor and Siamese model.
    * This will be called on component mount.
    */
   useEffect(() => {
      initializeModel();
   }, []);

   /**
    * Load training pairs from local storage.
    * This will be triggered after the model is initialized.
    */
   useEffect(() => {
      if (!model.isInitialized || status.localStorageDataLoaded) return;
      updateState(
         {
            loadingState: {
               message: "Chargement des données images...",
               isLoading: "storage",
               type: "storage",
            },
         },
         setStatus
      );
      loadFromStorageData();
   }, [
      model.isInitialized,
      status.localStorageDataLoaded,
      status.loadingState.isLoading,
   ]);

   /**
    * Toaster Handler
    * @description Triggers a toaster notification when
    * the loadingstate changes.
    */
   useEffect(() => {
      // if (status.error.message || !status.loadingState.message) {
      //     return;
      // }
      if (status.loadingState.isLoading) {
         const type = status.loadingState.type;
         const toastId = `${MODEL_LOADER_ID}${type}`;
         const message = status.loadingState.message;

         // Show success message when loading is done
         if (status.loadingState.isLoading === "done") {
            toast.dismiss(toastId);
            toast.success(message, {
               position: "top-right",
            });
            updateState(
               {
                  loadingState: {
                     message: "",
                     isLoading: "",
                     type: "",
                  },
               },
               setStatus
            );
         }
         if (status.loadingState.isLoading !== "done") {
            console.log("object : ", type);
            // toast.dismiss();
            // toast.dismiss(`${MODEL_LOADER_ID}${status.loadingState.type}`);
            toast.loading(message, {
               position: "top-right",
               id: `${MODEL_LOADER_ID}${type}`,
            });
         }
      }
   }, [
      status.loadingState.isLoading,
      status.loadingState.type,
      status.loadingState.message,
   ]);

   /**
    * Calculates the balance of training pairs.
    * This will trigger each time the training pairs are updated.
    * @description -It counts the number of positive and negative pairs.
    */
   useEffect(() => {
      const results = getDataBalance({
         trainingPairs: status.trainingPairs,
      });
      updateState(
         {
            balance: results,
         },
         setStatus
      );
   }, [status.trainingPairs]);

   return {
      /** State */
      isInitialized: model.isInitialized,
      model,
      status,

      /** Actions */
      initializeModel,
      addTrainingPair,
      startModelTraining,
      compareAnimals,
      saveModelAsFile,
      // findMatches,
      resetModel,
      saveSelectionToLocalStorage,
      compareAllAnimals,
      loadModel,
   };
}
