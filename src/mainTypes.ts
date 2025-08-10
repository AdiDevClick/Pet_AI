import type { Dispatch, SetStateAction } from "react";
import type { initialAppRouterState } from "@/main.tsx";

export type AppRouterState = typeof initialAppRouterState;

export type ContextTypes = AppRouterState & {
   setAppRouterContext: Dispatch<SetStateAction<AppRouterState>>;
};

export type CustomError = {
   cause?: {
      message?: string;
      status?: number;
   };
} & Error;
