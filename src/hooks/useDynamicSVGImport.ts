import { useEffect, useState } from 'react';

const icons = import.meta.glob(`../assets/icons/*.svg`, {
    import: 'default',
});

export function useDynamicSVGImport(icon: { path: string }, options = {}) {
    const [SvgIcon, setSvgIcon] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const importIcon = async () => {
            try {
                const key = `../assets/icons/${icon.path}.svg`;
                if (!icons[key]) {
                    throw new Error(`Icon not found: ${key}`);
                }
                const path = key + '?react';
                const module = await import(path);
                setSvgIcon(() => module.default);
            } catch (error) {
                setError(error);
            }
        };
        importIcon();
    }, [icon]);

    return { SvgIcon, error };
}
