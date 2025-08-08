import type { HTMLAttributes, ReactNode } from "react";

export type GenericCardProps<T = unknown> = {
   children: ReactNode;
   item?: T;
   index?: number;
} & HTMLAttributes<HTMLDivElement>;
