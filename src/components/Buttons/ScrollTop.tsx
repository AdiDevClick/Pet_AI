import { Button } from '@/components/Buttons/Button.tsx';
import '@css/button.scss';

export function ScrollTop() {
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <Button
            className="scroll-top"
            onClick={scrollToTop}
            aria-label="Scroll to top"
        >
            ⬆️
        </Button>
    );
}
