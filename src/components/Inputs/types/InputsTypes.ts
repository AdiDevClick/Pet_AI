import type { Dispatch, HTMLProps, SetStateAction } from "react";
import type { UniqueSet } from "@/lib/UniqueSet.ts";

export type ImageInputProps<
   T extends {
      error: UniqueSet<string, string[]>;
      inputImages: UniqueSet<string, HTMLImageElement>;
   }
> = {
   item?: {
      id: string;
      label: string;
   };
   index?: number;
   setter: Dispatch<SetStateAction<T>>;
   state: T;
} & HTMLProps<HTMLDivElement>;
