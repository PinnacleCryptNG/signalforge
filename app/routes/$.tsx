import { Link } from "react-router";

import { IconArrowRight, IconRadar } from "@/components/icons";

export function meta() {
  return [{ title: "Lost signal · SignalForge" }];
}

export default function NotFound() {
  return (
    <div className="sf-stage relative flex min-h-full items-center justify-center overflow-hidden px-6 py-20">
      <div className="sf-grid-lines pointer-events-none absolute inset-0" aria-hidden />
      <div className="sf-rise relative max-w-lg text-center">
        <div className="sf-wave mx-auto w-max opacity-60" aria-hidden>
          {[0.2, 0.35, 0.15, 0.5, 0.1, 0.25, 0.12].map((d, i) => (
            <span key={i} style={{ animationDelay: `${d}s`, animationDuration: "2.4s" }} />
          ))}
        </div>
        <p className="sf-label mt-6 text-[12px] text-[var(--sf-steel)]">404 · signal lost</p>
        <h1 className="sf-display mt-3 text-4xl sm:text-5xl">Nothing rising here.</h1>
        <p className="mt-4 text-muted-foreground">This page went cold, or it never existed. Head back to the wire and catch the next story while it's still rising.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/signals" className="sf-molten inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-[#1a0b03] [--icon-accent:#1a0b03]">
            <IconRadar size={18} /> Back to Signals
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:border-[var(--sf-ember)]">
            Home <IconArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
