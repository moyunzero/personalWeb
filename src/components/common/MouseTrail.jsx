import { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';

const MouseTrail = () => {
    const particlesInit = useCallback(async (engine) => {
        await loadFull(engine);
    }, []);

    return (
        <Particles
            id="tsparticles"
            init={particlesInit}
            className="fixed inset-0 pointer-events-none z-[9999]"
            options={{
                fullScreen: false,
                style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                },
                particles: {
                    number: {
                        value: 0
                    },
                    color: {
                        value: '#ffffff'
                    },
                    shape: {
                        type: 'circle'
                    },
                    opacity: {
                        value: 1,
                        animation: {
                            enable: true,
                            speed: 1,
                            startValue: 'max',
                            destroy: 'min'
                        }
                    },
                    size: {
                        value: { min: 2, max: 5 }
                    },
                    life: {
                        duration: {
                            sync: true,
                            value: 1
                        },
                        count: 1
                    },
                    move: {
                        enable: true,
                        speed: 3,
                        direction: 'none',
                        outModes: 'destroy'
                    }
                },
                emitters: {
                    onClick: {
                        enable: true,
                        mode: 'trail'
                    },
                    onHover: {
                        enable: true,
                        mode: 'trail'
                    },
                    life: {
                        count: 0,
                        duration: 0.1
                    },
                    rate: {
                        delay: 0.01,
                        quantity: 2
                    },
                    size: {
                        width: 50,
                        height: 50
                    },
                    position: {
                        select: 'mouse'
                    }
                }
            }}
        />
    );
};

export default MouseTrail;