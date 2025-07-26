export type contextTypes = {
    accuracy: number;
    onLoad: boolean;
    setOnLoad: (value: boolean) => void;
    predictionsCount: number;
    setPredictionsCount: (value: number) => void;
    trainingCount: number;
    setTrainingCount: (value: number) => void;
    setCount: (value: number) => void;
    count: number;
    setResetSystem: (value: boolean) => void;
    resetSystem: boolean;
};
