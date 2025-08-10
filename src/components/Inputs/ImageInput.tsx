import { useRef, type ChangeEvent } from "react";
import "@css/image-input.scss";
import { Button } from "@/components/Buttons/Button.tsx";
import type { ImageInputProps } from "@/components/Inputs/types/InputsTypes.ts";
import { updateState, verifyFile } from "@/lib/utils.ts";
import { UniqueSet } from "@/lib/UniqueSet.ts";

/**
 * Input containing an image upload field.
 *
 * @description This component allows users to
 * select an image file.
 * The image will then be displayed as a preview.
 *
 * @param item - `Optional` The item associated with the image input.
 * @param index - `Optional` The index of the image input.
 * @param setter - The function to update the page state.
 * @param state - The current page state.
 * @param props - This accepts any `HTMLDivElement` props.
 */
export function ImageInput<
   T extends {
      error: UniqueSet<string, string[]>;
      inputImages: UniqueSet<string, HTMLImageElement>;
   }
>({ index, setter, state, ...props }: ImageInputProps<T>) {
   const imagePreviewRef = useRef<HTMLDivElement>(null!);
   const inputRef = useRef<HTMLInputElement>(null!);

   const inputId = `image-upload-${props?.id ?? ""}`;
   const inputLabel = props?.label ?? "Ajoutez votre image";

   const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
      const target = event.target;
      const file = target.files?.[0];

      if (file) {
         const errors = verifyFile(file);

         if (errors.length > 0) {
            resetInputVisualAndStyles(target, imagePreviewRef.current);

            updateState(
               {
                  // Clear previous errors for this input
                  // And add new ones
                  error: (prev) =>
                     prev
                        .delete(inputRef.current.id)
                        .set(inputRef.current.id, errors),
                  inputImages: (prev) => prev.delete(inputRef.current.id),
               } as Parameters<typeof updateState<T>>[0],
               setter
            );
            return;
         }
         const image = new Image();
         image.src = URL.createObjectURL(file);

         // Add image preview to the card
         target.classList.add("filled");
         imagePreviewRef.current.style.backgroundImage = `url(${image.src})`;
         updateState(
            {
               error: (prev) => prev.delete(inputRef.current.id),
               inputImages: (prev) => prev.set(inputRef.current.id, image),
            } as Parameters<typeof updateState<T>>[0],
            setter
         );
      } else {
         resetInputVisualAndStyles(target, imagePreviewRef.current);
      }
   };

   return (
      <div ref={imagePreviewRef} className="image-preview" {...props}>
         <label className="image-preview__title" htmlFor={inputId}>
            {inputLabel}
         </label>
         <input
            ref={inputRef}
            className="image-preview__input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            id={inputId}
         />
         <Button>Sélectionner une image</Button>
         <p className="image-preview__info">jpg, png : 10mo max</p>
      </div>
   );
}

function resetInputVisualAndStyles(
   input: HTMLInputElement,
   preview: HTMLDivElement
) {
   input.classList.remove("filled");
   preview.removeAttribute("style");
}
