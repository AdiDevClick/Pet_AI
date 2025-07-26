import { AlertDialogButton } from '@/components/Alerts/AlertDialogButton';
import { Button } from '@/components/Buttons/Button';
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
import '@css/controls.scss';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

let functionProps = {};
const clickableButtons = [
    {
        id: 'controls-button-0',
        label: '🔄 Nouvelles Images',
        className: 'primary',
        functions: { onClick: (e) => loadNewImages({ e, ...functionProps }) },
    },
    {
        id: 'controls-button-1',
        label: '🗑️ Réinitialiser',
        className: 'danger',
        functions: { onClick: (e) => resetSystem({ e, ...functionProps }) },
    },
    {
        id: 'controls-button-2',
        label: '✅ Valider toutes les Images',
        className: 'success',
        functions: {
            onClick: (e) => validateAllImages({ e, ...functionProps }),
        },
    },
    {
        id: 'controls-button-3',
        label: '🔮 Prédire Tout',
        className: 'success',
        functions: {
            onClick: (e) => predictAllImages({ e, ...functionProps }),
        },
    },
    {
        id: 'controls-button-4',
        label: '🔧 Entraîner le Modèle',
        className: 'success',
        functions: {
            onClick: (e) => trainModel({ e, ...functionProps }),
        },
    },
    {
        id: 'controls-button-5',
        label: '💾 Sauvegarder le modèle',
        className: 'primary',
        functions: { onClick: (e) => saveModel({ e, ...functionProps }) },
    },
    {
        id: 'controls-button-6',
        label: '📂 Charger le modèle',
        className: 'primary',
        functions: { onClick: (e) => loadModel({ e, ...functionProps }) },
        context: {
            error: {
                cancelable: true,
                retryButtonText: 'Nouveau fichier',
                functions: {
                    onClick: (e) => loadModel({ e, ...functionProps }),
                },
                title: 'Erreur de chargement',
                message: '⚠️ Aucun modèle sauvegardé trouvé',
            },
        },
    },
    {
        id: 'controls-button-7',
        label: '💾 Sauvegarder les données',
        className: 'primary',
        functions: { onClick: (e) => saveData({ e }) },
    },
    {
        id: 'controls-button-8',
        label: '📂 Charger les données de comparaison par défaut',
        className: 'primary',
        functions: { onClick: (e) => loadDefaultDataArray({ e }) },
    },
];

export function Controls({ buttons = clickableButtons }) {
    const { ...context } = useOutletContext();
    const [isSuccess, setIsSuccess] = useState({});
    functionProps = { ...functionProps, ...context, setIsSuccess, isSuccess };
    return (
        <section className="controls">
            {buttons.map((button, index) => (
                <AlertDialogButton
                    key={`alert-${index}`}
                    open={!isSuccess.status && isSuccess.id === button.id}
                    onOpenChange={setIsSuccess}
                    context={{
                        ...button.context?.error,
                        error: isSuccess.error,
                    }}
                >
                    <Button
                        id={button.id}
                        className={button.className}
                        {...button.functions}
                    >
                        {button.label}
                    </Button>
                </AlertDialogButton>
            ))}
        </section>
    );
}
