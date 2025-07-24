import { useDynamicSVGImport } from '@/hooks/useDynamicSVGImport';

export function Icon({ icon, ...props }) {
    const { SvgIcon, error } = useDynamicSVGImport(icon);
    if (error) {
        console.log(error);
        return <div>Can't load the icon {icon}</div>;
    }
    if (SvgIcon) {
        return <SvgIcon className="social__icon" {...props} />;
    }
    return <div>Loading icon...</div>;
}
