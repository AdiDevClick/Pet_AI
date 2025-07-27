import type { svgsType } from '@/configs/social.config.ts';

export type SocialContainerPropsTypes = {
    className?: string;
    icons?: svgsType[];
};

export type IconPropsTypes = {
    icon: svgsType;
} & React.HTMLAttributes<SVGElement>;
