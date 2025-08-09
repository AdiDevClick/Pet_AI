import type { clickableButtons } from "@/configs/controls.config.ts";
import type { useAnimalIdentification } from "@/hooks/models/useAnimalIdentification.ts";
import type { contextTypes } from "@/mainTypes.ts";
import type { OnlyMethods } from "@/types/utilsTypes.ts";
import type { Dispatch, MouseEvent, SetStateAction } from "react";

export type LoadModelTypes = {
   e: MouseEvent<HTMLButtonElement>;
} & ControlsFunctionPropsTypes;

export type ControlsClickableButtonTypes<T> = {
   [key: string]: T;
};
export type ControlsErrorType = {
   status: string | number;
   message: string;
} | null;

export interface ControlsFunctionPropsTypes
   extends contextTypes,
      ControlsStateTypes,
      OnlyMethods<ReturnType<typeof useAnimalIdentification>, true> {
   setButtonsState: Dispatch<SetStateAction<ControlsStateTypes>>;
}

export type ControlsStateTypes<E = ControlsErrorType> = {
   status: boolean;
   id: string | null;
   error: E;
   openModal: boolean;
   download: { state: boolean; data: null };
   upload: { state: boolean; data: null };
};

export type GenericButtonsProps = {
   e: MouseEvent<HTMLButtonElement>;
} & ControlsFunctionPropsTypes;

export type ControlsPropsTypes = {
   buttons?: typeof clickableButtons;
};
