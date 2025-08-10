import { StrictMode, Suspense, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App.tsx";
// import '@css/_reset.css';
import "@css/main.scss";
import "@css/index-tailwind.css";

import {
   createBrowserRouter,
   Navigate,
   Outlet,
   RouterProvider,
} from "react-router-dom";
import { PageError } from "@/Pages/Error/PageError.tsx";
import { ComparePets } from "@/Pages/Compare/ComparePets";
import { Header } from "@/components/Header/Header.tsx";
import MemoizedTrainModel from "@/Pages/TrainModel/TrainModel.tsx";
import originalAnimals from "@/data/animals.json";
import { Home } from "@/Pages/Home/Home.tsx";
import MemoizedFooter from "@/components/Footer/Footer.tsx";
import { Toaster } from "@/components/ui/sonner.tsx";
import MemoizedScrollTop from "@/components/Buttons/ScrollTop.tsx";
import type { AppRouterState, ContextTypes } from "@/mainTypes.ts";

type SourceAnimal = {
   id: string | number;
   images: string[];
   description: string;
};

function buildAnimals(
   originalArr,
   onlyPositive,
   sliceStart = null,
   sliceEnd = null
) {
   let base: SourceAnimal[] = originalArr;

   if (onlyPositive) {
      base = originalArr.slice(sliceStart, sliceEnd);
   }

   const result: SourceAnimal[] = [...base];

   base.forEach((animalData: SourceAnimal) => {
      let count = result.length;
      if (animalData.images && animalData.images.length > 1) {
         animalData.images.forEach((image: string, index: number) => {
            if (index === 0) return;
            count += 1;
            result.push(
               createImageCard(count, {
                  ...animalData,
                  images: [image],
               })
            );
         });
      }
   });
   Object.freeze(result);
   return result;
}

const onlyPositive = false;
const allShuffled = true;

const builtAnimals = buildAnimals(originalAnimals, onlyPositive, 0, 1);

function buildAnimalsPairs(shuffledAnimals) {
   const pairs = [];
   shuffledAnimals.forEach((animalA, indexA) => {
      shuffledAnimals.forEach((animalB, indexB) => {
         if (indexA >= indexB) return;
         pairs.push([
            { ...animalA, image: animalA.images[0] },
            { ...animalB, image: animalB.images[0] },
         ]);
      });
   });
   return pairs;
}

function buildSequentialPairs(array) {
   const pairs = [];
   if (array.length > 1) {
      pairs.push([
         {
            ...array[array.length - 1],
            image: array[array.length - 1].images[0],
         },
         { ...array[0], image: array[0].images[0] },
      ]);
   }
   for (let i = 0; i < array.length - 1; i++) {
      pairs.push([
         { ...array[i], image: array[i].images[0] },
         { ...array[i + 1], image: array[i + 1].images[0] },
      ]);
   }
   return pairs;
}

function buildRandomSingleUsePairs(array) {
   // On clone et mélange le tableau
   const shuffled = [...array];
   for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
   }
   // On crée les paires
   const pairs = [];
   for (let k = 0; k < shuffled.length - 1; k += 2) {
      pairs.push([
         { ...shuffled[k], image: shuffled[k].images[0] },
         { ...shuffled[k + 1], image: shuffled[k + 1].images[0] },
      ]);
   }
   // Si nombre impair, dernière image seule (optionnel)
   // if (shuffled.length % 2 === 1) {
   //    pairs.push([
   //       {
   //          ...shuffled[shuffled.length - 1],
   //          image: shuffled[shuffled.length - 1].images[0],
   //       },
   //    ]);
   // }
   return pairs;
}

const animals = onlyPositive
   ? buildAnimalsPairs(builtAnimals)
   : buildRandomSingleUsePairs(builtAnimals);

const router = createBrowserRouter(
   [
      {
         path: "/",
         element: <Root />,
         errorElement: <Root contentType={"error"} />,
         children: [
            { index: true, element: <Home /> },
            {
               path: "compare",
               element: <ComparePets />,
            },
            // {
            //     path: 'contact',
            //     element: <Outlet />,
            //     children: [
            //         {
            //             path: ':id',
            //             element: <Outlet />,
            //         },
            //     ],
            // },
            {
               path: "train-model",
               element: <MemoizedTrainModel />,
               loader: async () => {
                  return { animals };
               },
            },
            {
               path: "error",
               element: (
                  <Suspense fallback={null}>
                     <PageError />
                  </Suspense>
               ),
            },
            {
               path: "*",
               element: <Navigate to="/error" replace />,
            },
         ],
      },
   ]
   // { basename: baseUrl }
);

createRoot(document.getElementById("root")!).render(
   <StrictMode>
      <RouterProvider router={router} />
   </StrictMode>
);

export const initialAppRouterState = {
   isOnLoad: true,
   count: 0,
   resetSystem: false,
   predictAllImages: false,
   displayNewImages: false,
   validateAllImages: false,
   onlyPositive: onlyPositive,
   allShuffled: allShuffled,
} as const;

export function Root(contentType: { contentType?: string }) {
   const errorContent = contentType.contentType === "error";

   const [appRouterContext, setAppRouterContext] = useState<AppRouterState>(
      initialAppRouterState
   );

   useEffect(() => {
      if (appRouterContext.resetSystem) {
         const t = setTimeout(() => {
            setAppRouterContext((prev) => ({
               ...prev,
               isOnLoad: true,
               count: 0,
               predictAllImages: false,
               resetSystem: false,
            }));
         }, 2000);
         return () => clearTimeout(t);
      }
   }, [appRouterContext.resetSystem]);

   const functionProps: ContextTypes = useMemo(
      () => ({ ...appRouterContext, setAppRouterContext }),
      [appRouterContext, setAppRouterContext]
   );

   return (
      <>
         <Header />
         <App>
            {errorContent ? <PageError /> : <Outlet context={functionProps} />}
         </App>
         <MemoizedScrollTop />
         <Toaster />
         <MemoizedFooter />
      </>
   );
}

function createImageCard(lastId: string | number, animalData: SourceAnimal) {
   return {
      ...animalData,
      id: lastId,
   };
}
