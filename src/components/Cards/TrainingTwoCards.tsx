import { Button } from '@/components/Buttons/Button.tsx';
import { CardFeedback } from '@/components/Cards/CardFeedback.tsx';
import { CardPrediction } from '@/components/Cards/CardPrediction.tsx';
import { GenericCard } from '@/components/Cards/GenericCard.tsx';
import { GenericFigure } from '@/components/Images/GenericFigure.tsx';
import {
    use,
    useCallback,
    useState,
    type HTMLAttributes,
    type MouseEvent,
    type ReactNode,
} from 'react';
import '@css/card.scss';
import { appContext } from '@/App.tsx';

export function TrainingTwoCards<T extends HTMLAttributes<HTMLDivElement>>({
    animals,
}: {
    children: ReactNode;
} & T) {
    const [previewImages, setPreviewImages] = useState(new Map());
    const [isCorrect, setIsCorrect] = useState<boolean>(null!);
    const [showPrediction, setShowPrediction] = useState(false);
    const { compareAnimals, status, addTrainingPair } = use(appContext);

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

            addTrainingPair(entries, selectedCorrect);
            // await window.animalIdentifier.addTrainingPair(
            //     entries,
            //     selectedCorrect
            // );
        }
    };

    const handlePredict = async (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (previewImages.size === 2) {
            const entries = Array.from(previewImages.values());
            compareAnimals(entries);
            setShowPrediction(true);
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
                prediction={status}
                image={animals}
            />
        </GenericCard>
    );
}
