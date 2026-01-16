import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Main from '../components/home/Main';
import About from '../components/home/About';
import Skill from '../components/home/Skill';
import Work from '../components/home/Work';
import Contact from '../components/home/Contact';

gsap.registerPlugin(ScrollTrigger);

// 动画配置常量
const ANIMATION_CONFIG = {
    start: '-200 bottom',
    end: 'bottom 80%',
    ease: 'power2.out',
    duration: 1,
    y: 0,
    opacity: 1
};

// 检测用户是否偏好减少动画
const prefersReducedMotion = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const Home = () => {
    useGSAP(() => {
        // 如果用户偏好减少动画，则跳过
        if (prefersReducedMotion()) {
            // 直接显示所有元素，不添加动画
            const elements = gsap.utils.toArray('.reveal-up');
            elements.forEach(element => {
                gsap.set(element, { opacity: 1, y: 0 });
            });
            return;
        }

        const elements = gsap.utils.toArray('.reveal-up');
        const scrollTriggers = [];

        elements.forEach(element => {
            // 添加 will-change 优化性能
            element.style.willChange = 'transform, opacity';
            
            const scrollTrigger = ScrollTrigger.create({
                trigger: element,
                start: ANIMATION_CONFIG.start,
                end: ANIMATION_CONFIG.end,
                scrub: true,
                onEnter: () => {
                    gsap.to(element, {
                        y: ANIMATION_CONFIG.y,
                        opacity: ANIMATION_CONFIG.opacity,
                        ease: ANIMATION_CONFIG.ease,
                        duration: ANIMATION_CONFIG.duration,
                        onComplete: () => {
                            // 动画完成后移除 will-change
                            element.style.willChange = 'auto';
                        }
                    });
                }
            });
            
            scrollTriggers.push(scrollTrigger);
        });

        // 清理函数
        return () => {
            scrollTriggers.forEach(st => st.kill());
            elements.forEach(element => {
                element.style.willChange = 'auto';
            });
        };
    }, { scope: document });

    return (
        <main>
            <Main />
            <About />
            <Skill />
            <Work />
            <Contact />
        </main>
    );
};

export default Home;