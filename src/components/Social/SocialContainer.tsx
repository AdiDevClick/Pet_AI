import { Icon } from '@/components/Icons/Icon.tsx';
import { SocialContainerPropsTypes } from '@/components/Social/socialTypes.ts';
import { svgs } from '@/configs/social.config.ts';
import '@css/social.scss';

/**
 * Renders a list of SVG icons with links.
 *
 * @description It uses default imported icons from the
 * `social.config.ts` file.
 * The icon is an <a/>, which will open the link in a new tab.
 *
 * @param className - **@default {`.social`}** Additional CSS classes to apply to the container.
 * @param icons - **@default {`svgs`}** Array of social icons with name, path, and url.
 * @param props - Additional properties to pass to the container.
 */
export function SocialContainer({
    icons = svgs,
    ...props
}: SocialContainerPropsTypes) {
    return (
        <div {...props} className={`social ${props.className}`}>
            {icons.map((icon, index) => (
                <a
                    key={icon.name}
                    href={icon.url}
                    className="social__link"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Icon key={icon.name + index} icon={icon} />
                </a>
            ))}
        </div>
    );
}
