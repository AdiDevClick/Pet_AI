import { AnimalActionsContext } from "@/api/context/animalContext/AnimalModelContext.tsx";
import { Button } from "@/components/Buttons/Button.tsx";
import { GenericCard } from "@/components/Cards/GenericCard.tsx";
import { MemoizedControls } from "@/components/Controls/Controls.tsx";
import { GenericGrid } from "@/components/Grid/GenericGrid.tsx";
import { ImageInput } from "@/components/Inputs/ImageInput.tsx";
import { GenericList } from "@/components/Lists/GenericList.tsx";
import { GenericDescription } from "@/components/Texts/GenericDescription.tsx";
import { GenericTitle } from "@/components/Texts/GenericTitle.tsx";
import { UniqueSet } from "@/lib/UniqueSet.ts";
import type { PageState } from "@/Pages/Compare/types/CompareTypes.ts";
import { use, useState } from "react";

const inputs = [
   {
      id: "compare-img1",
      label: "Image 1",
      // previewId: "preview1",
   },
   {
      id: "compare-img2",
      label: "Image 2",
      // previewId: "preview2",
   },
];
export const initialComparePageState = {
   message: "",
   className: "",
   result: null,
   inputImages: new UniqueSet<string, HTMLImageElement>(),
   error: new UniqueSet<string, string[]>(),
};

/**
 * Compare two images of pets to see if they depict the same animal.
 *
 * @description This uses `inputs` variable just above to
 * create image inputs for the user to upload images.
 */
export function ComparePets() {
   const { compareAnimals } = use(AnimalActionsContext);

   const [pageState, setPageState] = useState<PageState>(
      initialComparePageState
   );

   const compareImages = async () => {
      try {
         // if (pageState.inputImages.size() < 2) {
         //    throw new Error(
         //       "Veuillez sélectionner les deux images à comparer",
         //       {
         //          cause: {
         //             message: "Not enough images selected",
         //             status: 400,
         //          },
         //       }
         //    );
         // }

         // setPageState((prevState) => ({
         //    ...prevState,
         //    message: "🔍 Comparaison en cours...",
         //    className: "warning",
         // }));

         const inputsIds = Array.from(pageState.inputImages.values());

         const response = await compareAnimals([inputsIds[0], inputsIds[1]]);

         if (!response) {
            throw new Error("Une erreur est survenue lors de la comparaison", {
               cause: {
                  message: "An error occurred during comparison",
                  status: 400,
               },
            });
         }

         setPageState((prevState) => ({
            ...prevState,
            result: response,
            // message: "✅ Comparaison réussie!",
            className: "success",
         }));
      } catch (error) {
         setPageState((prevState) => ({
            ...prevState,
            message: "❌ Erreur lors de la comparaison",
            className: "error",
         }));
      }
   };
   console.log([...pageState.error.entries()]);
   return (
      <>
         <MemoizedControls />
         <section className="generic-layout compare-pets">
            <GenericTitle>🔍 Comparaison d'Images</GenericTitle>
            <GenericDescription>
               Comparez deux nouvelles images pour voir si elles montrent le
               même animal.
            </GenericDescription>

            <GenericGrid className="comparison-container">
               <GenericList items={inputs}>
                  <GenericCard className={"image-preview-container"}>
                     <ImageInput setter={setPageState} state={pageState} />
                  </GenericCard>
               </GenericList>
            </GenericGrid>

            <Button
               className="comparison__btn "
               onClick={compareImages}
               disabled={pageState.inputImages.size() < 2}
            >
               Comparer les Images
            </Button>
            <div className="generic-layout__alert">
               {pageState.error.size() > 0 && (
                  <p className={`generic-layout__alert ${pageState.className}`}>
                     {Array.from(pageState.error.entries()).map(([_, errors]) =>
                        Array.isArray(errors)
                           ? errors.map((error: string) => (
                                <span key={error + Math.random()}>{error}</span>
                             ))
                           : null
                     )}
                  </p>
               )}
               {pageState.message && (
                  <p className={`generic-layout__alert ${pageState.className}`}>
                     {pageState.message}
                  </p>
               )}
               {pageState.result && (
                  <>
                     <h3>Résultat de la Comparaison:</h3>
                     <p>
                        <strong>Verdict:</strong>
                        {pageState.result.sameAnimal
                           ? "✅ Même animal"
                           : "❌ Animaux différents"}
                     </p>
                     <p>
                        <strong>Score de similarité: </strong>
                        {(pageState.result.similarityScore * 100).toFixed(1)}%
                     </p>
                     <p>
                        <strong>Confiance: </strong>
                        {(pageState.result.confidence * 100).toFixed(1)}%
                     </p>
                     <div
                        style={{
                           textAlign: "center",
                           background: `${
                              pageState.result.sameAnimal
                                 ? "#c6f6d5"
                                 : "#fed7d7"
                           }`,
                           color: `${
                              pageState.result.sameAnimal
                                 ? "#22543d"
                                 : "#742a2a"
                           }`,
                           padding: "10px",
                           borderRadius: "5px",
                           marginTop: "10px",
                        }}
                     >
                        <strong>
                           {pageState.result.sameAnimal
                              ? "✅ Ces images semblent montrer le même animal!"
                              : "❌ Ces images semblent montrer des animaux différents."}
                        </strong>
                     </div>
                  </>
               )}

               {!pageState.result && "Aucune comparaison effectuée"}
            </div>
         </section>
      </>
   );
}
