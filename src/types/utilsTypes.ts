/**
 * Utility type to extract only methods from an object type if true.
 * If false, it extracts only non-methods.
 *
 * @template T - The object type to extract methods from.
 * @template B - A boolean to determine if the methods should be included or excluded.
 * If `true`, only methods are included; if `false`, only non-methods are included.
 */
export type OnlyMethods<T, B extends boolean> = {
   [K in keyof T as T[K] extends (...args: any[]) => any
      ? B extends true
         ? K
         : never
      : B extends false
      ? K
      : never]: T[K];
};
