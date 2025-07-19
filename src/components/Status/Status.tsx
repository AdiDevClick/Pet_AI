import '@css/status.scss';
import { ReactNode, useEffect, useRef, useState } from 'react';

export function Status({
    trainingCount,
    accuracy,
    predictionsCount,
    resetSystem,
    setResetSystem,
}) {
    const microOutDivRef = useRef<HTMLDivElement>(null!);
    const [message, setMessage] = useState<ReactNode>(
        "🚀 Initialisation du classificateur d'images..."
    );

    useEffect(() => {
        if (resetSystem) {
            setMessage(
                <>
                    <strong>🔄 Système réinitialisé!</strong>
                    <br />
                    <small>Prêt pour un nouvel entraînement</small>
                </>
            );
        } else {
            setMessage(
                <>
                    <small>Prêt pour l'entraînement interactif</small>
                </>
            );
        }
    }, [resetSystem]);

    useEffect(() => {
        if (microOutDivRef.current) {
            setMessage(
                <>
                    <strong>🤖 Classificateur d'Images IA Prêt!</strong>
                    <br />
                    <small>Modèle CNN initialisé avec succès</small>
                    <br />
                    <small>Prêt pour l'entraînement interactif</small>
                </>
            );
        }
    }, []);

    return (
        <div className="status">
            <div ref={microOutDivRef} id="micro-out-div">
                {message}
            </div>
            <div className="stats">
                <div className="stats__item">
                    <div className="stats__value" id="training-count">
                        {trainingCount}
                    </div>
                    <div className="stats__label">Échantillons</div>
                </div>
                <div className="stats__item">
                    <div className="stats__value" id="accuracy">
                        {accuracy}%
                    </div>
                    <div className="stats__label">Précision</div>
                </div>
                <div className="stats__item">
                    <div className="stats__value" id="predictions-count">
                        {predictionsCount}
                    </div>
                    <div className="stats__label">Prédictions</div>
                </div>
            </div>
        </div>
    );
}
