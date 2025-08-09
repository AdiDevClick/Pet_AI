import type { HTMLAttributes, Ref } from "react";

export type GenericFigureProps = HTMLAttributes<HTMLElement> & {
   ref: Ref<HTMLImageElement>;
   description?: string;
   id?: string | number;
   image?: string;
};
