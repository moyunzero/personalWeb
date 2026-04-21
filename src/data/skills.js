const base = import.meta.env.BASE_URL;

/**
 * 技能数据
 */
export const skills = [
    {
        imgSrc: `${base}images/css3.svg`,
        label: 'CSS3',
        desc: '样式与布局'
    },
    {
        imgSrc: `${base}images/javascript.svg`,
        label: 'JavaScript',
        desc: '交互与逻辑'
    },
    {
        imgSrc: `${base}images/vue.svg`,
        label: 'Vue',
        desc: '渐进式框架'
    },
    {
        imgSrc: `${base}images/react.svg`,
        label: 'React',
        desc: '声明式UI'
    },
    {
        imgSrc: `${base}images/nuxt.svg`,
        label: 'Nuxt',
        desc: '全栈框架'
    },
    {
        imgSrc: `${base}images/tailwindcss.svg`,
        label: 'Tailwind CSS',
        desc: '原子化样式'
    },
    {
        imgSrc: `${base}images/nodejs.svg`,
        label: 'Node.js',
        desc: '服务端开发'
    },
    {
        imgSrc: `${base}images/langchain.png`,
        label: 'LangChain',
        desc: 'AI 应用开发'
    }
];