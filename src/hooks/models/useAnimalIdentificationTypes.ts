import type {
   ARTIFACTS_PROPERTIES_FROM_ARTIFACTS,
   METADATA_PROPERTIES_FROM_CONFIG,
} from "@/configs/file.config.ts";
import type { CustomError } from "@/mainTypes.ts";
import * as tf from "@tensorflow/tfjs";
import type { Dispatch, SetStateAction } from "react";

export interface AnimalIdentification {
   model: ModelTypes;
   status: StatusTypes;
   isInitialized: ModelTypes["isInitialized"];
   addTrainingPair: (
      image1: string,
      image2: string,
      sameAnimal: boolean
   ) => Promise<void>;
   startModelTraining: () => Promise<void>;
   compareAnimals: (image1: string, image2: string) => Promise<void>;
   // findMatches,
   resetModel: () => Promise<void>;
   saveModel: () => Promise<void>;
   loadModel: (data: string | object) => Promise<LoadModelFromDataResults>;
   saveSelectionToLocalStorage: (props?: {
      silentSave?: boolean;
   }) => Promise<SaveModelAsLocalResults>;
}

export type ConfigTypes = {
   featureSize: number;
   imageSize: number;
   localStorageKey: string;
   augment: boolean;
   epochs: number;
   batchSize: number;
   validationSplit: number;
   learningRate: number;
   optimizer: string;
   loss: string;
   metrics: string[];
   predictionThreshold: number;
   taskName: string;
};

export type ModelTypes = {
   featureExtractor: tf.LayersModel | null;
   siameseModel: tf.LayersModel | null;
   isInitialized: boolean;
};

export type LoadingStateIsLoading =
   | "initializing"
   | "training"
   | "storage"
   | "comparison"
   | "done"
   | "adding"
   | "savingToFile"
   | "savingToLocalStorage"
   | "prepareForExport"
   | "loading"
   | "";

export type StatusTypes = {
   loadingState: {
      message: string;
      isLoading: LoadingStateIsLoading;
      type: Exclude<LoadingStateIsLoading, "done">;
   };
   siameseModelInitialized: boolean;
   featureExtractorInitialized: boolean;
   localStorageDataLoaded: boolean;
   trainingPairs: TrainingPair[];
   comparisonCount: number;
   accuracy: number | string;
   pairsArrayForSaving: PairArrayForSaving[];
   balance: { positive: number; negative: number; total: number };
   similarityScore: number;
   sameAnimal: boolean;
   confidence: number;
   trainEpochCount: number;
   loss: number;
   error: {
      status: string | number;
      message: string;
      type?: string;
   };
};

export type CreateSiameseModelProps = {
   config: ConfigTypes;
   featureExtractor: tf.LayersModel;
};
export type CreateSiameseModelResults =
   | { siameseModel: tf.LayersModel; success: boolean }
   | { success: boolean };

export type CreateFeatureExtractorProps = {
   config: Pick<ConfigTypes, "featureSize" | "imageSize">;
};
export type CreateFeatureExtractorResult =
   | {
        /** The created feature extractor model */
        extractor: tf.LayersModel;
        success: boolean;
     }
   | { success: boolean };

export type PreprocessImageProps = {
   imageElement: HTMLImageElement | HTMLCanvasElement;
   config: ConfigTypes;
};

export type PreprocessImageResults = tf.Tensor4D | CustomError;
export type AddTrainingPairToModelProps = {
   imgArray: HTMLImageElement[];
   isSameAnimal: boolean;
   config: ConfigTypes;
   isInitialized: ModelTypes["isInitialized"];
};

export type AddTrainingPairCallBackProps = { count: number } & Exclude<
   AddTrainingPairToModelProps,
   "isInitialized | config"
>;

export type TrainingPair = {
   image1: PreprocessImageResults;
   image2: PreprocessImageResults;
   label: number;
};

export type PairArrayForSaving = {
   image1Url: HTMLImageElement["src"];
   image2Url: HTMLImageElement["src"];
   isSameAnimal: boolean;
};

export type AddTrainingPairToModelResults =
   | {
        pairArrayForSaving: PairArrayForSaving | PairArrayForSaving[];
        trainingPair: TrainingPair | TrainingPair[];
     }
   | { error: StatusTypes["error"] };

export type LoadImageElementProps = {
   imageUrl: HTMLImageElement["src"];
};

export type LoadImageElementResults = HTMLImageElement | PromiseRejectedResult;
export type LoadStorageDataProps = {
   config: ConfigTypes;
   isInitialized: ModelTypes["isInitialized"];
   trainingPairs?: PairArrayForSaving[];
};

export type LoadStorageDataResults =
   | {
        pairsArrayForSaving: PairArrayForSaving[];
        trainingPairs: TrainingPair[];
     }
   | { error?: StatusTypes["error"] };

export type GetDataBalanceProps = {
   trainingPairs: TrainingPair[];
};

