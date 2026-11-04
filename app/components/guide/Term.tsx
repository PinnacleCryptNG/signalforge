import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";
import { createPortal } from "react-dom";

/** A SignalForge word with a dotted underline; hover, focus or tap shows what it means. */
export function Term({ k, children, className = "" }: { k: GlossaryKey; children?: React.ReactNode; className?: string }) {
  const g = GLOSSARY[k];
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const hovered = useRef(false);
  const [pos, setPos] = useState<{ left: number; top: number; above: boolean } | null>(null);

  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const w = Math.min(280, window.innerWidth - 24);
    const above = r.bottom + 150 > window.innerHeight;
    setPos({ left: Math.max(12, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 12)), top: above ? r.top - 8 : r.bottom + 8, above });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e.type === "pointerdown" && btn.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", close);
    window.addEventListener("pointerdown", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("keydown", close);
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => (hovered.current ? true : !o));
        }}
        onMouseEnter={() => {
          hovered.current = true;
          setOpen(true);
        }}
        onMouseLeave={() => {
          hovered.current = false;
          setOpen(false);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={`sf-term ${className}`}
      >
        {children ?? g.word}
      </button>
      {open && pos && createPortal(
        <span
          role="tooltip"
          id={id}
          className="sf-term-pop"
          style={{ left: pos.left, top: pos.top, transform: pos.above ? "translateY(-100%)" : undefined, width: Math.min(280, window.innerWidth - 24) }}
        >
          <b>{g.word}</b> <span className="sf-term-short">· {g.short}</span>
          <span className="mt-1 block">{g.text}</span>
        </span>,
        document.body,
      )}
    </>
  );
}
