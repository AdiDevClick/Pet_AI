import { HTMLAttributes, ReactNode } from 'react';

export function CardPrediction<T extends HTMLAttributes<HTMLDivElement>>({
    showPrediction,
    prediction,
    animalName,
    image,
}: {
    children: ReactNode;
} & T) {
    return (
        <>
            {showPrediction && prediction && (
                <div
                    className="prediction-result"
                    id={`prediction-${image.id}`}
                >
                    <strong>🔮 Prédiction IA:</strong>
                    <br />
                    {prediction.prediction === 'correct'
                        ? `✅ ${animalName} détecté`
                        : `❌ Pas ${animalName}`}
                    <br />
                    <small>
                        Confiance: {(prediction.confidence * 100).toFixed(1)}%
                    </small>
                </div>
            )}
        </>
    );
}
