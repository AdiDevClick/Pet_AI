import { useAnimalIdentification } from '@/hooks/models/useAnimalIdentification.ts';
import { createContext, type ReactNode } from 'react';

export const appContext = createContext(null!);
/**
 * @description This component serves as the main layout for the application, wrapping all child components.
 *
 * @param children - The children components to be rendered inside the main container.
 * @returns
 */
export function App({ children }: { children: ReactNode }) {
    const animalModel = useAnimalIdentification();
    return (
        <>
            <appContext.Provider value={{ ...animalModel }}>
                <main className="main-container">{children}</main>
            </appContext.Provider>
        </>
    );
}

// const WithApp = (Component) => (props) => {
//     return (
//         <App>
//             <Component {...props} />
//         </App>
//     );
// };
