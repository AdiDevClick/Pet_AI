import type { ReactNode } from "react";

export type GenericListProps<T> = {
   items: T[];
   children: (item: T, index: number) => ReactNode;
};
