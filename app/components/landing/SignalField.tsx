import { useEffect, useRef } from "react";

const FEEDS = ["Google News", "Reddit", "Hacker News", "Bluesky", "Wikipedia", "Google Trends"];
const OUTS = ["X thread", "LinkedIn", "Instagram", "Newsletter", "Video script"];
const STEEL = [127, 167, 201];
const EMBER = [255, 106, 31];
const GOLD = [255, 192, 92];

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i]! - v) * t));
const heat = (t: number) => (t < 0.6 ? mix(STEEL, EMBER, t / 0.6) : mix(EMBER, GOLD, (t - 0.6) / 0.4));
const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
type P = { x: number; y: number };
const bez = (a: P, c1: P, c2: P, b: P, t: number): P => {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
    y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
  };
};

/** Hero visual: cold signals stream in from six feeds, heat up in the forge, and leave as five platform drafts. */
export function SignalField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, dpr = 1, raf = 0, visible = true, t0 = performance.now();
    let vertical = false;
    type Stream = { a: P; c1: P; c2: P; b: P; speed: number; off: number; feed: number; wobble: number };
    let ins: Stream[] = [], outs: Stream[] = [], core: P = { x: 0, y: 0 }, feedPts: P[] = [], outPts: P[] = [];

    function layout() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      vertical = W < 560;
      core = vertical ? { x: W / 2, y: H * 0.5 } : { x: W * 0.5, y: H * 0.5 };
      feedPts = FEEDS.map((_, i) => vertical
        ? { x: W * (0.08 + (i / (FEEDS.length - 1)) * 0.84), y: H * 0.07 }
        : { x: W * 0.06, y: H * (0.12 + (i / (FEEDS.length - 1)) * 0.76) });
      outPts = OUTS.map((_, i) => vertical
        ? { x: W * (0.1 + (i / (OUTS.length - 1)) * 0.8), y: H * 0.93 }
        : { x: W * 0.86, y: H * (0.16 + (i / (OUTS.length - 1)) * 0.68) });
      ins = Array.from({ length: vertical ? 30 : 42 }, (_, k) => {
        const feed = k % FEEDS.length;
        const a = feedPts[feed]!;
        const j = (Math.sin(k * 12.9898) * 43758.5453) % 1;
        const spread = vertical ? W * 0.12 : H * 0.1;
        const c1 = vertical ? { x: a.x + j * spread, y: H * 0.25 } : { x: W * 0.22, y: a.y + j * spread };
        const c2 = vertical ? { x: core.x + (a.x - core.x) * 0.25, y: H * 0.36 } : { x: W * 0.36, y: core.y + (a.y - core.y) * 0.25 };
        return { a, c1, c2, b: core, speed: 0.16 + Math.abs(j) * 0.18, off: Math.abs(j * 7.3) % 1, feed, wobble: j };
      });
      outs = OUTS.map((_, i) => {
        const b = outPts[i]!;
        const c1 = vertical ? { x: core.x, y: H * 0.66 } : { x: W * 0.62, y: core.y };
        const c2 = vertical ? { x: b.x, y: H * 0.72 } : { x: W * 0.72, y: b.y };
        return { a: core, c1, c2, b, speed: 0.32, off: i / OUTS.length, feed: i, wobble: 0 };
      });
    }

    function chip(p: P, text: string, color: number[], alpha: number, align: "left" | "right" | "center") {
      ctx.font = `600 ${vertical ? 9.5 : 11.5}px "DM Sans SF", system-ui, sans-serif`;
      const w = ctx.measureText(text).width + (vertical ? 12 : 20), h = vertical ? 18 : 24;
      const x = align === "left" ? p.x : align === "right" ? p.x - w : p.x - w / 2;
      const y = p.y - h / 2;
      ctx.fillStyle = `rgba(14,13,18,${0.85 * alpha})`;
      ctx.strokeStyle = rgba(color, 0.45 * alpha);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = rgba(color, alpha);
      ctx.textBaseline = "middle"; ctx.textAlign = "center";
      ctx.fillText(text, x + w / 2, p.y + 0.5);
    }

    function frame(now: number) {
      const time = reduce ? 4.2 : (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      // faint guide curves
      for (const s of ins) {
        ctx.beginPath(); ctx.moveTo(s.a.x, s.a.y); ctx.bezierCurveTo(s.c1.x, s.c1.y, s.c2.x, s.c2.y, s.b.x, s.b.y);
        ctx.strokeStyle = rgba(STEEL, 0.07); ctx.lineWidth = 1; ctx.stroke();
      }
      for (const s of outs) {
        ctx.beginPath(); ctx.moveTo(s.a.x, s.a.y); ctx.bezierCurveTo(s.c1.x, s.c1.y, s.c2.x, s.c2.y, s.b.x, s.b.y);
        ctx.strokeStyle = rgba(GOLD, 0.16); ctx.lineWidth = 1.4; ctx.stroke();
      }
      // incoming packets: comet trails that heat as they near the forge
      ctx.globalCompositeOperation = "lighter";
      for (const s of ins) {
        const p = (time * s.speed + s.off) % 1;
        const seg = 14;
        for (let i = 0; i < seg; i++) {
          const tt = Math.max(0, p - i * 0.012);
          const q = bez(s.a, s.c1, s.c2, s.b, tt);
          const c = heat(tt);
          ctx.fillStyle = rgba(c, (1 - i / seg) * (0.25 + tt * 0.7));
          ctx.beginPath(); ctx.arc(q.x, q.y, (1 - i / seg) * (1.3 + tt * 1.6), 0, Math.PI * 2); ctx.fill();
        }
      }
      // forge core
      const pulse = 0.5 + 0.5 * Math.sin(time * 2.2);
      const R = Math.min(W, H) * (vertical ? 0.12 : 0.1);
      const g = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, R * 3.2);
      g.addColorStop(0, rgba([255, 241, 214], 0.95));
      g.addColorStop(0.18, rgba(GOLD, 0.75));
      g.addColorStop(0.42, rgba(EMBER, 0.32 + pulse * 0.12));
      g.addColorStop(1, rgba(EMBER, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(core.x, core.y, R * 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      ctx.save(); ctx.translate(core.x, core.y);
      for (let k = 0; k < 3; k++) {
        ctx.rotate(time * (0.25 + k * 0.12) * (k % 2 ? -1 : 1));
        ctx.strokeStyle = rgba(k === 0 ? GOLD : EMBER, 0.55 - k * 0.12);
        ctx.lineWidth = 1.4; ctx.setLineDash([4 + k * 3, 7 + k * 4]);
        ctx.beginPath(); ctx.arc(0, 0, R * (1 + k * 0.32), 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore(); ctx.setLineDash([]);
      ctx.fillStyle = "#140e0a"; ctx.beginPath(); ctx.arc(core.x, core.y, R * 0.62, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.9); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.font = `700 ${vertical ? 9.5 : 11}px "JetBrains Mono SF", ui-monospace, monospace`;
      ctx.fillStyle = rgba([255, 241, 214], 0.95); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("FORGE", core.x, core.y + 0.5);
      // outgoing drafts: gold sparks
      ctx.globalCompositeOperation = "lighter";
      for (const s of outs) {
        for (let n = 0; n < 2; n++) {
          const p = (time * s.speed + s.off + n * 0.5) % 1;
          const q = bez(s.a, s.c1, s.c2, s.b, p);
          const gg = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, 9);
          gg.addColorStop(0, rgba([255, 241, 214], 0.95)); gg.addColorStop(0.4, rgba(GOLD, 0.6)); gg.addColorStop(1, rgba(EMBER, 0));
          ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(q.x, q.y, 9, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";
      // labels
      FEEDS.forEach((f, i) => {
        const glow = 0.55 + 0.45 * Math.max(0, Math.sin(time * 1.3 + i * 1.1));
        chip(feedPts[i]!, vertical ? f.replace("Google ", "").replace("Hacker News", "HN").replace("Wikipedia", "Wiki") : f, STEEL, glow, vertical ? "center" : "left");
      });
      OUTS.forEach((o, i) => {
        const lit = 0.6 + 0.4 * Math.max(0, Math.sin(time * 1.6 - i * 0.9));
        chip(outPts[i]!, vertical ? o.replace(" thread", "").replace(" script", "") : o, GOLD, lit, vertical ? "center" : "left");
      });
      if (!reduce && visible) raf = requestAnimationFrame(frame);
    }

    layout();
    raf = requestAnimationFrame(frame);
    const ro = new ResizeObserver(() => { layout(); if (reduce) frame(performance.now()); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      const was = visible; visible = !!e?.isIntersecting;
      if (visible && !was && !reduce) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, []);
  return <canvas ref={ref} className={className} role="img" aria-label="Signals from Google News, Reddit, Hacker News, Bluesky, Wikipedia and Google Trends flow into the forge and come out as an X thread, LinkedIn post, Instagram caption, newsletter and video script." />;
}
