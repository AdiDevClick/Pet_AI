import { animalModelsReducer } from "@/hooks/reducers/animalModelsReducer.ts";
import { useCallback, useReducer } from "react";

const initialState: AnimalModelState = {
   isInitialized: false,
   featureExtractor: null,
   siameseModel: null,
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
};

export function useAnimalModel(): AnimalModelState {
   const [state, dispatch] = useReducer(animalModelsReducer, initialState);
   return {
      ...state,
      setBatchUpdate: useCallback((updates) => {
         dispatch({ type: "BATCH_UPDATE", payload: updates });
      }, []),
      setLoadingState: useCallback((loadingState) => {
         dispatch({ type: "SET_LOADING_STATE", payload: loadingState });
      }, []),
      setError: useCallback((error) => {
         dispatch({ type: "SET_ERROR", payload: error });
      }, []),
      setComparisonCount: useCallback((count) => {
         dispatch({ type: "SET_COMPARISON_COUNT", payload: count });
      }, []),
      setAccuracy: useCallback((accuracy) => {
         dispatch({ type: "INITIALIZE_MODELS", payload: accuracy });
      }, []),
      setEpochUpdate: useCallback((epochData) => {
         dispatch({ type: "ON_EPOCH_UPDATE", payload: epochData });
      }, []),
      setImageCompare: useCallback((imgData) => {
         dispatch({ type: "COMPARE_IMAGES", payload: imgData });
      }, []),
      setAddTrainingPair: useCallback((pairs) => {
         dispatch({ type: "ADD_TRAINING_PAIR", payload: pairs });
      }, []),
   };
}
