import {
   ACCEPTED_FILE_MIME_TYPES,
   FILE_MIME_NOT_ACCEPTED_ERROR,
   FILE_SIZE_LIMIT_EXCEEDED_ERROR,
   MAX_FILE_SIZE,
} from "@/configs/file.config.ts";
import { UniqueSet } from "@/lib/UniqueSet.ts";
import type { CustomError } from "@/mainTypes.ts";
import { clsx, type ClassValue } from "clsx";
import type { Dispatch, SetStateAction } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs));
}

/**
 * Crer une promesse qui se resoudra
 * après un délai défini en paramètre
 * @param duration - La durée de l'attente
 * @param message - Message à retourner dans la promesse si besoin
 */
export function wait(duration: number, message = "") {
   return new Promise((resolve) => {
      setTimeout(() => {
         resolve(message);
      }, duration);
   });
}
/**
 * Update the state with new values.
 * @description This function merges the new state object.
 */
export function updateState<K extends object>(
   newState: {
      [P in keyof K]?: K[P] | ((prev: K[P]) => K[P]);
   },
   setter: Dispatch<SetStateAction<K>>
) {
   setter((prev: K) => {
      return Object.entries(newState).reduce(
         (acc, [key, value]) => {
            const k = key as keyof K;
            const prevValue = prev[k];

            // If it's a Set, Map, UniqueSet and the value is a function
            // We clone the previous value and apply the function
            if (
               typeof prevValue === "object" &&
               prevValue instanceof UniqueSet &&
               typeof value === "function"
            ) {
               const clonedPrevValue = prevValue.clone();
               return {
                  ...acc,
                  [k]: value(clonedPrevValue),
               };
            }
            // The preview key is not an array
            // we simply assign the new value
            if (!Array.isArray(prevValue)) {
               return {
                  ...acc,
                  [k]: value,
               };
            }
            // If the previous value is an array
            // We spread it
            if (Array.isArray(value)) {
               return {
                  ...acc,
                  [k]: [...prevValue, ...value],
               };
            }
            // If the new value is not an array
            // We simply push it to the array
            return {
               ...acc,
               [k]: [...prevValue, value],
            };
         },
         { ...prev }
      );
   });
}

/**
 * Create a generic error object from an error.
 *
 * @description This function creates a generic error object
 * that can be used to handle errors in a consistent way.
 *
 * It extracts the message and status from the error object.
 * If the error is a CustomError, it uses its cause properties.
 * If not, it uses the error message and a default status of 500.
 * @param error - The error object to convert.
 *
 * @returns An object containing the error message and status.
 * @example
 *
 * > ```ts
 * > const error = new Error("Something went wrong");
 * > const genericError = genericErrorObject(error);
 * > console.log(genericError);
 *
 * > **Output:**
 *
 * > ```ts
 * > {
 * >   error: {
 * >     message: "Something went wrong",
 * >     status: 500
 * >   }
 * > }
 *  ```
 * @see CustomError
 */
export function genericErrorObject(error: unknown, additionalInfo = {}) {
   return {
      error: {
         message:
            (error as CustomError).cause?.message || (error as Error).message,
         status: (error as CustomError).cause?.status || 500,
         ...additionalInfo,
      },
   };
}

/**
 * Checks the file's validity.
 * @param file File to verify.
 * @returns An array of errors, empty if the file is valid.
 */
export function verifyFile(file: File) {
   const errors: string[] = [];

   if (file.size > MAX_FILE_SIZE) {
      errors.push(FILE_SIZE_LIMIT_EXCEEDED_ERROR);
   }

   if (!ACCEPTED_FILE_MIME_TYPES.includes(file.type)) {
      errors.push(FILE_MIME_NOT_ACCEPTED_ERROR);
   }

   return errors;
}
