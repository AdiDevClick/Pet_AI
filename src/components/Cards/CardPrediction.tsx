import { HTMLAttributes } from 'react';

export function CardPrediction<T extends HTMLAttributes<HTMLDivElement>>({
    showPrediction,
    prediction,
    animalName = 'les mêmes animaux',
    image,
}: {
    animalName?: string;
    showPrediction: boolean;
    prediction: { prediction: boolean; confidence: number } | null;
    image: { id: string; url: string; description: string };
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
                    {prediction.prediction
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
