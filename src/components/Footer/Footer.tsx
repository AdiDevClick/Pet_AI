import { SocialContainer } from '@/components/Social/SocialContainer.tsx';
import '@css/footer.scss';
import { memo } from 'react';

export const MemoizedFooter = memo(function Footer() {
    return (
        <footer className="footer">
            <p className="footer__note">Made with ❤️ by the Pet AI Team</p>
            <div className="footer__rights">
                <SocialContainer className="footer__social" />
                <p>© 2025 Pet AI. All rights reserved.</p>
            </div>
        </footer>
    );
});

export default MemoizedFooter;
