import type { svgsType } from '@/configs/social.config.ts';

export type UseDynamicSVGImportTypes = {
    icon: svgsType;
    options?: {
        [key: string]: unknown;
    };
};
