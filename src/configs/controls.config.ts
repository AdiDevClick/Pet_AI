import {
   loadDefaultDataArray,
   loadNewImages,
   openFileExplorer,
   predictAllImages,
   resetSystem,
   saveData,
   saveModel,
   trainModel,
   validateAllImages,
} from "@/components/Controls/controlsFunctions.ts";
import type { ControlsFunctionPropsTypes } from "@/components/Controls/controlsTypes.ts";
import type { MouseEvent } from "react";

/**
 * Config file for controls component.
 */

/**
 * Object containing function props for controls
 *
 * @description Use Object.assign to add context and setIsSuccess to this object.
 */
export const functionProps = {} as ControlsFunctionPropsTypes;

/**
 * Default array of clickable buttons for controls
 */
export const clickableButtons = [
   {
      id: "controls-button-0",
      label: "🔄 Nouvelles Images",
      className: "primary",
      functions: {
         onClick: (e: MouseEvent<HTMLButtonElement>) =>
            loadNewImages({ e, ...functionProps }),
      },
   },
   {
      id: "controls-button-1",
      label: "🗑️ Réinitialiser",
      className: "danger",
      functions: {
         onClick: (e: MouseEvent<HTMLButtonElement>) =>
            resetSystem({ e, ...functionProps }),
      },
   },
   {
      id: "controls-button-2",
      label: "✅ Valider toutes les Images",
      className: "success",
      functions: {
         onClick: (e: MouseEvent<HTMLButtonElement>) =>
            validateAllImages({ e, ...functionProps }),
      },
   },
   {
      id: "controls-button-3",
      label: "🔮 Prédire Tout",
      className: "success",
      functions: {
         onClick: (e: MouseEvent<HTMLButtonElement>) =>
            predictAllImages({ e, ...functionProps }),
      },
   },
   {
      id: "controls-button-4",
      label: "🔧 Entraîner le Modèle",
      className: "success",
      functions: {
         onClick: (e: MouseEvent<HTMLButtonElement>) =>
            trainModel({ e, ...functionProps }),
      },
   },
   {
      id: "controls-button-5",
      label: "💾 Sauvegarder le modèle",
      className: "primary",
      functions: {
         onClick: (e: MouseEvent<HTMLButtonElement>) =>
            saveModel({ e, ...functionProps }),
      },
   },
   {
      id: "controls-button-6",
      label: "📂 Charger le modèle",
      className: "primary",
      functions: {
         onClick: (e: MouseEvent<HTMLButtonElement>) =>
            openFileExplorer({ e, ...functionProps }),
      },
      context: {
         error: {
            cancelable: true,
            retryButtonText: "Nouveau fichier",
            title: "Souhaitez-vous charger un nouveau fichier ?",
            message: "Aucun modèle sauvegardé trouvé",
         },
      },
   },
   {
      id: "controls-button-7",
      label: "💾 Sauvegarder les données",
      className: "primary",
      functions: {
         onClick: (e: MouseEvent<HTMLButtonElement>) => saveData({ e }),
      },
   },
   {
      id: "controls-button-8",
      label: "📂 Charger les données de comparaison par défaut",
      className: "primary",
      functions: {
         onClick: (e: MouseEvent<HTMLButtonElement>) =>
            loadDefaultDataArray({ e }),
      },
   },
] as const;
