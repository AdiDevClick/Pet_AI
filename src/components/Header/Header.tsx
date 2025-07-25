import '@css/header.scss';
import { NavLink } from 'react-router-dom';

export function Header({ children }) {
    return (
        <header className="header">
            <h1>🤖 Classificateur d'Images IA</h1>
            <p>
                Système d'entraînement interactif similaire aux captchas Google
            </p>
            <NavLink to="/">Accueil</NavLink>
            <NavLink to="/compare">Comparer</NavLink>
            <NavLink to="/train-model">Entraînement</NavLink>
            {children}
        </header>
    );
}
