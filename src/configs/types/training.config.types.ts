export type TrainingButtonsParams<K extends (...args: any[]) => any> = {
   onUserResults: K;
   onPredict: K;
};
