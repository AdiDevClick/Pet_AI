import { Button } from "@/components/Buttons/Button.tsx";
import { GenericTitle } from "@/components/Texts/GenericTitle.tsx";
import "@css/home.scss";
import { Link } from "react-router-dom";

export function Home() {
   return (
      <div className="home">
         <h1 className="home__title">Bienvenue sur le Trainee Machine </h1>
         <GenericTitle>
            Entraînez un modèle d'IA pour reconnaître des images.
         </GenericTitle>
         <p>
            Rapide et simple à utiliser, vous pourrez créer des modèles d'IA
            pour vos applications, sites web ou projets personnels.
            <br />
            Charger des images et suivez les instructions pour entraîner votre
            modèle.
            <br />
            Vous pourrez ensuite exporter votre modèle pour l'utiliser dans vos
            projets.
         </p>
         <Button className="home__call-to-action-button">
            <Link to="/train-model">
               <strong>Prêt à commencer ?</strong>
            </Link>
         </Button>
      </div>
   );
}
