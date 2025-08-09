import { Button } from "@/components/Buttons/Button.tsx";
import { CardFeedback } from "@/components/Cards/CardFeedback.tsx";
import { CardPrediction } from "@/components/Cards/CardPrediction.tsx";
import { GenericCard } from "@/components/Cards/GenericCard.tsx";
import { GenericFigure } from "@/components/Images/GenericFigure.tsx";
import { useTensorFlowScript } from "@/hooks/useTensorFlowScript";
import { useRef, useState, type MouseEvent } from "react";
import "@css/card.scss";

export function TrainingCard({
   image,
   animalName,
}: {
   image: { id: string; image: string; description: string };
   animalName: string;
}) {
   const [isCorrect, setIsCorrect] = useState<boolean>(null!);
   const [showPrediction, setShowPrediction] = useState(false);
   const [prediction, setPrediction] = useState(null!);
   const { addTrainingData, predict } = useTensorFlowScript();

   const imageRef = useRef<HTMLImageElement>(null!);

   let className = "";

   if (isCorrect) {
      className = "selected-correct";
   }
   if (isCorrect === false) {
      className = "selected-incorrect";
   }

   const handleUserResults = async (
      e: MouseEvent<HTMLButtonElement>,
      selectedCorrect: boolean
   ) => {
      e.preventDefault();
      setIsCorrect(selectedCorrect);

      const img = imageRef.current;

      if (img && img.complete) {
         await addTrainingData(img, selectedCorrect);
      }
   };

   const handlePredict = async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();

      const img = imageRef.current;

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
         <GenericFigure
            ref={imageRef}
            {...image}
            className="card__description"
         />
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
            image={image}
         />
         <CardPrediction
            showPrediction={showPrediction}
            prediction={prediction}
            animalName={animalName}
            image={image}
         />
      </GenericCard>
   );
}
