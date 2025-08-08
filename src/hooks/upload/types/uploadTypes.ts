import type { defaultState } from "@/components/Controls/Controls.tsx";

export interface UploadAFileTypes<F extends (data: any) => Promise<any>> {
   exploreFiles: {
      state: boolean;
      data: Parameters<F>[0] | null;
   };
   functionToCall: F;
}

export type UploadAFile<F extends (data: any) => Promise<any>> = {
   fileContent: Parameters<F>[0];
   fileError: FileState<Awaited<ReturnType<F>>>["error"];
   fileResults: Awaited<ReturnType<F>> | null;
};

export type DefaultState = typeof defaultState;

export type FileState<T = DefaultState> = {
   file: File | null;
   fileContent: string;
   results: T | null;
   error: { status: string | number; message: string };
};
