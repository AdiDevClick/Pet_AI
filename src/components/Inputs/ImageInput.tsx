import { ChangeEvent, useRef, useState } from 'react';
import '@css/image-input.scss';
import { Button } from '@/components/Buttons/Button.tsx';
import {
    ACCEPTED_FILE_MIME_TYPES,
    FILE_MIME_NOT_ACCEPTED_ERROR,
    FILE_SIZE_LIMIT_EXCEEDED_ERROR,
    MAX_FILE_SIZE,
} from '@/configs/file.config.ts';

export function ImageInput({ ...props }) {
    const [errors, setErrors] = useState(new Map());
    const imagePreviewRef = useRef<HTMLDivElement>(null!);
    const inputRef = useRef<HTMLInputElement>(null!);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const target = event.target;
        const file = target.files?.[0];

        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                setErrors((prev) =>
                    prev.set(FILE_SIZE_LIMIT_EXCEEDED_ERROR, false)
                );
            }
            if (!ACCEPTED_FILE_MIME_TYPES.includes(file.type)) {
                setErrors((prev) =>
                    prev.set(FILE_MIME_NOT_ACCEPTED_ERROR, false)
                );
            }

            // Add image preview to the card
            const image = URL.createObjectURL(file);
            target.classList.add('filled');
            imagePreviewRef.current.style.backgroundImage = `url(${image})`;
        }
    };

    return (
        <div ref={imagePreviewRef} className="image-preview" {...props}>
            <label
                className="image-preview__title"
                htmlFor={`image-upload-${props.previewId}`}
            >
                {props.label}
            </label>
            <input
                ref={inputRef}
                className="image-preview__input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                id={`image-upload-${props.previewId}`}
            />
            <Button>Sélectionner une image</Button>
            <p className="image-preview__info">jpg, png : 10mo max</p>
        </div>
    );
}
