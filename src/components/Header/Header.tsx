import '@css/header.scss';
import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

type HeaderProps = {
    children?: ReactNode;
};

export function Header({ children }: HeaderProps) {
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
