import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Main from '../components/home/Main';
import About from '../components/home/About';
import Skill from '../components/home/Skill';
import Work from '../components/home/Work';
import Review from '../components/home/Review';
import Contact from '../components/home/Contact';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
    useGSAP(() => {
        const elements = gsap.utils.toArray('.reveal-up');
        elements.forEach(element => {
            gsap.to(element, {
                scrollTrigger: {
                    trigger: element,
                    scrub: true,
                    start: '-200 bottom',
                    end: 'bottom 80%'
                },
                y: 0,
                ease: 'power2.out',
                duration: 1,
                opacity: 1
            })
        })
    });

    return (
        <main>
            <Main />
            <About />
            <Skill />
            <Work />
            <Review />
            <Contact />
        </main>
    );
};

export default Home; 