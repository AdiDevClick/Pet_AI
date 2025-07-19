import '@css/header.scss';

export function Header({ children }) {
    return (
        <header className="header">
            <h1>🤖 Classificateur d'Images IA</h1>
            <p>
                Système d'entraînement interactif similaire aux captchas Google
            </p>
            {children}
        </header>
    );
}
