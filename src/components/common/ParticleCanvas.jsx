import { useEffect, useRef } from 'react';

const ParticleCanvas = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationId;
        let particles = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createParticle = () => {
            return {
                x: Math.random() * canvas.width,
                y: canvas.height + Math.random() * 100,
                size: Math.random() * 2 + 1,
                speedY: Math.random() * 0.5 + 0.2,
                opacity: Math.random() * 0.5 + 0.3,
                twinkle: Math.random() * 0.02
            };
        };

        const initParticles = () => {
            particles = [];
            const count = Math.min(150, Math.floor((canvas.width * canvas.height) / 10000));
            for (let i = 0; i < count; i++) {
                const p = createParticle();
                p.y = Math.random() * canvas.height;
                particles.push(p);
            }
        };

        const drawParticle = (p) => {
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            gradient.addColorStop(0, `rgba(200, 220, 255, ${p.opacity})`);
            gradient.addColorStop(0.5, `rgba(200, 220, 255, ${p.opacity * 0.5})`);
            gradient.addColorStop(1, 'rgba(200, 220, 255, 0)');
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        };

        const updateParticle = (p) => {
            p.y -= p.speedY;
            p.opacity += p.twinkle;
            if (p.opacity > 0.8 || p.opacity < 0.2) {
                p.twinkle = -p.twinkle;
            }
            if (p.y < -10) {
                p.y = canvas.height + 10;
                p.x = Math.random() * canvas.width;
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                updateParticle(p);
                drawParticle(p);
            });
            animationId = requestAnimationFrame(animate);
        };

        resize();
        initParticles();
        animate();

        window.addEventListener('resize', () => {
            resize();
            initParticles();
        });

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ opacity: 0.6 }}
        />
    );
};

export default ParticleCanvas;