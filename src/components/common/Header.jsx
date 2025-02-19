/**
 * 
 * Node Modules
 */
import { useState } from "react";
import { Link } from "react-router-dom";

/**
 * 
 * Components
 */
import Navbar from './Navbar';

/**
 * Header Component
 * 响应式设计的页面头部组件
 * - 小屏幕（<768px）：Flex布局，元素水平排列
 * - 中等屏幕（≥768px）：Grid布局，1:3:1 三列布局
 */
const Header = () => {
    const [navOpen, setNavOpen] = useState(false);

    const handleContactClick = (e) => {
        e.preventDefault();
        const element = document.getElementById('contact');
        if (element) {
            const offset = element.offsetTop - 80;
            window.scrollTo({
                top: offset,
                behavior: 'smooth'
            });
        }
    };

    return(
       <header className="fixed top-0 left-0 w-full h-20 flex items-center z-40 bg-gradient-to-b from-zinc-900 to-zinc-900/0">
            {/* 
              主容器：响应式布局容器
              - max-w-screen-xl: 最大宽度限制
              - mx-auto: 水平居中
              - px-4: 默认左右内边距
              - flex justify-between items-center: 小屏幕时的Flex布局
              - md:px-6: 中等屏幕时增加内边距
              - md:grid md:grid-cols-[1fr,3fr,1fr]: 中等屏幕时切换为1:3:1的Grid布局
            */}
            <div className="max-w-screen-xl mx-auto w-full px-4 flex justify-between items-center md:px-6 md:grid md:grid-cols-[1fr,3fr,1fr]">
                {/* Logo区域 - 第一列 (1fr) */}
                <h1>
                    <Link 
                        to="/" 
                        className="logo"
                    >
                        <img 
                            src="/images/logo.svg"
                            width={40} 
                            height={40} 
                            alt="墨韵-作品集"
                        />
                    </Link>
                </h1>

                {/* 导航区域 - 第二列 (3fr) 
                    relative: 设置相对定位，为可能的绝对定位子元素提供定位上下文
                    md:justify-self-center: 在中等屏幕下，按钮在Grid单元格中水平居中
                */}
                <div className="relative md:justify-self-center">
                    <button
                        className="menu-btn md:hidden" 
                        onClick={() => setNavOpen((prev) => !prev)}
                    >
                        <span className="material-symbols-rounded">
                            {navOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                    <Navbar navOpen={navOpen} setNavOpen={setNavOpen}/>
                </div>

                {/* 联系按钮 - 第三列 (1fr) */}
                <a 
                    href="#contact"  
                    className="btn btn-secondary max-md:hidden md:justify-self-end"
                    onClick={handleContactClick}
                >
                    联系我
                </a>
            </div>
       </header>
    )
}

export default Header;