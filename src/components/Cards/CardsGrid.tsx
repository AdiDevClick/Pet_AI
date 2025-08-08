import { TrainingCard } from "@/components/Cards/TrainingCard";
import { GenericGrid } from "@/components/Grid/GenericGrid.tsx";
// import '@css/generic-grid.scss';
// import '@css/card.scss';

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
         {/* <GenericGrid>
            <GenericList items={images}>
               <TrainingCard image={item} animalName={animalName} />
            </GenericList>
         </GenericGrid> */}
      </GenericGrid>
   );
}
