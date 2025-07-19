// Types pour TensorFlow.js
declare global {
    const tf: any;
}

export interface TensorFlowModel {
    predict(x: any): any;
    fit(x: any, y: any, config?: any): Promise<any>;
    compile(config: any): void;
    add(layer: any): void;
}

export interface TrainingHistory {
    loss: number[];
    accuracy: number[];
    val_loss?: number[];
    val_accuracy?: number[];
}

export {};
