import { useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import Lenis from '@studio-freight/lenis';

const ANIMATION_CONFIG = {
    start: '-200 bottom',
    end: 'bottom 80%',
    ease: 'power2.out',
    duration: 1,
    y: 0,
    opacity: 1,
};

function prefersReducedMotion() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function HomeMotion() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const lenis = new Lenis({
            duration: 0,
            easing: (t: number) => t,
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: false,
            wheelMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 1,
            infinite: false,
        });

        let rafId = requestAnimationFrame(function raf(time: number) {
            lenis.raf(time);
            rafId = requestAnimationFrame(raf);
        });

        return () => {
            cancelAnimationFrame(rafId);
            lenis.destroy();
        };
    }, []);

    useGSAP(() => {
        let scrollTriggers: import('gsap/ScrollTrigger').ScrollTrigger[] = [];

        const run = async () => {
            const { default: gsap } = await import('gsap');
            const { ScrollTrigger } = await import('gsap/ScrollTrigger');
            gsap.registerPlugin(ScrollTrigger);

            if (prefersReducedMotion()) {
                const elements = gsap.utils.toArray<HTMLElement>('.reveal-up');
                elements.forEach((element) => {
                    gsap.set(element, { opacity: 1, y: 0 });
                });
                return;
            }

            const elements = gsap.utils.toArray<HTMLElement>('.reveal-up');

            elements.forEach((element) => {
                element.style.willChange = 'transform, opacity';
                const st = ScrollTrigger.create({
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
                                element.style.willChange = 'auto';
                            },
                        });
                    },
                });
                scrollTriggers.push(st);
            });
        };

        run();

        return () => {
            scrollTriggers.forEach((st) => st.kill());
            document.querySelectorAll('.reveal-up').forEach((element) => {
                (element as HTMLElement).style.willChange = 'auto';
            });
        };
    });

    return null;
}
