import type { UniqueSet } from "@/lib/UniqueSet.ts";
import type { HTMLAttributes, ReactNode } from "react";

export type GenericCardProps<T = unknown> = {
   children: ReactNode;
   item?: T;
   index?: number;
} & HTMLAttributes<HTMLDivElement>;

export type PredictionType =
   | { sameAnimal: boolean; confidence: number }
   | { error: { status: string | number; message: string; type?: string } };
export type TrainingTwoCardsState = {
   results: PredictionType;
   isCorrect: boolean;
   showPrediction: boolean;
   imagesShown: UniqueSet<string, HTMLImageElement>;
};

export type AnimalItem = {
   id: string | number;
   image: string;
   description: string;
};
export type TrainingTwoCardsProps<T extends HTMLAttributes<HTMLDivElement>> = {
   animals: AnimalItem[];
   isOnLoad?: boolean;
   shouldPredict?: boolean;
   onPredictionEnd?: () => void | Promise<void>;
   children?: ReactNode;
} & T;
