import type {
   FileState,
   UploadAFile,
   UploadAFileTypes,
} from "@/hooks/upload/uploadTypes.ts";
import type { CustomError } from "@/mainTypes.ts";
import { useCallback, useEffect, useState } from "react";

const defaultState = {
   file: null,
   fileContent: "",
   results: null,
   error: { status: "", message: "" },
} as const;

Object.freeze(defaultState);

/**
 * Custom hook to handle file upload and processing.
 *
 * @param exploreFiles - Use this object to determine if the upload state is active.
 * @param exploreFiles.state - Boolean indicating if the file upload is active.
 * @param exploreFiles.data - The data to be uploaded, if any.
 * @param functionToCall - The function to call with the file content.
 * @returns An object containing the file content, any error, and the results of the function call.
 */
export function useUploadAFile<K, T extends Record<string, unknown>>({
   exploreFiles,
   functionToCall,
}: UploadAFileTypes<K, T>): UploadAFile<T> {
   const [reader, _] = useState<FileReader>(new FileReader());
   const [uploadInput, setUploadInput] = useState<HTMLInputElement>(
      document.createElement("input")
   );
   const [fileState, setFileState] = useState<FileState<T>>(defaultState);

   /**
    * Calls the provided function with the file content.
    *
    * @param data - The data to be passed to the function should be parsed.
    */
   const callThisFunction = useCallback(
      async (data: K) => {
         if (functionToCall && data) {
            const results = await functionToCall(data);
            setFileState((prev) => ({
               ...prev,
               results,
            }));
         }
      },
      [functionToCall]
   );

   /**
    * Handles the file reading process.
    *
    * @param e - The progress event from the FileReader.
    * @throws Will throw an error if the file content is not a valid JSON string.
    */
   const onLoad = useCallback(
      (e: ProgressEvent<FileReader>) => {
         try {
            const fileContent = e.target?.result;

            if (!fileContent || typeof fileContent !== "string") {
               throw new Error("Ce fichier n'est pas compatible JSON", {
                  cause: {
                     status: 400,
                     message: "Ce fichier n'est pas compatible JSON",
                  },
               });
            }
            setFileState((prev) => ({
               ...prev,
               fileContent: fileContent,
            }));
         } catch (error) {
            setFileState({
               ...defaultState,
               error: {
                  message:
                     (error as CustomError).cause?.message ||
                     "Erreur lors de la lecture du fichier",
                  status: (error as CustomError).cause?.status || 500,
               },
            });
         }
      },
      [reader, fileState]
   );

   /**
    * This handles the file input change event.
    * It sets the file state with the selected file.
    */
   const onChange = useCallback(
      (e: Event) => {
         const target = e.target as HTMLInputElement;
         setFileState((prev) => ({
            ...prev,
            file: target.files && target.files[0],
         }));
      },
      [uploadInput]
   );

   /**
    * This sets the upload input to be clicked when the upload state is true.
    */
   useEffect(() => {
      if (exploreFiles.state && !exploreFiles.data) {
         uploadInput.id = "upload-input";
         uploadInput.type = "file";
         uploadInput.accept = ".json";

         uploadInput.onchange = onChange;
         reader.onload = onLoad;

         setUploadInput(uploadInput);
         uploadInput.click();
      }
   }, [exploreFiles.state, exploreFiles.data]);

   /**
    * This reads the file content when a file is selected.
    */
   useEffect(() => {
      if (fileState.file) {
         reader.readAsText(fileState.file);
      }
   }, [fileState.file]);

   /**
    * This handles the results after the file is read.
    */
   useEffect(() => {
      if (fileState.fileContent) {
         const parsedContent = JSON.parse(fileState.fileContent);
         callThisFunction(parsedContent);
      }
   }, [fileState.fileContent]);

   /**
    * This resets the upload state and file content when results are available.
    */
   useEffect(() => {
      if (fileState.results) {
         setFileState(defaultState);
         uploadInput.remove();
      }
   }, [fileState.results]);

   /**
    * This handles any errors that occur during file reading.
    * It updates the state with the error message and resets the upload state.
    */
   useEffect(() => {
      if (fileState.error) {
         uploadInput.remove();
      }
   }, [fileState.error]);

   return {
      fileContent: fileState.fileContent,
      fileError: fileState.error,
      fileResults: fileState.results,
   };
}
