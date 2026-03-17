const base = import.meta.env.BASE_URL;

/**
 * 项目数据
 */
export const projects = [
    {
        imgSrc: `${base}images/blue-ai.png`,
        title: 'Blueprint AI',
        tags: ['AI', 'React', 'Prompt'],
        projectLink: 'https://github.com/moyunzero/Blueprint-AI'
    },
    {
        imgSrc: `${base}images/xiuxian.png`,
        title: '修仙欠费中',
        tags: ['Nuxt', 'Vue3', 'TypeScript'],
        projectLink: 'https://no-money-to-xiuxian.netlify.app/'
    },
];
