import { useRef, type ChangeEvent } from "react";
import "@css/image-input.scss";
import { Button } from "@/components/Buttons/Button.tsx";
import {
   ACCEPTED_FILE_MIME_TYPES,
   FILE_MIME_NOT_ACCEPTED_ERROR,
   FILE_SIZE_LIMIT_EXCEEDED_ERROR,
   MAX_FILE_SIZE,
} from "@/configs/file.config.ts";

export function ImageInput({ setPageState, pageState, previewId, ...props }) {
   const imagePreviewRef = useRef<HTMLDivElement>(null!);
   const inputRef = useRef<HTMLInputElement>(null!);

   const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
      const target = event.target;
      const file = target.files?.[0];
      const errors: string[] = [];

      if (file) {
         if (file.size > MAX_FILE_SIZE) {
            errors.push(FILE_SIZE_LIMIT_EXCEEDED_ERROR);
         }

         if (!ACCEPTED_FILE_MIME_TYPES.includes(file.type)) {
            errors.push(FILE_MIME_NOT_ACCEPTED_ERROR);
         }

         if (errors.length > 0) {
            target.classList.remove("filled");
            imagePreviewRef.current.removeAttribute("style");
            setPageState((prev) => ({
               ...prev,
               error: prev.error.set(inputRef.current.id, errors),
               inputImages: prev.inputImages
                  .clone()
                  .delete(inputRef.current.id),
            }));
            return;
         }

         // Add image preview to the card
         const image = new Image();
         image.src = URL.createObjectURL(file);

         target.classList.add("filled");
         imagePreviewRef.current.style.backgroundImage = `url(${image.src})`;

         setPageState((prev) => ({
            ...prev,
            error: prev.error.has(inputRef.current.id)
               ? prev.error.clone().delete(inputRef.current.id)
               : prev.error,
            inputImages: prev.inputImages
               .clone()
               .set(inputRef.current.id, image),
         }));

         // Clear previous errors for this input
      } else {
         target.classList.remove("filled");
         imagePreviewRef.current.removeAttribute("style");
      }
   };

   return (
      <div ref={imagePreviewRef} className="image-preview" {...props}>
         <label
            className="image-preview__title"
            htmlFor={`image-upload-${previewId}`}
         >
            {props.label}
         </label>
         <input
            ref={inputRef}
            className="image-preview__input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            id={`image-upload-${previewId}`}
         />
         <Button>Sélectionner une image</Button>
         <p className="image-preview__info">jpg, png : 10mo max</p>
      </div>
   );
}
