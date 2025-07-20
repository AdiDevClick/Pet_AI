import { HTMLAttributes } from 'react';

export function CardFeedback<T extends HTMLAttributes<HTMLDivElement>>({
    isCorrect,
    image,
    animalName,
}: {
    isCorrect: boolean | null;
    image: { id: string; url: string; description: string };
    animalName: string;
} & T) {
    return (
        <>
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
        </>
    );
}
