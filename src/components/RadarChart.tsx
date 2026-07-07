'use client';

import { useEffect, useRef } from 'react';

interface RadarDataPoint {
  label: string;
  value: number; // 0-10
  color?: string;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
}

export default function RadarChart({ data, size = 220 }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const progressRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 3) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.38;
    const n = data.length;
    const startTime = performance.now();
    const duration = 900;

    const getPoint = (i: number, r: number): [number, number] => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
    };

    const draw = (t: number) => {
      const elapsed = t - startTime;
      const raw = Math.min(elapsed / duration, 1);
      // ease out cubic
      const p = 1 - Math.pow(1 - raw, 3);
      progressRef.current = p;

      ctx.clearRect(0, 0, size, size);

      // Grid circles
      const levels = 5;
      for (let l = 1; l <= levels; l++) {
        const r = (l / levels) * maxR;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const [x, y] = getPoint(i, r);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(109,40,217,${l === levels ? 0.2 : 0.1})`;
        ctx.lineWidth = l === levels ? 1 : 0.5;
        ctx.stroke();
        // Fill innermost
        if (l === levels) {
          ctx.fillStyle = 'rgba(109,40,217,0.02)';
          ctx.fill();
        }
      }

      // Axis lines
      for (let i = 0; i < n; i++) {
        const [x, y] = getPoint(i, maxR);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(109,40,217,0.15)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Data polygon
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const r = (data[i].value / 10) * maxR * p;
        const [x, y] = getPoint(i, r);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      // Gradient fill
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      grad.addColorStop(0, 'rgba(139,92,246,0.45)');
      grad.addColorStop(1, 'rgba(79,70,229,0.12)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(139,92,246,0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Data points glow
      for (let i = 0; i < n; i++) {
        const r = (data[i].value / 10) * maxR * p;
        const [x, y] = getPoint(i, r);
        const grd = ctx.createRadialGradient(x, y, 0, x, y, 8);
        grd.addColorStop(0, 'rgba(167,139,250,0.9)');
        grd.addColorStop(1, 'rgba(139,92,246,0)');
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#c4b5fd';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      // Labels
      ctx.font = `600 10px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < n; i++) {
        const [x, y] = getPoint(i, maxR + 20);
        ctx.fillStyle = 'rgba(17,24,39,0.85)'; // Dark text
        ctx.fillText(data[i].label, x, y);
        // Value
        const [vx, vy] = getPoint(i, (data[i].value / 10) * maxR * p);
        if (p > 0.5) {
          ctx.font = `700 9px Inter, sans-serif`;
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.fillText(data[i].value.toFixed(1), vx, vy - 10);
          ctx.font = `600 10px Inter, sans-serif`;
        }
      }

      if (raw < 1) {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [data, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, display: 'block', margin: '0 auto' }}
      aria-label="Investment radar chart"
    />
  );
}
