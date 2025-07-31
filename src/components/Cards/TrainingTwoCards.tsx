import { Button } from '@/components/Buttons/Button.tsx';
import { CardFeedback } from '@/components/Cards/CardFeedback.tsx';
import { CardPrediction } from '@/components/Cards/CardPrediction.tsx';
import { GenericCard } from '@/components/Cards/GenericCard.tsx';
import { GenericFigure } from '@/components/Images/GenericFigure.tsx';
import {
    memo,
    use,
    useCallback,
    useRef,
    useState,
    type HTMLAttributes,
    type MouseEvent,
    type ReactNode,
} from 'react';
import '@css/card.scss';
import { AnimalActionsContext } from '@/api/context/animalContext/AnimalModelContext.tsx';

export const MemoizedTrainingTwoCards = memo(function TrainingTwoCards<
    T extends HTMLAttributes<HTMLDivElement>
>({
    animals,
    isOnLoad,
}: {
    children: ReactNode;
} & T) {
    const previewImgsRef = useRef(new Map()).current;
    const [isCorrect, setIsCorrect] = useState<boolean>(null!);
    const [showPrediction, setShowPrediction] = useState(false);
    const [prediction, setPrediction] = useState<{
        sameAnimal: boolean;
        confidence: number;
    }>(null!);
    const { compareAnimals, addTrainingPair } = use(AnimalActionsContext);

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

        if (previewImgsRef.size === 2) {
            const entries = Array.from(previewImgsRef.values());

            addTrainingPair({
                imgArray: entries,
                isSameAnimal: selectedCorrect,
                count: isOnLoad,
            });
        }
    };

    const handlePredict = async (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (previewImgsRef.size === 2) {
            const entries = Array.from(previewImgsRef.values());
            const result = await compareAnimals(entries);
            setPrediction(result);
            setShowPrediction(true);
        }
    };

    const onImageRef = useCallback((element: HTMLImageElement) => {
        if (element) {
            previewImgsRef.set(element.id, element);
        }
    }, []);

    console.log(
        'je render la carte et voici sa prediction : ',
        prediction,
        showPrediction
    );
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
});
