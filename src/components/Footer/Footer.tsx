import { SocialContainer } from '@/components/Social/SocialContainer.tsx';

export function Footer() {
    return (
        <footer className="footer">
            <SocialContainer className="footer__social" />
            <p>
                <strong>Note:</strong> Ce projet est en cours de développement
                et peut contenir des bugs. <br />
                N'hésitez pas à contribuer ou à signaler des problèmes sur le
                dépôt GitHub.
            </p>
            <p>© 2025 Pet AI. All rights reserved.</p>
            <p>Made with ❤️ by the Pet AI Team</p>
        </footer>
    );
}
