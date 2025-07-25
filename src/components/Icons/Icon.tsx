import { IconPropsTypes } from '@/components/Social/socialTypes.ts';
import { useDynamicSVGImport } from '@/hooks/useDynamicSVGImport';

/**
 * Renders an SVG icon.
 *
 * @description This component dynamically imports an SVG icon based on the provided path.
 * It uses the `useDynamicSVGImport` hook to handle the import and loading state.
 *
 * @param icon - Object containing the icon's path and other properties.
 * @param props - Additional properties to pass to the SVG element.
 */
export function Icon({ icon, ...props }: IconPropsTypes) {
    const { SvgIcon, error } = useDynamicSVGImport({ icon });
    if (error) {
        return <div>Can't load the icon</div>;
    }
    if (SvgIcon) {
        return <SvgIcon className="social__icon" {...props} />;
    }
    return <div>Loading icon...</div>;
}
