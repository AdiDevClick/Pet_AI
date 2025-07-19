import { Card } from '@/components/Cards/Card.tsx';
import '@css/images-grid.scss';

export function CardsGrid({
    images,
}: {
    images: Array<{ id: string; url: string; description: string }>;
}) {
    return (
        <div className="images-grid_container" id="images-container">
            {images.map((image) => (
                <Card key={image.id} image={image} />
            ))}
        </div>
    );
}
