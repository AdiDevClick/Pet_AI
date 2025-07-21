import { HTMLAttributes, Ref, useId } from 'react';

export function GenericFigure<T extends HTMLAttributes<HTMLDivElement>>({
    image,
    ref,
    ...props
}: {
    image: {
        url: string;
        description: string;
        id: string;
    };
    ref?: Ref<HTMLImageElement>;
} & T) {
    const id = useId();

    return (
        <figure {...props} className={'generic-layout-figure'}>
            <img
                ref={ref}
                id={`figure-${id}`}
                src={image.image}
                alt={`Image ${image.description}`}
                crossOrigin={'anonymous'}
                className={'figure__image'}
            />
            <figcaption className={`figure__caption ${props.className || ''}`}>
                {image.description}
            </figcaption>
        </figure>
    );
}
