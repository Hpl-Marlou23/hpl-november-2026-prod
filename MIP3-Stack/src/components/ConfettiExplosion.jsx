import { useEffect, useRef } from "react";

const GOLD_PALETTE = [
  "#FFD700", // Classic gold
  "#FFE47A", // Light champagne gold
  "#F5B041", // Rich warm gold
  "#D4AF37", // Metallic gold
  "#FFF2B2", // Shimmering light gold
  "#E59866", // Rose gold / copper accent
  "#FAD7A0", // Pale gold
];

const ConfettiExplosion = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let isActive = true;

    // Origin centered near image1 reveal center (~50% X, ~48% Y)
    const originX = canvas.width * 0.5;
    const originY = canvas.height * 0.48;

    const PARTICLE_COUNT = 90;
    const particles = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 12 + Math.random() * 32; // burst explosion speed
      const isRibbon = Math.random() > 0.45;

      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed * (0.8 + Math.random() * 0.5),
        vy: Math.sin(angle) * speed * (0.8 + Math.random() * 0.5) - 4, // slight upward bias
        size: isRibbon ? 14 + Math.random() * 14 : 12 + Math.random() * 12,
        length: isRibbon ? 28 + Math.random() * 26 : 12 + Math.random() * 12,
        color: GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.25,
        wobble: Math.random() * 10,
        wobbleSpeed: 0.1 + Math.random() * 0.15,
        alpha: 1,
        gravity: 0.45 + Math.random() * 0.35,
        drag: 0.94 + Math.random() * 0.03,
        decay: 0.008 + Math.random() * 0.012,
        isRibbon,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let aliveCount = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (p.alpha <= 0) continue;
        aliveCount++;

        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;

        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;
        p.alpha = Math.max(0, p.alpha - p.decay);

        const wobbleX = Math.sin(p.wobble) * (p.isRibbon ? 4 : 2);

        ctx.save();
        ctx.translate(p.x + wobbleX, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.isRibbon) {
          ctx.fillRect(-p.size / 2, -p.length / 2, p.size, p.length);
        } else {
          // Circular / rounded particle
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      if (aliveCount > 0 && isActive) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      isActive = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={1080}
      height={1920}
      className="absolute inset-0 pointer-events-none z-0 w-full h-full"
    />
  );
};

export default ConfettiExplosion;
