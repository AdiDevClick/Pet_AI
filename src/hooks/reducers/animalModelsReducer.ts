export function animalModelsReducer(
   state: AnimalModelState,
   action: AnimalModelAction
): AnimalModelState {
   switch (action.type) {
      case "SET_BATCH_UPDATE":
         return { ...state, ...action.payload };
      case "SET_LOADING_STATE":
         return {
            ...state,
            loadingState: { ...state.loadingState, ...action.payload },
         };
      case "SET_COMPARISON_COUNT":
         return { ...state, comparisonCount: action.payload };
      case "SET_ERROR":
         return { ...state, error: { ...state.error, ...action.payload } };
      case "INITIALIZE_MODELS":
         return {
            ...state,
            ...action.payload,
         };
      case "ON_EPOCH_UPDATE":
         return {
            ...state,
            trainEpochCount: state.trainEpochCount + 1,
            loss: action.payload.logs.loss,
            accuracy:
               typeof action.payload.logs.acc === "number"
                  ? (action.payload.logs.acc * 100).toFixed(1)
                  : "N/A",
         };
      case "COMPARE_IMAGES":
         return {
            ...state,
            similarityScore: action.payload.similarityScore,
            sameAnimal: action.payload.sameAnimal,
            confidence: action.payload.confidence,
            comparisonCount: state.comparisonCount + 1,
         };
      case "ADD_TRAINING_PAIR":
         return {
            ...state,
            trainingPairs: [...state.trainingPairs, action.payload],
            pairArrayForSaving: [...state.pairArrayForSaving, action.payload],
         };
      default:
         throw Error(
            "Action non reconnue: " + (action as { type: string }).type
         );
   }
}