export interface GetDataBalanceResults {
   positive: number;
   negative: number;
   total: number;
}

export type InitializeProps = {
   isInitialized: ModelTypes["isInitialized"];
   config: ConfigTypes;
};

export type InitializeResults =
   | {
        featureExtractor: tf.LayersModel;
        siameseModel: tf.LayersModel;
        isInitialized: ModelTypes["isInitialized"];
     }
   | {
        error: StatusTypes["error"];
     };

export type TrainModelProps = {
   model: ModelTypes;
   status: StatusTypes;
   config?: Partial<ConfigTypes>;
   onEpochEnd: (epoch: number, logs: { loss?: number; acc?: number }) => void;
   initializeModel: () => void;
};

export interface TrainModelResults extends Record<string, unknown> {
   loadingState?: {
      message: string;
      isLoading: "done";
      type: "training";
   };
   error?: StatusTypes["error"];
}

export type CompareImagesProps = {
   imageArray: HTMLImageElement[];
   model: ModelTypes;
   config: ConfigTypes;
   initializeModel: () => void;
};
export type CompareImagesResults =
   | {
        similarityScore: number;
        sameAnimal: boolean;
        confidence: number;
     }
   | { error: StatusTypes["error"] };

export type SaveTrainingPairsProps = {
   config: ConfigTypes;
   status: StatusTypes;
};
// export type SaveModelAsLocalResults = Record<string, unknown> & {
//     success: boolean;
//     message?: string;
//     error?: {
//         status: string | number;
//         message: string;
//     };
// };
export interface SaveModelAsLocalResults extends Record<string, unknown> {
   status?: number;
   message?: string;
   error?: StatusTypes["error"];
}
// export type SaveTrainingPairsResults = Record<string, unknown> & {
//     trainingPair?: TrainingPair[];
//     pairArrayForSaving?: PairArrayForSaving[];
//     error?: {
//         status: string;
//         message: string;
//     };
// };

export type SaveModelAsLocalProps = {
   status: StatusTypes;
   model: ModelTypes;
   config: ConfigTypes;
   silentSave?: boolean;
};

export type SaveModelArtifactsProps = {
   modelTosave: tf.LayersModel;
};

// export type SaveAsFileResults = SaveModelAsLocalResults;

export type CheckIfModelsFoundProps = {
   siameseModel: ModelTypes["siameseModel"] | ArtifactProperties;
   featureExtractor: ModelTypes["featureExtractor"] | ArtifactProperties;
};

export type CreateCompleteDataStructureProps = {
   modelName: string;
   siameseArtifacts: tf.io.ModelArtifacts;
   featureArtifacts: tf.io.ModelArtifacts;
   config: ConfigTypes;
   status: StatusTypes;
};
export type MetadataProperties = {
   name: string;
   timestamp: string;
   trainingPairsCount: number;
   comparisonCount: number;
} & Pick<
   Partial<ConfigTypes>,
   (typeof METADATA_PROPERTIES_FROM_CONFIG)[number]
>;

export type ArtifactProperties = {
   weightData: number[] | Base64URLString | Uint8Array;
} & Pick<
   tf.io.ModelArtifacts,
   (typeof ARTIFACTS_PROPERTIES_FROM_ARTIFACTS)[number]
>;

export type CreateCompleteDataStructureResults =
   | {
        metadata: MetadataProperties;
        siameseModel: ArtifactProperties;
        featureExtractor: ArtifactProperties;
     }
   | {
        error: {
           message: string;
           status: number;
        };
     };

export type CreatePropertiesFromItemProps = {
   item: ConfigTypes | tf.io.ModelArtifacts;
   configVariable: ReadonlyArray<
      keyof tf.io.ModelArtifacts | keyof MetadataProperties
   >;
};

export type CheckForErrorAndUpdateStateProps<
   T extends Record<string, unknown>
> = {
   results: T;
   setStatus: Dispatch<SetStateAction<StatusTypes>>;
   newValues?: Partial<StatusTypes>;
};

export type SaveModelToFileProps = {
   status: StatusTypes;
   name: string;
   model: ModelTypes;
   config: ConfigTypes;
};

export interface SaveModelToFileResults extends Record<string, unknown> {
   message?: string;
   type?: Extract<LoadingStateIsLoading, "savingToFile">;
   modelData?: Omit<CreateCompleteDataStructureResults, "error">;
   status?: number;
   error?: StatusTypes["error"];
}

export interface CreateFeatureHandlerProps {
   weightData: ArrayBuffer;
   data: ArtifactProperties;
   metadata?: MetadataProperties | object;
}

export type LoadModelFromDataProps = {
   data: Exclude<CreateCompleteDataStructureResults, "error">;
   config: ConfigTypes;
};

export interface LoadModelFromDataResults
   extends Partial<CheckIfModelsFoundProps> {
   modelName?: string;
   status?: number;
   message?: string;
   error?: StatusTypes["error"];
}
