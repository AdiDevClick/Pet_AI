import type { ReactElement, ReactNode } from "react";

export type ListMapperProps<T> = {
   items: T[];
   children:
      | ReactElement<Partial<{ item: T; index: number }>>
      | ((item: T, index: number) => ReactNode);
};

export type ListMapper<T> =
   | ReactElement<Partial<{ item: T; index: number }>>
   | ReactNode;
