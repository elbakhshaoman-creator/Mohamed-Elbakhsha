/**
 * Particle celebration canvas effect: creates burst of colorful confetti,
 * stars, and math symbols (+, π, ∑, √) for winners and achievements.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  vRot: number;
  char?: string;
  alpha: number;
}

export function triggerCelebration(originX?: number, originY?: number) {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const startX = originX ?? width / 2;
  const startY = originY ?? height * 0.45;

  const colors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4'];
  const mathChars = ['π', '∑', '√', '+', '★', '∞', '%', '≠'];

  const particles: Particle[] = [];
  const particleCount = 75;

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 9;
    const isChar = Math.random() > 0.4;

    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: isChar ? 16 + Math.random() * 10 : 6 + Math.random() * 8,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.2,
      char: isChar ? mathChars[Math.floor(Math.random() * mathChars.length)] : undefined,
      alpha: 1
    });
  }

  let animationFrameId: number;
  const startTime = Date.now();
  const maxDuration = 2200;

  function render() {
    if (!ctx) return;
    const elapsed = Date.now() - startTime;
    if (elapsed > maxDuration) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // gravity
      p.vx *= 0.98; // air drag
      p.rotation += p.vRot;
      p.alpha = Math.max(0, 1 - elapsed / maxDuration);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.char) {
        ctx.font = `bold ${p.size}px Cairo, sans-serif`;
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.char, 0, 0);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      }

      ctx.restore();
    });

    animationFrameId = requestAnimationFrame(render);
  }

  animationFrameId = requestAnimationFrame(render);

  setTimeout(() => {
    cancelAnimationFrame(animationFrameId);
    if (canvas.parentNode) {
      canvas.remove();
    }
  }, maxDuration + 100);
}
