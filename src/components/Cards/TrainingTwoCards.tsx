import { Button } from '@/components/Buttons/Button.tsx';
import { CardFeedback } from '@/components/Cards/CardFeedback.tsx';
import { CardPrediction } from '@/components/Cards/CardPrediction.tsx';
import { GenericCard } from '@/components/Cards/GenericCard.tsx';
import { GenericFigure } from '@/components/Images/GenericFigure.tsx';
import { useTensorFlowScript } from '@/hooks/useTensorFlowScript.ts';
import {
    HTMLAttributes,
    MouseEvent,
    ReactNode,
    useCallback,
    useState,
} from 'react';
import '@css/card.scss';

export function TrainingTwoCards<T extends HTMLAttributes<HTMLDivElement>>({
    children,
    animals,
    animalName,
}: {
    children: ReactNode;
} & T) {
    const [previewImages, setPreviewImages] = useState(new Map());
    const [isCorrect, setIsCorrect] = useState<boolean>(null!);
    const [showPrediction, setShowPrediction] = useState(false);
    const [prediction, setPrediction] = useState(null!);

    // const { addTrainingData, predict } = useTensorFlowScript();

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

        if (previewImages.size === 2) {
            const entries = Array.from(previewImages.values());

            await window.animalIdentifier.addTrainingPair(
                entries,
                selectedCorrect
            );
        }
    };

    const handlePredict = async (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (previewImages.size === 2) {
            const entries = Array.from(previewImages.values());

            const result = await window.animalIdentifier.compareAnimals(
                entries
            );
            if (result) {
                setPrediction(result);
                setShowPrediction(true);
            }
        }
    };

    const onImageRef = useCallback((element: HTMLImageElement) => {
        if (element) {
            setPreviewImages((prev) => prev.set(element.id, element));
        }
    }, []);

    return (
        <GenericCard className={className}>
            {/* <GenericCard className={className} id={`card-${images.id}`}> */}
            <div className="card__image-choice">
                {animals.map((animal) => (
                    <GenericFigure
                        ref={onImageRef}
                        key={animal.id}
                        image={animal}
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
            <CardFeedback isCorrect={isCorrect} image={animals} />
            <CardPrediction
                showPrediction={showPrediction}
                prediction={prediction}
                image={animals}
            />
        </GenericCard>
    );
}
