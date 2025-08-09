import type { GenericFigureProps } from "@/components/Images/types/imagesTypes.ts";
import { useId } from "react";

/**
 * Generic figure component for displaying
 * an image with a description.
 *
 * @param ref - The ref to the image element.
 * @param item - The item containing image data and description.
 * @param props - Additional HTML attributes for the figure element.
 */
export function GenericFigure(props: GenericFigureProps) {
   const { ref, image, description, className, ...rest } = props;
   const id = useId();

   return (
      <figure {...rest} className={"generic-layout-figure"}>
         <img
            ref={ref}
            id={`figure-${id}`}
            src={image}
            alt={`Image ${description}`}
            crossOrigin={"anonymous"}
            className={"figure__image"}
         />
         <figcaption className={`figure__caption ${className || ""}`}>
            {description}
         </figcaption>
      </figure>
   );
}
