import { Button } from '@/components/Buttons/Button.tsx';
import { CardFeedback } from '@/components/Cards/CardFeedback.tsx';
import { CardPrediction } from '@/components/Cards/CardPrediction.tsx';
import { GenericCard } from '@/components/Cards/GenericCard.tsx';
import { GenericFigure } from '@/components/Images/GenericFigure.tsx';
import { useTensorFlowScript } from '@/hooks/useTensorFlowScript.ts';
import { HTMLAttributes, MouseEvent, ReactNode, useState } from 'react';

export function TrainingTwoCards<T extends HTMLAttributes<HTMLDivElement>>({
    children,
    images,
    animalName,
}: {
    children: ReactNode;
} & T) {
    const [isCorrect, setIsCorrect] = useState<boolean>(null!);
    const [showPrediction, setShowPrediction] = useState(false);
    const [prediction, setPrediction] = useState<any>(null!);

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
        <GenericCard className={className} id={`card-${images.id}`}>
            <div className="card__image-choice">
                {images.map((image) => (
                    <GenericFigure
                        image={image}
                        className="card__description"
                    />
                ))}
            </div>
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
            <CardFeedback
                isCorrect={isCorrect}
                animalName={animalName}
                image={images}
            />
            <CardPrediction
                showPrediction={showPrediction}
                prediction={prediction}
                animalName={animalName}
                image={images}
            />
        </GenericCard>
    );
}
