import { Button } from '@/components/Buttons/Button.tsx';
import { GenericCard } from '@/components/Cards/GenericCard.tsx';
import { useTensorFlowScript } from '@/hooks/useTensorFlowScript';
import { MouseEvent, useState } from 'react';

export function TrainingCard({
    image,
    animalName,
}: {
    image: { id: string; url: string; description: string };
    animalName: string;
}) {
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [showPrediction, setShowPrediction] = useState(false);
    const [prediction, setPrediction] = useState<any>(null);
    const { addTrainingData, predict } = useTensorFlowScript();

    let className = '';

    if (isCorrect) {
        className = 'selected-correct';
    }
    if (isCorrect === false) {
        className = 'selected-incorrect';
    }

    const handleUserResults = async (
        e: MouseEvent<HTMLButtonElement>,
        selectedCorrect: boolean
    ) => {
        e.preventDefault();
        setIsCorrect(selectedCorrect);

        const img = document
            .getElementById(`card-${image.id}`)
            ?.querySelector('img');
        // const img = cardElement?.querySelector('img');
        // const img = e.target
        //     .closest('.images-grid__card')
        //     ?.querySelector('img');

        if (img && img.complete) {
            await addTrainingData(img, selectedCorrect);
        }
    };

    const handlePredict = async (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        const img = document
            .getElementById(`card-${image.id}`)
            ?.querySelector('img');
        // const img = cardElement?.querySelector('img');

        if (img && img.complete) {
            const result = await predict(img);
            if (result) {
                setPrediction(result);
                setShowPrediction(true);
            }
        }
    };

    return (
        <GenericCard className={className} id={`card-${image.id}`}>
            <figure>
                <img
                    src={image.url}
                    alt={`Image ${image.description}`}
                    crossOrigin={'anonymous'}
                />
                <figcaption className="card__description">
                    {image.description}
                </figcaption>
            </figure>
            <div className="card__actions">
                <Button
                    className="success"
                    onClick={(e) => handleUserResults(e, true)}
                >
                    ✓ Correct
                </Button>
                <Button
                    className="danger"
                    onClick={(e) => handleUserResults(e, false)}
                >
                    ✗ Incorrect
                </Button>
                <Button className="primary" onClick={handlePredict}>
                    🔮 Prédire
                </Button>
            </div>
            {isCorrect !== null && (
                <div
                    className="card__feedback"
                    id={`feedback-${image.id}`}
                    style={{ color: isCorrect ? 'green' : 'red' }}
                >
                    {isCorrect ? '✅ Bonne réponse!' : '❌ Mauvaise réponse'}
                    <br />
                    <small>
                        Réalité: {isCorrect ? animalName : 'Autre animal'}
                    </small>
                </div>
            )}
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
        </GenericCard>
    );
}
