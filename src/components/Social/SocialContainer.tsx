import { Icon } from '@/components/Icons/Icon.tsx';
import { SocialContainerPropsTypes } from '@/components/Social/socialTypes.ts';
import { svgs } from '@/configs/social.config.ts';
import '@css/social.scss';
import { Children, lazy, Suspense } from 'react';

let icon = { path: 'github.svg' }; // Default icon for lazy loading
// const SvgIcon = lazy(() => import(`src/assets/icons/${icon.path}`));
/**
 * Renders a list of social icons with links.
 *
 * @description It uses default icons from the
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
            {icons.map((icon) => (
                <a
                    key={icon.name}
                    href={icon.url}
                    className="social__link"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Icon icon={icon} />
                </a>
            ))}
        </div>
    );
}

// const SvgIcon = ({ icon }) => {
//     const LazyIcon = lazy(async () => {
//         return {
//             default: await import(`src/assets/icons/${icon.path}`),
//         };
//     });
//     console.log(LazyIcon.default);
//     // console.log(`Loading icon: ${icon.name} from path: ${icon.path}`);
//     return <LazyIcon />;
// };
