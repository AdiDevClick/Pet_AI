import { Button } from '@/components/Buttons/Button.tsx';

const buttons = [
    {
        label: '📂 Charger le Modèle',
        onClick: loadModel(),
    },
    {
        label: '💾 Sauvegarder le Modèle',
        onClick: saveModel(),
    },
];
export function ModelControls() {
    return (
        <div className="section">
            <h3>Gestion du Modèle</h3>
            {buttons.map((button) => (
                <Button key={button.label} onClick={button.onClick}>
                    {button.label}
                </Button>
            ))}
        </div>
    );
}
