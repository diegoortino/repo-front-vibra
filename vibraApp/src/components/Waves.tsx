import { useEffect, useRef } from "react";

export function Waves() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseYRef = useRef(window.innerHeight / 2);

  const CONFIG = {
    WAVE_LINES: 6,
    ANIMATION_SPEED: 0.002,
    WAVE_FREQUENCY_BASE: 0.004,
    WAVE_FREQUENCY_INCREMENT: 0.0008,
    WAVE_AMPLITUDE_BASE: 25,
    WAVE_AMPLITUDE_INCREMENT: 8,
    WAVE_PHASE_INCREMENT: 30
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let waves: { amplitude: number; frequency: number; phase: number; offsetY: number }[] = [];
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      waves = [];
      for (let i = 0; i < CONFIG.WAVE_LINES; i++) {
        waves.push({
          amplitude: CONFIG.WAVE_AMPLITUDE_BASE + i * CONFIG.WAVE_AMPLITUDE_INCREMENT,
          frequency: CONFIG.WAVE_FREQUENCY_BASE + i * CONFIG.WAVE_FREQUENCY_INCREMENT,
          phase: i * CONFIG.WAVE_PHASE_INCREMENT,
          offsetY: (i + 0.5) * (height / CONFIG.WAVE_LINES)
        });
      }
    };

    const animate = (time = 0) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "rgba(160,120,255,0.4)";
      ctx.shadowBlur = 8;

      const amplitudeFactor = 1 + (mouseYRef.current - height / 2) / (height * 2);

      waves.forEach((wave, index) => {
        const opacity = 0.3 - index * 0.04;
        ctx.strokeStyle = `rgba(160,120,255,${opacity})`;
        ctx.beginPath();
        for (let x = 0; x < width; x += 2) {
          const y =
            wave.offsetY +
            Math.sin(x * wave.frequency + time * CONFIG.ANIMATION_SPEED + wave.phase) *
              wave.amplitude *
              amplitudeFactor;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", (e) => (mouseYRef.current = e.clientY));

    resizeCanvas();
    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", (e) => (mouseYRef.current = e.clientY));
    };
  }, []);

  return (
    <>
      <canvas id="waves" ref={canvasRef}></canvas>
    </>
  );
}
