const path = import.meta.env.BASE_URL + 'src/assets/icons/';

/**
 * Social icons.
 */
export const svgs = [
    {
        name: 'GitHub',
        path: 'github',
        url: 'https://github.com/AdiDevClick',
    },
    {
        name: 'LinkedIn',
        path: 'linkedin',
        url: 'https://linkedin.com/in/adrienquijo',
    },
];
export type svgsType = (typeof svgs)[number];
