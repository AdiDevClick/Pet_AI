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

const onlyPositive = false;
const allShuffled = true;

type SourceAnimal = {
   id: string | number;
   images: string[];
   description: string;
};

function buildAnimals() {
   let base: SourceAnimal[] = [];
   if (allShuffled) base = originalAnimals;
   if (onlyPositive) base = originalAnimals.slice(32, 33);
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

const animals = buildAnimals();

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
