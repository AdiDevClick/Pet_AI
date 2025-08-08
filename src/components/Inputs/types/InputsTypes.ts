import type { PageState } from "@/Pages/Compare/types/CompareTypes.ts";

export type ImageInputProps = {
   item?: {
      id: string;
      label: string;
      previewId: string;
   };
   index?: number;
   setPageState: React.Dispatch<React.SetStateAction<PageState>>;
   [key: string]: any;
};
