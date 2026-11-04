import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { createPortal } from "react-dom";

import { IconArrowRight, IconX } from "@/components/icons";

const DONE_KEY = "sf-tour-done-v1";

type Step = { target?: string; title: string; body: string };

const STEPS: Step[] = [
  { title: "Welcome to SignalForge", body: "SignalForge finds what people are talking about in your topic and writes ready-to-post content for you. This tour takes under a minute." },
  { target: "topic", title: "1. Start with your topic", body: "Type what you post about, like “fitness” or “AI tools”, and tap the orange button. We check 6 free news and social sites in about 2 seconds." },
  { target: "stories", title: "2. Signals: what's trending", body: "Signals are the stories people are talking about right now, like this one. The orange Buzz bar shows how fast each one is growing." },
  { target: "autopilot", title: "3. Autopilot: AI does it all", body: "Tap Autopilot on any story, or this button for the top one. The AI finds the facts and writes 5 posts (X, LinkedIn, Instagram, newsletter, video) in about a minute. You just read and approve." },
  { target: "nav-forge", title: "4. Forge: where posts get written", body: "Stories you pick live here. Read the facts, edit any post and approve it. Want full control? Choose Step by step instead of Autopilot." },
  { target: "nav-calendar", title: "5. Calendar: plan your week", body: "Approved posts go here. SignalForge never posts for you: copy each post when it's time, or add them all to Google or Apple Calendar." },
  { target: "agent", title: "6. Your AI helper", body: "Ask anything in plain words, like “make my LinkedIn post shorter”. You can replay this tour any time from the ? button at the top." },
];

export const startTour = () => window.dispatchEvent(new Event("sf:tour"));

function findTarget(name?: string): HTMLElement | null {
  if (!name) return null;
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden") return el;
  }
  return null;
}

/** Six-step first-visit guide. Skippable, replayable from the header's ? button. */
export function Tour() {
  const location = useLocation();
  const navigate = useNavigate();
  const [i, setI] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const start = () => {
      if (!location.pathname.startsWith("/signals")) navigate("/signals");
      setI(0);
    };
    window.addEventListener("sf:tour", start);
    return () => window.removeEventListener("sf:tour", start);
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!location.pathname.startsWith("/signals")) return;
    try {
      if (localStorage.getItem(DONE_KEY)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => setI((v) => v ?? 0), 900);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const close = useCallback(() => {
    setI(null);
    try {
      localStorage.setItem(DONE_KEY, "1");
    } catch {}
  }, []);

  const step = i === null ? null : STEPS[i];

  useLayoutEffect(() => {
    if (!step) return;
    const el = findTarget(step.target);
    if (el) el.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
    const measure = () => setRect(findTarget(step.target)?.getBoundingClientRect() ?? null);
    measure();
    const t = setTimeout(measure, 120);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step]);

  useEffect(() => {
    if (i === null) return;
    next.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setI((v) => (v === null ? v : Math.min(v + 1, STEPS.length - 1)));
      if (e.key === "ArrowLeft") setI((v) => (v === null ? v : Math.max(v - 1, 0)));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [i, close]);

  if (!step || i === null) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(340, vw - 24);
  const pad = 8;
  let style: React.CSSProperties = { width: w, left: (vw - w) / 2, top: vh / 2, transform: "translateY(-50%)" };
  if (rect) {
    const left = Math.max(12, Math.min(rect.left + rect.width / 2 - w / 2, vw - w - 12));
    const below = rect.bottom + pad + 220 < vh || rect.top < 240;
    style = below ? { width: w, left, top: Math.min(rect.bottom + pad + 6, vh - 230) } : { width: w, left, top: rect.top - pad - 6, transform: "translateY(-100%)" };
  }
  const last = i === STEPS.length - 1;

  return createPortal(
    <div className="sf-tour" role="presentation">
      {rect ? (
        <div
          className="sf-tour-spot"
          style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
          aria-hidden
        />
      ) : (
        <div className="sf-tour-dim" aria-hidden />
      )}
      <div ref={card} role="dialog" aria-modal="true" aria-labelledby="sf-tour-title" className="sf-tour-card" style={style}>
        <div className="flex items-start justify-between gap-3">
          <p id="sf-tour-title" className="sf-display text-[19px] font-semibold leading-tight">{step.title}</p>
          <button type="button" onClick={close} aria-label="Close the tour" className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground transition hover:text-foreground">
            <IconX className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-foreground/80">{step.body}</p>
        <div className="mt-4 flex items-center gap-2">
          <span className="mr-auto flex gap-1" aria-label={`Step ${i + 1} of ${STEPS.length}`}>
            {STEPS.map((_, j) => (
              <span key={j} className={`h-1.5 rounded-full transition-all ${j === i ? "w-4 bg-[hsl(var(--primary))]" : "w-1.5 bg-muted-foreground/40"}`} />
            ))}
          </span>
          {i > 0 ? (
            <button type="button" onClick={() => setI(i - 1)} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground">
              Back
            </button>
          ) : (
            <button type="button" onClick={close} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground">
              Skip
            </button>
          )}
          <button
            ref={next}
            type="button"
            onClick={() => (last ? close() : setI(i + 1))}
            className="sf-molten flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-bold text-[#1a0e05] transition hover:brightness-110"
          >
            {last ? "Got it" : i === 0 ? "Show me" : "Next"} {!last && <IconArrowRight className="size-4" />}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
