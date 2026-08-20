const base = import.meta.env.BASE_URL;

/**
 * 项目数据
 */
export const projects = [
    {
        imgSrc: `${base}images/mocode.png`,
        title: 'MoCode-TUI',
        tags: ['LLM', 'Bun', 'OpenTUI'],
        projectLink: 'https://github.com/moyunzero/MoCode-TUI',
    },
    {
        imgSrc: `${base}images/gpt.png`,
        title: 'Personal Emotion GPT',
        tags: ['Next', 'RAG', 'Tailwind'],
        projectLink: 'https://personal-emotion-gpt.vercel.app',
    },
    {
        imgSrc: `${base}images/vitadex.png`,
        title: 'VitaDex',
        tags: ['Swift','SwiftUI'],
        projectLink: 'https://apps.apple.com/us/app/vitadex/id6797374485',  
    },
    {
        imgSrc: `${base}images/blue-ai.png`,
        title: 'Blueprint AI',
        tags: ['AI', 'Vue3', 'Prompt'],
        projectLink: 'https://github.com/moyunzero/Blueprint-AI',
    },
    {
        imgSrc: `${base}images/xqmo.png`,
        title: '心晴MO',
        tags: ['ReactNative', 'Expo', 'TypeScript'],
        projectLink: 'https://apps.apple.com/us/app/%E5%BF%83%E6%99%B4mo/id6759703686 '
    },
    {
        imgSrc: `${base}images/saleme.png`,
        title: '傻了么',
        tags: ['ReactNative', 'Expo', 'TypeScript'],
        projectLink: 'https://apps.apple.com/us/app/%E5%82%BB%E4%BA%86%E4%B9%88/id6770218110'
    },
    {
        imgSrc: `${base}images/salary.png`,
        title: '薪时宝',
        tags: ['微信小程序', '云开发', 'JavaScript'],
        projectLink: 'https://github.com/moyunzero/salary-record'
    },
    {
        imgSrc: `${base}images/lookjob.png`,
        title: 'LookJob',
        tags: ['Next', 'InsForge', 'AI SDK'],
        projectLink: 'https://github.com/moyunzero/look-job'
    },
    {
        imgSrc: `${base}images/xiuxian.png`,
        title: '修仙欠费中',
        tags: ['Nuxt', 'Vue3', 'TypeScript'],
        projectLink: 'https://www.debt-xiuxian.online/',
    },
    {
        imgSrc: `${base}images/travel.png`,
        title: '旅行记录地图',
        tags: ['Nuxt', 'Vue3', 'Pinia'],
        projectLink: 'https://travel-record-map.vercel.app/',
    },
];
