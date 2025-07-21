import useAnimalIdentification from '@/hooks/useAnimalIdentification.ts';
import { useTensorFlowScript } from '@/hooks/useTensorFlowScript.ts';
import '@css/stats.scss';
import '@css/generic-layout.scss';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { GenericTitle } from '@/components/Texts/GenericTitle.tsx';

export function Status({
    // trainingCount,
    // accuracy,
    // predictionsCount,
    resetSystem,
    setResetSystem,
}) {
    const microOutDivRef = useRef<HTMLDivElement>(null!);
    const [message, setMessage] = useState<ReactNode>(
        "🚀 Initialisation du classificateur d'images..."
    );
    const [resultsMessage, setResultsMessage] = useState<ReactNode>(
        'Aucune comparaison effectuée'
    );
    const { trainingCount, accuracy, predictionCount } = useTensorFlowScript();
    const {
        isInitialized,
        isTraining,
        isComparing,
        stats,
        lastResult,
        addTrainingPair,
        trainModel,
        compareAnimals,
        resetModel,
        saveModel,
        loadModel,
    } = useAnimalIdentification();

    useEffect(() => {
        if (resetSystem) {
            setMessage(
                <>
                    <strong>🔄 Système réinitialisé!</strong>
                    <br />
                    <small>✓ Prêt pour un nouvel entraînement</small>
                </>
            );
        } else if (isInitialized) {
            setMessage(
                <>
                    <small>✓ Prêt pour l'entraînement interactif</small>
                </>
            );
        }
    }, [resetSystem, isInitialized]);

    useEffect(() => {
        if (microOutDivRef.current && isInitialized) {
            setMessage(
                <>
                    <strong>🤖 Classificateur d'Images IA Prêt!</strong>
                    <br />
                    <small>✓ Modèle CNN initialisé avec succès</small>
                    <br />
                    <small>✓ Prêt pour l'entraînement interactif</small>
                </>
            );
        }
        if (microOutDivRef.current && !isInitialized) {
            setMessage(
                <>
                    <strong>🔄 Chargement du modèle...</strong>
                    <br />
                    <small>Veuillez patienter pendant l'initialisation</small>
                </>
            );
        }
    }, [isInitialized]);

    return (
        <div className="generic-layout stats-container">
            <div ref={microOutDivRef} id="micro-out-div">
                {message}
            </div>
            <GenericTitle>📊 Statistiques de Comparaison</GenericTitle>
            <div className="stats">
                <div className="stats__item">
                    <div className="stats__value" id="training-count">
                        {trainingCount}
                    </div>
                    <div className="stats__label">Paires d'entraînement</div>
                </div>
                <div className="stats__item">
                    <div className="stats__value" id="accuracy">
                        {accuracy}%
                    </div>
                    <div className="stats__label">Précision du modèle</div>
                </div>
                <div className="stats__item">
                    <div className="stats__value" id="comparisons-count">
                        {predictionCount}
                    </div>
                    <div className="stats__label">Comparaisons effectuées</div>
                </div>
            </div>
            <div className="generic-layout__alert">{resultsMessage}</div>
        </div>
    );
}
