import type { DownloadFileFromDataProps } from "@/hooks/download/types/useDownloadFileFromDataTypes";
import { useEffect, useState } from "react";

/**
 * Custom hook to download a file from data.
 *
 * @description This hook creates a downloadable file
 * from the provided data and triggers the download.
 *
 * @param data - The data to be downloaded as a file.
 * @param setState - Function to update the state after the download.
 * @param fileName - Optional name for the downloaded file, defaults to 'download.json'.
 */
export function useFileDownloadHandler<T extends Record<string, unknown>>({
   data,
   setState,
   fileName = "download.json",
}: DownloadFileFromDataProps<T>) {
   const [a, _] = useState<HTMLAnchorElement>(document.createElement("a"));
   useEffect(() => {
      if (!data) {
         return;
      }

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });

      const url = URL.createObjectURL(blob);

      a.href = url;
      a.download = fileName;

      a.click();

      URL.revokeObjectURL(url);

      // Reset the download state after the file is downloaded
      setState((prev) => ({
         ...prev,
         download: { state: false, data: null },
         id: null,
      }));
   }, [data]);

   return { downloadState: data };
}
