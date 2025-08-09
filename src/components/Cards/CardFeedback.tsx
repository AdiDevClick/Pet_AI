import { useId, type HTMLAttributes } from "react";

export function CardFeedback<T extends HTMLAttributes<HTMLDivElement>>({
   isCorrect,
   animalName = "Même animal",
}: {
   isCorrect: boolean | null;
   animalName?: string;
} & T) {
   const id = useId();
   return (
      <>
         {isCorrect !== null && (
            <div
               className="card__feedback"
               id={`feedback-${id}`}
               style={{ color: isCorrect ? "green" : "red" }}
            >
               <br />
               <small>
                  Votre choix : {isCorrect ? animalName : "Autre animal"}
               </small>
            </div>
         )}
      </>
   );
}
