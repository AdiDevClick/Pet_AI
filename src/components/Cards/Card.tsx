import { Button } from '@/components/Buttons/Button.tsx';
import { useTensorFlowScript } from '@/hooks/useTensorFlowScript';
import { MouseEvent, useState } from 'react';

export function Card({
    image,
}: {
    image: { id: string; url: string; description: string };
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

    const handleClick = async (e: MouseEvent, selectedCorrect: boolean) => {
        e.preventDefault();
        setIsCorrect(selectedCorrect);
        
        // Intégration avec le script TensorFlow.js
        const img = (e.target as HTMLElement).closest('.images-grid__card')?.querySelector('img') as HTMLImageElement;
        if (img && img.complete) {
            await addTrainingData(img, selectedCorrect);
        }
    };

    const handlePredict = async () => {
        const cardElement = document.getElementById(`card-${image.id}`);
        const img = cardElement?.querySelector('img') as HTMLImageElement;
        
        if (img && img.complete) {
            const result = await predict(img);
            if (result) {
                setPrediction(result);
                setShowPrediction(true);
            }
        }
    };

    return (
        <div key={image.id} className={`images-grid__card ${className}`} id={`card-${image.id}`}>
            <figure>
                <img
                    src={image.url}
                    alt={`Image ${image.description}`}
                    crossOrigin={'anonymous'}
                />
                <figcaption className="image-description">
                    {image.description}
                </figcaption>
            </figure>
            <div className="image-actions">
                <Button
                    className="success"
                    onClick={(e) => handleClick(e, true)}
                >
                    ✓ Correct
                </Button>
                <Button
                    className="danger"
                    onClick={(e) => handleClick(e, false)}
                >
                    ✗ Incorrect
                </Button>
                <Button
                    className="primary"
                    onClick={handlePredict}
                >
                    🔮 Prédire
                </Button>
            </div>
            {isCorrect !== null && (
                <div
                    className="feedback"
                    id={`feedback-${image.id}`}
                    style={{ color: isCorrect ? 'green' : 'red' }}
                >
                    {isCorrect ? '✅ Bonne réponse!' : '❌ Mauvaise réponse'}
                    <br />
                    <small>
                        Réalité: {isCorrect ? 'Chat' : 'Autre animal'}
                    </small>
                </div>
            )}
            {showPrediction && prediction && (
                <div className="prediction-result" id={`prediction-${image.id}`}>
                    <strong>🔮 Prédiction IA:</strong><br />
                    {prediction.prediction === 'correct' ? '✅ Chat détecté' : '❌ Pas un chat'}<br />
                    <small>Confiance: {(prediction.confidence * 100).toFixed(1)}%</small>
                </div>
            )}
        </div>
    );
}
