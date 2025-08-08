import type { ReactElement, ReactNode } from "react";

export type GenericListProps<T> = {
   items: T[];
   children: ReactElement | ((item: T, index: number) => ReactNode);
};
