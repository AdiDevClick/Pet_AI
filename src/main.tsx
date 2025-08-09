import { StrictMode, Suspense, useEffect, useState } from "react";
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

import { Home } from "@/Pages/Home/Home.tsx";
import MemoizedFooter from "@/components/Footer/Footer.tsx";
import { Toaster } from "@/components/ui/sonner.tsx";
import type { contextTypes } from "@/mainTypes.ts";
import MemoizedScrollTop from "@/components/Buttons/ScrollTop.tsx";

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

export function Root(contentType: { contentType?: string }) {
   const errorContent = contentType.contentType === "error";

   const [appRouterContext, setAppRouterContext] = useState({
      isOnLoad: true,
      count: 0,
      resetSystem: false,
   });

   const timer = setTimeout(() => {
      return false;
   }, 2000);

   useEffect(() => {
      if (appRouterContext.resetSystem) {
         setAppRouterContext({
            isOnLoad: true,
            count: 0,
            resetSystem: timer(),
         });
         // const timer = setTimeout(() => {
         //    setResetSystem(false);
         // }, 2000);
         return () => clearTimeout(timer);
         // } else {
         //     setOnLoad(true);
      }
   }, [appRouterContext.resetSystem]);
   const functionProps: contextTypes = {
      appRouterContext,
      setAppRouterContext,
   };

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
