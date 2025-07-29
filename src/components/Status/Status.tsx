import '@css/stats.scss';
import '@css/generic-layout.scss';
import {
    use,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { GenericTitle } from '@/components/Texts/GenericTitle.tsx';
import { useOutletContext } from 'react-router-dom';
import { appContext } from '@/App.tsx';

export function Status() {
    const { resetSystem } = useOutletContext();
    const { isInitialized, status } = use(appContext);

    const contextPropsMemo = useMemo(
        () => ({
            resetSystem,
            isInitialized,
            status,
        }),
        [resetSystem, isInitialized, status]
    );

    const microOutDivRef = useRef<HTMLDivElement>(null!);
    const [message, setMessage] = useState<ReactNode>(
        "🚀 Initialisation du classificateur d'images..."
    );
    const [resultsMessage, setResultsMessage] = useState<ReactNode>(
        'Aucune comparaison effectuée'
    );
    // const { trainingCount, accuracy, predictionCount } = useTensorFlowScript();
    // const { isInitialized, status } = useAnimalIdentification();

    useEffect(() => {
        if (contextPropsMemo.resetSystem) {
            setMessage(
                <>
                    <strong>🔄 Système réinitialisé!</strong>
                    <br />
                    <small>✓ Prêt pour un nouvel entraînement</small>
                </>
            );
        } else if (contextPropsMemo.isInitialized) {
            setMessage(
                <>
                    <small>✓ Prêt pour l'entraînement interactif</small>
                </>
            );
        }
    }, [contextPropsMemo.resetSystem, contextPropsMemo.isInitialized]);

    useEffect(() => {
        if (microOutDivRef.current && contextPropsMemo.isInitialized) {
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
        if (microOutDivRef.current && !contextPropsMemo.isInitialized) {
            setMessage(
                <>
                    <strong>🔄 Chargement du modèle...</strong>
                    <br />
                    <small>Veuillez patienter pendant l'initialisation</small>
                </>
            );
        }
    }, [contextPropsMemo.isInitialized]);

    return (
        <div className="generic-layout stats-container">
            <div ref={microOutDivRef} id="micro-out-div">
                {message}
            </div>
            <GenericTitle>📊 Statistiques de Comparaison</GenericTitle>
            <div className="stats">
                <div className="stats__item">
                    <div className="stats__value" id="training-count">
                        {contextPropsMemo.status.trainingPairs.length}
                    </div>
                    <div className="stats__label">Paires d'entraînement</div>
                </div>
                <div className="stats__item">
                    <div className="stats__value" id="accuracy">
                        {contextPropsMemo.status.accuracy}%
                    </div>
                    <div className="stats__label">Précision du modèle</div>
                </div>
                <div className="stats__item">
                    <div className="stats__value" id="comparisons-count">
                        {contextPropsMemo.status.comparisons}
                    </div>
                    <div className="stats__label">Comparaisons effectuées</div>
                </div>
                <div className="stats__item">
                    <div className="stats__value" id="balance">
                        <span style={{ color: 'green', marginLeft: 6 }}>
                            {`▲ ${contextPropsMemo.status.balance.positive} `}
                        </span>
                        /
                        <span
                            style={{ color: 'red', marginLeft: 6 }}
                        >{`▼ ${contextPropsMemo.status.balance.negative}`}</span>
                    </div>
                    <div className="stats__label">
                        Equilibre de l'entraînement
                    </div>
                </div>
            </div>
            <div className="generic-layout__alert">{resultsMessage}</div>
        </div>
    );
}
