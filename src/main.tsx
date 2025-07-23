import { StrictMode, Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from '@/App.tsx';
import {
    createBrowserRouter,
    Navigate,
    Outlet,
    RouterProvider,
} from 'react-router-dom';
import { PageError } from '@/Pages/Error/PageError.tsx';
import { ComparePets } from '@/Pages/Compare/ComparePets';
import { Header } from '@/components/Header/Header.tsx';
import { TrainModel } from '@/Pages/TrainModel/TrainModel.tsx';
import { ScrollTop } from '@/components/Buttons/ScrollTop.tsx';
import { Controls } from '@/components/Controls/Controls.tsx';
import {
    loadDefaultDataArray,
    loadModel,
    loadNewImages,
    predictAllImages,
    resetSystem,
    saveData,
    saveModel,
    trainModel,
    validateAllImages,
} from '@/components/Controls/controlsFunctions.ts';
import { Home } from '@/Pages/Home/Home.tsx';
import { Footer } from '@/components/Footer/Footer.tsx';

const router = createBrowserRouter(
    [
        {
            path: '/',
            element: <Root />,
            errorElement: <Root contentType={'error'} />,
            children: [
                { index: true, element: <Home /> },
                {
                    path: 'compare',
                    element: <ComparePets />,
                },
                // {
                //     path: 'contact',
                //     element: <Outlet />,
                //     children: [
                //         {
                //             path: ':id',
                //             element: <Outlet />,
                //         },
                //     ],
                // },
                {
                    path: 'train-model',
                    element: <TrainModel />,
                },
                {
                    path: 'error',
                    element: (
                        <Suspense fallback={null}>
                            <PageError />
                        </Suspense>
                    ),
                },
                {
                    path: '*',
                    element: <Navigate to="/error" replace />,
                },
            ],
        },
    ]
    // { basename: baseUrl }
);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);

let functionProps = {};
const buttons = [
    {
        label: '🔄 Nouvelles Images',
        className: 'primary',
        functions: { onClick: (e) => loadNewImages({ e, ...functionProps }) },
    },
    {
        label: '🗑️ Réinitialiser',
        className: 'danger',
        functions: { onClick: (e) => resetSystem({ e, ...functionProps }) },
    },
    {
        label: '✅ Valider toutes les Images',
        className: 'success',
        functions: {
            onClick: (e) => validateAllImages({ e, ...functionProps }),
        },
    },
    {
        label: '🔮 Prédire Tout',
        className: 'success',
        functions: {
            onClick: (e) => predictAllImages({ e, ...functionProps }),
        },
    },
    {
        label: '🔧 Entraîner le Modèle',
        className: 'success',
        functions: {
            onClick: (e) => trainModel({ e, ...functionProps }),
        },
    },
    {
        label: '💾 Sauvegarder le modèle',
        className: 'primary',
        functions: { onClick: (e) => saveModel({ e, ...functionProps }) },
    },
    {
        label: '📂 Charger le modèle',
        className: 'primary',
        functions: { onClick: (e) => loadModel({ e, ...functionProps }) },
    },
    {
        label: '💾 Sauvegarder les données',
        className: 'primary',
        functions: { onClick: (e) => saveData({ e }) },
    },
    {
        label: '📂 Charger les données de comparaison par défaut',
        className: 'primary',
        functions: { onClick: (e) => loadDefaultDataArray({ e }) },
    },
];

export function Root(contentType: { contentType?: string }) {
    const errorContent = contentType.contentType === 'error';

    const [onLoad, setOnLoad] = useState(true);
    const [resetSystem, setResetSystem] = useState(false);
    const [count, setCount] = useState(0);
    const [predictionsCount, setPredictionsCount] = useState(0);
    const [trainingCount, setTrainingCount] = useState(0);
    const [accuracy, setAccuracy] = useState(0);
    const [showClassifier, setShowClassifier] = useState(true);

    // useEffect(() => {
    //     // Initialiser le classificateur d'images
    //     if (window.imageClassifier) {
    //         window.imageClassifier.createModel().then((success) => {
    //             if (success) {
    //                 setShowClassifier(true);
    //             } else {
    //                 console.error('Échec de la création du modèle');
    //             }
    //         });
    //     } else {
    //         console.error('Le classificateur d\'images n\'est pas disponible');
    //     }
    // }, []);

    useEffect(() => {
        if (resetSystem) {
            setOnLoad(true);
            setCount(0);
            setPredictionsCount(0);
            setTrainingCount(0);
            setAccuracy(0);
            setShowClassifier(false);

            const timer = setTimeout(() => {
                setResetSystem(false);
            }, 2000);
            return () => clearTimeout(timer);
            // } else {
            //     setOnLoad(true);
        }
    }, [resetSystem]);

    functionProps = {
        ...functionProps,
        accuracy,
        onLoad,
        setOnLoad,
        predictionsCount,
        setPredictionsCount,
        trainingCount,
        setTrainingCount,
        setCount,
        count,
        setResetSystem,
        resetSystem,
    };

    return (
        <>
            <Header />
            <Controls buttons={buttons} />
            <App>
                {errorContent ? (
                    <PageError />
                ) : (
                    <Outlet context={functionProps} />
                )}
            </App>
            <ScrollTop />
            <Footer />
        </>
    );
}
