const base = import.meta.env.BASE_URL;

/**
 * 技能数据
 */
export const skills = [
    {
        imgSrc: `${base}images/css3.svg`,
        label: 'CSS',
        desc: '样式设计'
    },
    {
        imgSrc: `${base}images/javascript.svg`,
        label: 'JavaScript',
        desc: '交互逻辑'
    },
    {
        imgSrc: `${base}images/react.svg`,
        label: 'React',
        desc: '前端框架'
    },
    {
        imgSrc: `${base}images/vue.svg`,
        label: 'Vue',
        desc: '前端框架'
    },
    {
        imgSrc: `${base}images/tailwindcss.svg`,
        label: 'Tailwind CSS',
        desc: '样式工具'
    },
    {
        imgSrc: `${base}images/nodejs.svg`,
        label: 'Node.js',
        desc: '后端运行时'
    },
];
