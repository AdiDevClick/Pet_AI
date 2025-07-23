import { useEffect, useRef, useState } from 'react';

export function useDynamicSVGImport(icon: { path: string }, options = {}) {
    const importedIconRef = useRef(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const importIcon = async () => {
            try {
                importedIconRef.current = (
                    await import(`../assets/icons/${icon.path}.svg`)
                ).ReactComponent;
                console.log(importedIconRef.current);
            } catch (error) {
                setError(error);
            }
        };
        importIcon();
    }, [icon.path]);

    return { SvgIcon: importedIconRef.current, error };
}
