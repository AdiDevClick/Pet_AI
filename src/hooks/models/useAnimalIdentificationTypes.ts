import type { CustomError } from '@/mainTypes.ts';
import * as tf from '@tensorflow/tfjs';

export interface AnimalIdentification {
    model: ModelTypes;
    status: StatusTypes;
    isInitialized: ModelTypes['isInitialized'];
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
    loadModel: () => Promise<void>;
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
    | 'initializing'
    | 'training'
    | 'storage'
    | 'comparison'
    | 'done'
    | 'adding'
    | '';

export type StatusTypes = {
    loadingState: {
        message: string;
        isLoading: LoadingStateIsLoading;
        type: Exclude<LoadingStateIsLoading, 'done'>;
    };
    siameseModelInitialized: boolean;
    featureExtractorInitialized: boolean;
    localStorageDataLoaded: boolean;
    trainingPairs: TrainingPair[];
    comparisonsCount: number;
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
    config: Pick<ConfigTypes, 'featureSize' | 'imageSize'>;
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
    isInitialized: ModelTypes['isInitialized'];
};

export type AddTrainingPairCallBackProps = { count: number } & Exclude<
    AddTrainingPairToModelProps,
    'isInitialized | config'
>;

export type TrainingPair = {
    image1: PreprocessImageResults;
    image2: PreprocessImageResults;
    label: number;
};

export type PairArrayForSaving = {
    image1Url: HTMLImageElement['src'];
    image2Url: HTMLImageElement['src'];
    isSameAnimal: boolean;
};

export type AddTrainingPairToModelResults =
    | {
          pairArrayForSaving: PairArrayForSaving | PairArrayForSaving[];
          trainingPair: TrainingPair | TrainingPair[];
      }
    | { error: StatusTypes['error'] };

export type LoadImageElementProps = {
    imageUrl: HTMLImageElement['src'];
};

export type LoadImageElementResults = HTMLImageElement | PromiseRejectedResult;
export type LoadStorageDataProps = {
    config: ConfigTypes;
    isInitialized: ModelTypes['isInitialized'];
    trainingPairs?: PairArrayForSaving[];
};

export type LoadStorageDataResults =
    | {
          pairsArrayForSaving: PairArrayForSaving[];
          trainingPairs: TrainingPair[];
      }
    | { error?: StatusTypes['error'] };

export type GetDataBalanceProps = {
    trainingPairs: TrainingPair[];
};

export interface GetDataBalanceResults {
    positive: number;
    negative: number;
    total: number;
}

export type InitializeProps = {
    isInitialized: ModelTypes['isInitialized'];
    config: ConfigTypes;
};

export type InitializeResults =
    | {
          featureExtractor: tf.LayersModel;
          siameseModel: tf.LayersModel;
          isInitialized: ModelTypes['isInitialized'];
      }
    | {
          error: StatusTypes['error'];
      };

export type TrainModelProps = {
    model: ModelTypes;
    status: StatusTypes;
    config?: Partial<ConfigTypes>;
    onEpochEnd: (epoch: number, logs: { loss?: number; acc?: number }) => void;
    initializeModel: () => void;
};

export interface TrainModelResults {
    loadingState?: {
        message: string;
        isLoading: 'done';
        type: 'training';
    };
    error?: StatusTypes['error'];
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
    | { error: StatusTypes['error'] };
