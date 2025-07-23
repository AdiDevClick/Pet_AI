import { GenericTitle } from '@/components/Texts/GenericTitle.tsx';

export function Home() {
    return (
        <div className="home">
            <h1>Bienvenue sur le Trainee Machine </h1>
            <GenericTitle>
                Entraînez un modèle d'IA pour reconnaître des images.
            </GenericTitle>
            <p>
                Rapide et simple à utiliser, vous pourrez créer des modèles d'IA
                pour vos applications, sites web ou projets personnels.
            </p>
            <p>
                Charger des images et suivez les instructions pour entraîner
                votre modèle.
            </p>
            <p>
                Vous pourrez ensuite exporter votre modèle pour l'utiliser dans
                vos projets.
            </p>
            <p>
                <strong>Prêt à commencer ?</strong>
            </p>
        </div>
    );
}
