import { HTMLAttributes, ReactNode } from 'react';

export function GenericGrid<T extends HTMLAttributes<HTMLDivElement>>({
    children,
    ...props
}: {
    children: ReactNode;
} & T) {
    return (
        <div
            {...props}
            className={`generic-grid_container ${
                props.className ? props.className : ''
            }`}
        >
            {children}
        </div>
    );
}
