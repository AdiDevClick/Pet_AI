import { ButtonProps } from '@/components/Buttons/buttonTypes.ts';
import '@css/button.scss';

/**
 * Generic Button Component that renders a styled button element.
 *
 * @description Default className : "btn"
 *
 * @param children - The content to be displayed inside the button.
 * @param type - **@Default="button"** - The type of the button.
 * @param props- Additional properties to be passed to the button element.
 * It can include event handlers, styles, and other attributes.
 */
export function Button<T>({
    children,
    type = 'button',
    ...props
}: ButtonProps<T>) {
    return (
        <button
            {...props}
            className={`btn ${props.className ? props.className : ''}`}
            type={type}
        >
            {children}
        </button>
    );
}
