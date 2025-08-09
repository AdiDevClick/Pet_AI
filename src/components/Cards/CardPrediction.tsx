import { useId, type HTMLAttributes } from "react";

export function CardPrediction<T extends HTMLAttributes<HTMLDivElement>>({
   showPrediction,
   prediction,
   animalName = "les mêmes animaux",
}: {
   animalName?: string;
   showPrediction: boolean;
   prediction: { sameAnimal: boolean; confidence: number } | null;
} & T) {
   const id = useId();
   return (
      <>
         {showPrediction && prediction && (
            <div className="prediction-result" id={`prediction-${id}`}>
               <strong>🔮 Prédiction IA:</strong>
               <br />
               {prediction.sameAnimal
                  ? `✅ ${animalName} détecté`
                  : `❌ Pas ${animalName}`}
               <br />
               <small>
                  Confiance: {(prediction.confidence * 100).toFixed(1)}%
               </small>
            </div>
         )}
      </>
   );
}
