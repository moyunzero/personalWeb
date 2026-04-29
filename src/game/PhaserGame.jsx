import { useEffect, useRef } from 'react';

/**
 * PhaserGame — 无侵入式 Phaser 3 容器组件
 *
 * - 懒加载 Phaser（独立 chunk，不阻塞首屏）
 * - canvas 设置 pointer-events: none，完全不干扰页面交互
 * - 组件卸载时自动销毁 Phaser 实例，无内存泄漏
 */
const PhaserGame = () => {
  const containerRef = useRef(null);
  const gameRef      = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Dynamic import keeps Phaser (~1 MB) out of the initial bundle
      const [{ default: Phaser }, { default: GameScene }] = await Promise.all([
        import('phaser'),
        import('./scenes/GameScene'),
      ]);

      if (cancelled || !containerRef.current) return;

      const config = {
        type: Phaser.AUTO,

        // Transparent canvas — page background shows through
        transparent: true,
        backgroundColor: 'rgba(0,0,0,0)',

        parent: containerRef.current,

        // RESIZE mode: Phaser canvas always equals the viewport
        scale: {
          mode:   Phaser.Scale.RESIZE,
          width:  window.innerWidth,
          height: window.innerHeight,
        },

        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 800 },
            debug:   false,
          },
        },

        scene: [GameScene],

        // Disable the default Phaser banner in console
        banner: false,
      };

      const game = new Phaser.Game(config);
      gameRef.current = game;
    })();

    return () => {
      cancelled = true;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="phaser-container"
      aria-hidden="true"
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        50,
        pointerEvents: 'none',
        overflow:      'hidden',
      }}
    />
  );
};

export default PhaserGame;
