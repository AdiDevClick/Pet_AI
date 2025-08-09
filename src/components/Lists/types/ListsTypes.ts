import type { ReactElement, ReactNode } from "react";

export type GenericListProps<T> = {
   items: T[];
   children:
      | ReactElement<Partial<{ item: T; index: number }>>
      | ((item: T, index: number) => ReactNode);
};

export type GenericList<T> =
   | ReactElement<Partial<{ item: T; index: number }>>
   | ReactNode;
