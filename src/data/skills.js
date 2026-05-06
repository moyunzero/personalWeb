const base = import.meta.env.BASE_URL;

/**
 * 技能数据
 * level: 1-入门, 2-熟悉, 3-精通
 */
export const skills = [
    {
        imgSrc: `${base}images/html5.svg`,
        label: 'HTML5',
        desc: '结构与语义化',
        level: 2
    },
    {
        imgSrc: `${base}images/css3.svg`,
        label: 'CSS3',
        desc: '样式与布局',
        level: 2
    },
    {
        imgSrc: `${base}images/javascript.svg`,
        label: 'JavaScript',
        desc: '交互与逻辑',
        level: 2
    },
    {
        imgSrc: `${base}images/typescript.svg`,
        label: 'TypeScript',
        desc: '类型安全开发',
        level: 1
    },
    {
        imgSrc: `${base}images/vue.svg`,
        label: 'Vue',
        desc: '渐进式框架',
        level: 2
    },
    {
        imgSrc: `${base}images/react.svg`,
        label: 'React',
        desc: '声明式UI',
        level: 1
    },
    {
        imgSrc: `${base}images/nuxt.svg`,
        label: 'Nuxt',
        desc: '全栈框架',
        level: 1
    },
    {
        imgSrc: `${base}images/pinia.svg`,
        label: 'Pinia',
        desc: 'Vue 状态管理',
        level: 1
    },
    {
        imgSrc: `${base}images/tailwindcss.svg`,
        label: 'Tailwind CSS',
        desc: '原子化样式',
        level: 1
    },
    {
        imgSrc: `${base}images/reactnative.svg`,
        label: 'React Native',
        desc: '跨平台移动开发',
        level: 1
    },
    {
        imgSrc: `${base}images/nodejs.svg`,
        label: 'Node.js',
        desc: '服务端开发',
        level: 1
    },
    {
        imgSrc: `${base}images/expressjs.svg`,
        label: 'Express.js',
        desc: 'Web 服务框架',
        level: 1
    },
    {
        imgSrc: `${base}images/vite.svg`,
        label: 'Vite',
        desc: '极速构建工具',
        level: 1
    },
    {
        imgSrc: `${base}images/git.svg`,
        label: 'Git',
        desc: '版本控制',
        level: 2
    },
    {
        imgSrc: `${base}images/langchain.svg`,
        label: 'LangChain',
        desc: 'AI 应用开发',
        level: 1
    }
];