/**
 * Components
 */
import { ButtonPrimary, ButtonOutline } from "../common/Button"

const Main = () => {
    return (
        <section
            id="home"
            className="pt-28 lg:pt-36 relative overflow-hidden"
        >
            {/* 装饰性背景元素 - 渐变圆形 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] lg:w-[800px] lg:h-[800px] bg-gradient-to-br from-sky-400/10 via-sky-400/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] lg:w-[500px] lg:h-[500px] bg-gradient-to-br from-emerald-400/10 via-emerald-400/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="container relative z-10">
                {/* 居中容器，限制最大宽度并居中显示 */}
                <div className="max-w-4xl mx-auto text-center lg:text-left">
                    {/* 状态指示器 */}
                    <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                        {/* 使用纯 CSS 渐变背景替代图片 */}
                        <figure className="w-9 h-9 rounded-lg flex-shrink-0 bg-gradient-to-br from-sky-400 via-emerald-400 to-purple-500 relative overflow-hidden">
                            {/* 装饰性几何图形 */}
                            <div className="absolute top-1 left-1 w-3 h-3 rounded-full bg-white/30"></div>
                            <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-white/40"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/60"></div>
                            {/* 高光效果 */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                        </figure>
                        <div className="flex items-center gap-1.5 text-zinc-400 text-sm tracking-wide">
                            <span className="relative w-2 h-2 rounded-full bg-emerald-400">
                                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping"></span>   
                            </span>
                            正在摸鱼中 🐟
                        </div>
                    </div>
                    
                    {/* 主标题 - 增加行高和间距，让内容更饱满 */}
                    <h2 className="headline-1 max-w-full sm:max-w-3xl lg:max-w-4xl mx-auto lg:mx-0 mt-5 mb-10 lg:mb-12 leading-tight">
                        用代码创造有趣的东西 ✨
                    </h2>
                    
                    {/* 按钮组 - 居中显示，移动端堆叠 */}
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                        <ButtonPrimary 
                            href="/resume.pdf"
                            label="看看我的简历"
                            icon="download"
                        />
 
                        <ButtonOutline
                            href="#about"
                            label="了解更多"
                            icon="arrow_downward"
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Main