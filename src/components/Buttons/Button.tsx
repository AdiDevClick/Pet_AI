import { ButtonProps } from '@/components/Buttons/buttonTypes.ts';
import '@css/button.scss';

/**
 * Generic Button Component that renders a styled button element.
 *
 * @param children - The content to be displayed inside the button.
 * @param type - **@Default="button"** - The type of the button.
 */
export function Button<T>({
    children,
    type = 'button',
    ...props
}: ButtonProps<T>) {
    return (
        <button className={`btn ${props.className}`} type={type} {...props}>
            {children}
        </button>
    );
}
