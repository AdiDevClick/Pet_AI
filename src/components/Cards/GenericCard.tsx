import { HTMLAttributes, ReactNode } from 'react';

export function GenericCard<T extends HTMLAttributes<HTMLDivElement>>({
    children,
    ...props
}: {
    children: ReactNode;
} & T) {
    return (
        <div
            {...props}
            className={`card ${props.className ? props.className : ''}`}
        >
            {children}
        </div>
    );
}
