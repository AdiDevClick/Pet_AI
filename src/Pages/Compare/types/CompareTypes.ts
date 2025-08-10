import type { initialComparePageState } from "@/Pages/Compare/ComparePets.tsx";
import type { Dispatch, SetStateAction } from "react";

export type PageState = typeof initialComparePageState;

export type CompareResult = {
   similarityScore: number;
   sameAnimal: boolean;
   confidence: number;
};

export type ComparePageState = PageState & {
   setPageState: Dispatch<SetStateAction<PageState>>;
};
