import { TrainingCard } from '@/components/Cards/TrainingCard';
import { GenericGrid } from '@/components/Grid/GenericGrid.tsx';
import '@css/card.scss';
import '@css/generic-grid.scss';

export function CardsGrid({
    images,
    animalName,
}: {
    images: Array<{ id: string; url: string; description: string }>;
    animalName: string;
}) {
    return (
        <GenericGrid>
            {images.map((image) => (
                <TrainingCard
                    key={image.id}
                    image={image}
                    animalName={animalName}
                />
            ))}
        </GenericGrid>
    );
}
