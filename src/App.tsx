import { AnimalModelProvider } from '@/api/context/animalContext/AnimalModelContext.tsx';
import type { ReactNode } from 'react';

/**
 * @description This component serves as the main layout for the application, wrapping all child components.
 *
 * @param children - The children components to be rendered inside the main container.
 * @returns
 */
export function App({ children }: { children: ReactNode }) {
    return (
        <AnimalModelProvider>
            <main className="main-container">{children}</main>
        </AnimalModelProvider>
    );
}
