const base = import.meta.env.BASE_URL;

/**
 * 项目数据
 */
export const projects = [
    {
        imgSrc: `${base}images/blue-ai.png`,
        title: 'Blueprint AI',
        tags: ['AI', 'Vue3', 'Prompt'],
        projectLink: 'https://github.com/moyunzero/Blueprint-AI'
    },
    {
        imgSrc: `${base}images/xiuxian.png`,
        title: '修仙欠费中',
        tags: ['Nuxt', 'Vue3', 'TypeScript'],
        projectLink: 'https://no-money-to-xiuxian.netlify.app/'
    },
    {
        imgSrc: `${base}images/xqmo.png`,
        title: '心晴MO',
        tags: ['ReactNative', 'Expo', 'TypeScript'],
        projectLink: 'https://apps.apple.com/us/app/%E5%BF%83%E6%99%B4mo/id6759703686 '
    }
];
