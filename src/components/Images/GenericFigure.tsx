import { HTMLAttributes } from 'react';

export function GenericFigure<T extends HTMLAttributes<HTMLDivElement>>({
    image,
    ...props
}: {
    image: {
        url: string;
        description: string;
    };
} & T) {
    return (
        <figure {...props} className={'generic-layout-figure'}>
            <img
                src={image.url}
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
