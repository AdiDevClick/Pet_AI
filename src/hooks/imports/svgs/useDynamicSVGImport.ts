import type { UseDynamicSVGImportTypes } from "@/hooks/imports/svgs/useDynamicSVGImportTypes";
import { useEffect, useState, type ComponentType } from "react";

const icons = import.meta.glob("/src/assets/icons/*.svg", {
   import: "default",
});

/**
 * Custom hook to dynamically import SVG icons.
 *
 * @param icon - The icon to import.
 * @param options - Additional options for the import.
 */
export function useDynamicSVGImport({
   icon,
   options = {},
}: UseDynamicSVGImportTypes) {
   const [SvgIcon, setSvgIcon] = useState<
      ComponentType<React.SVGProps<SVGSVGElement>>
   >(null!);
   const [error, setError] = useState("");

   /**
    * Dynamically imports the SVG icon based on the provided path.
    *
    * @description This uses the `import.meta.glob` to find the icon file and imports it.
    */
   useEffect(() => {
      const importIcon = async () => {
         try {
            const key = `/src/assets/icons/${icon.path}.svg`;
            if (!icons[key]) {
               throw new Error(`Icon not found: ${key}`);
            }
            const path = key + "?react";
            const module = await import(/* @vite-ignore */ path);
            setSvgIcon(() => module.default);
         } catch (error) {
            setError((error as Error).message);
         }
      };
      importIcon();
   }, [icon]);

   return { SvgIcon, error };
}
