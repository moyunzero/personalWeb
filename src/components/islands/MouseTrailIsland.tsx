import { useEffect, useRef } from 'react';

type TrailPoint = {
    x: number;
    y: number;
    size: number;
    opacity: number;
    speedX: number;
    speedY: number;
};

export default function MouseTrailIsland() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pointsRef = useRef<TrailPoint[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const handleMouseMove = (e: MouseEvent) => {
            pointsRef.current.push({
                x: e.clientX,
                y: e.clientY,
                size: Math.random() * 3 + 2,
                opacity: 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
            });
            if (pointsRef.current.length > 50) {
                pointsRef.current.shift();
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pointsRef.current.forEach((point, index) => {
                point.opacity -= 0.02;
                point.x += point.speedX;
                point.y += point.speedY;

                if (point.opacity <= 0) {
                    pointsRef.current.splice(index, 1);
                    return;
                }

                const gradient = ctx.createRadialGradient(
                    point.x,
                    point.y,
                    0,
                    point.x,
                    point.y,
                    point.size * 2,
                );
                gradient.addColorStop(0, `rgba(200, 220, 255, ${point.opacity})`);
                gradient.addColorStop(0.5, `rgba(200, 220, 255, ${point.opacity * 0.5})`);
                gradient.addColorStop(1, 'rgba(200, 220, 255, 0)');

                ctx.beginPath();
                ctx.arc(point.x, point.y, point.size * 2, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            });

            animationId = requestAnimationFrame(draw);
        };

        resize();
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        draw();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[9999]"
            aria-hidden="true"
        />
    );
}
