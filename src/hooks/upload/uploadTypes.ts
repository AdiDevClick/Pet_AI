import type { defaultState } from "@/components/Controls/Controls.tsx";

export interface UploadAFileTypes<K, T> {
   exploreFiles: {
      state: boolean;
      data: K | null;
   };
   functionToCall: (data: K) => Promise<T>;
}

export interface UploadAFile<T extends Record<string, unknown>> {
   fileContent: FileState<T>["fileContent"];
   fileError: FileState<T>["error"];
   fileResults: FileState<T>["results"];
}

export type DefaultState = typeof defaultState;

export type FileState<T = DefaultState> = {
   file: File | null;
   fileContent: string;
   results: T | null;
   error: { status: string | number; message: string };
};
