import '@css/instructions.scss';
export function Instructions() {
    return (
        <div className="instructions">
            <h3>📖 Instructions d'utilisation</h3>
            <ul>
                <li>
                    <strong>Étape 1:</strong> Regardez chaque image et décidez
                    si elle correspond à la tâche demandée
                </li>
                <li>
                    <strong>Étape 2:</strong> Cliquez sur "✓ Correct" si l'image
                    correspond, ou "✗ Incorrect" sinon
                </li>
                <li>
                    <strong>Étape 3:</strong> Le système apprend automatiquement
                    de vos choix
                </li>
                <li>
                    <strong>Étape 4:</strong> Testez les prédictions du modèle
                    avec de nouvelles images
                </li>
                <li>
                    <strong>Astuce:</strong> Plus vous donnez d'exemples, plus
                    le modèle devient précis!
                </li>
            </ul>
        </div>
    );
}
