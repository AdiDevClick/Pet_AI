import { defaultState } from "@/components/Controls/Controls.tsx";
import type {
   GenericButtonsProps,
   LoadModelTypes,
} from "@/components/Controls/controlsTypes";
import { MODEL_LOADER_ID } from "@/configs/toaster.config.ts";
import { updateState, wait } from "@/lib/utils.ts";
import type { CustomError } from "@/mainTypes.ts";
import { toast } from "sonner";

export function loadNewImages({
   setPredictionsCount,
   isOnLoad,
   setIsOnLoad,
   setCount,
   count,
   e,
}) {
   e.preventDefault();
   if (isOnLoad) setIsOnLoad(!isOnLoad);
   if (count > 10) setCount(1);
   setCount((prev) => prev + 1);
   setPredictionsCount(0);
}

export async function saveModel({ e, ...functionProps }) {
   e.preventDefault();
   const element = e.target;
   try {
      const result = await functionProps.saveModelAsFile({
         name: "test de sauvegarde",
      });
      await wait(100);
      if ("error" in result) {
         throw new Error(`Erreur de sauvegarde: ${result.message}`, {
            cause: {
               status: result.status,
               message: result.message,
               type: result.type,
            },
         });
      }
      functionProps.setButtonState((prev) => ({
         ...prev,
         download: { state: true, data: result.modelData },
         id: element.id,
      }));

      toast.dismiss(`${MODEL_LOADER_ID}${result.type}`);
      toast.success("Modèle sauvegardé avec succès!", {
         position: "top-right",
      });
   } catch (error) {
      toast.dismiss(
         `${MODEL_LOADER_ID}${
            (error as CustomError).cause?.type || (error as Error).type
         }`
      );
      toast.error(
         `Erreur de sauvegarde: ${(error as CustomError).cause?.message}`,
         {
            position: "top-right",
         }
      );
   }
}

/**
 * Saves the current data selection to local storage.
 *
 * @description It will trigger a toaster notification on success or failure.
 * It will save the current data selection to local storage.
 *
 * @param e - The Mouse Event object.
 * @param functionProps - Object containing functions and App context to save data selection.
 *
 * @returns
 */
export async function saveDataSelection({
   e,
   ...functionProps
}: GenericButtonsProps) {
   e.preventDefault();

   await functionProps.saveSelectionToLocalStorage();
}

export async function loadDefaultDataArray({ e }) {
   e.preventDefault();

   try {
      await window.animalIdentifier.loadDefaultDataArray();
      alert(
         "📂 Données de comparaison par défaut chargées avec succès!\nUn nouvel enregistrement de données sera créé."
      );
   } catch (error) {
      alert(
         "❌ Erreur lors du chargement des données de comparaison par défaut"
      );
   }
}

/**
 * Loads the AI model from a file.
 * It will trigger a toaster notification on success or failure.
 *
 * @description This function reads a JSON file and loads the AI model from it.
 * It expects the file to be a valid JSON containing the model data.
 *
 * @param e - The event object.
 * @param setButtonState - Function to set the button state.
 *
 * @trigger The `setButtonState` setter with error and button id.
 */
export async function loadThisModel({ data, callFunc }: LoadModelTypes) {
   const success = await callFunc(data);
   return await {
      ...success,
   };
}

/**
 * Opens the file explorer dialog.
 *
 * @description This function will first reset the button state
 * to ensure the button remains clickable.
 * It will then set the button state to indicate that the upload is in progress.
 *
 * @param e - The event object.
 * @param functionProps - The function properties including context and state.
 */
export async function openFileExplorer({
   e,
   ...functionProps
}: LoadModelTypes) {
   e.preventDefault();
   const element = e.target as HTMLElement;
   functionProps.setButtonState(defaultState);

   setTimeout(() => {
      updateState(
         {
            ...defaultState,
            id: element.id,
            upload: { state: true, data: null },
         },
         functionProps.setButtonState
      );
   }, 0);
}

export async function resetSystem({ e, ...functionProps }) {
   e.preventDefault();
   loadNewImages({ e, ...functionProps });
   functionProps.setResetSystem(true);
}

export async function predictAllImages({
   e,
   predictionsCount,
   setPredictionsCount,
}) {
   e.preventDefault();
   if (!window.imageClassifier || !window.imageClassifier.model) {
      alert("⚠️ Le modèle n'est pas encore prêt!");
      return;
   }

   const images = document.querySelectorAll(".image-card img");
   predictionsCount = 0;

   for (let img of images) {
      if (img.complete) {
         const prediction = await window.imageClassifier.predict(img);
         if (prediction) {
            const imageId = img.closest(".image-card").id.replace("card-", "");
            const predictionElement = document.getElementById(
               `prediction-${imageId}`
            );

            predictionElement.innerHTML = `
                            <strong>🔮 Prédiction IA:</strong><br>
                            ${
                               prediction.prediction === "correct"
                                  ? "✅ Chat détecté"
                                  : "❌ Pas un chat"
                            }<br>
                            <small>Confiance: ${(
                               prediction.confidence * 100
                            ).toFixed(1)}%</small>
                        `;
            predictionElement.style.display = "block";
            setPredictionsCount((prevCount) => prevCount + 1);
         }
      }
   }

   // updateStats();
}
export async function validateAllImages({ e }) {
   e.preventDefault();
   let count = 0;
   const comparisons = document.querySelectorAll(".card__image-choice");
   await Promise.all(
      Array.from(comparisons).map(async (comparison) => {
         const images = comparison.querySelectorAll("img");
         if (images.length === 2) {
            const image1 = images[0];
            const image2 = images[1];
            if (image1.complete && image2.complete) {
               await window.animalIdentifier.addTrainingPair(
                  [image1, image2],
                  true
               );
               count++;
               // const predictionElement = document.getElementById(
               //     `prediction-${image1.id}`
               // );
               // predictionElement.innerHTML = `
               //     <strong>🔮 Prédiction IA:</strong><br>
               //     ✅ Images validées<br>
               //     <small>Confiance: 100%</small>
               // `;
               // predictionElement.style.display = 'block';
            }
         }
      })
   );
   alert(`✅ Toutes les images(${count}) ont été validées!`);
   // for (let img of images) {
   //     if (img.complete) {
   //         const prediction = await window.imageClassifier.predict(img);
   //         if (prediction) {
   //             const imageId = img
   //                 .closest('.image-card')
   //                 .id.replace('card-', '');
   //             const predictionElement = document.getElementById(
   //                 `prediction-${imageId}`
   //             );

   //             predictionElement.innerHTML = `
   //                         <strong>🔮 Prédiction IA:</strong><br>
   //                         ${
   //                             prediction.prediction === 'correct'
   //                                 ? '✅ Chat détecté'
   //                                 : '❌ Pas un chat'
   //                         }<br>
   //                         <small>Confiance: ${(
   //                             prediction.confidence * 100
   //                         ).toFixed(1)}%</small>
   //                     `;
   //             predictionElement.style.display = 'block';
   //             setPredictionsCount((prevCount) => prevCount + 1);
   //         }
   //     }
   // }

   // updateStats();
}

/**
 * Starts the model training process.
 * It will trigger a toaster notification
 * on success or failure based on the hook.
 * @description This function initiates the model training process.
 *
 * @param e - The Mouse Event object.
 * @param functionProps - Object containing functions and App context to start model training.
 */
export async function trainModel({ e, ...functionProps }: GenericButtonsProps) {
   e.preventDefault();
   functionProps.startModelTraining();
}
