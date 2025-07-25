import { Button } from '@/components/Buttons/Button.tsx';
import { UIScrollDistance } from '@/configs/UIScroll.config.ts';
import '@css/button.scss';
import { useEffect, useState } from 'react';

/**
 * A simple button that scrolls the page to the top when clicked.
 *
 * @description You can define the distance to scroll before the button appears
 * using the `UIScrollDistance` constant from the `UIScroll.config.ts` file
 */
export function ScrollTop() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > UIScrollDistance);
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        (isScrolled && (
            <Button
                className="scroll-top"
                onClick={scrollToTop}
                aria-label="Scroll to top"
            >
                ⬆️
            </Button>
        )) ||
        null
    );
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth',
    });
}
