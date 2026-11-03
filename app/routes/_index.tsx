import { appPath } from "@agent-native/core/client/api-path";
import {
  IconArrowRight,
  IconCalendarEvent,
  IconFileText,
  IconFlame,
  IconRadar,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useEffect, useRef } from "react";

import { SignalForgeMark } from "@/components/landing/Logo";
import "@/components/landing/landing.css";

const TITLE = "SignalForge · Catch the story while it's still rising";
const DESC =
  "SignalForge finds the narratives heating up in your niche, researches them with sources you approve, and forges a campaign for every platform onto your calendar.";

const OG_IMAGE = "https://signalforge-agent.vercel.app/og.jpg?v=1";

export function meta() {
  return [
    { title: TITLE },
    { name: "description", content: DESC },
    { property: "og:type", content: "website" },
    { property: "og:title", content: TITLE },
    { property: "og:description", content: DESC },
    { property: "og:image", content: OG_IMAGE },
    { property: "og:image:secure_url", content: OG_IMAGE },
    { property: "og:image:type", content: "image/jpeg" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: "SignalForge: catch the story while it's still rising" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: OG_IMAGE },
    { name: "twitter:title", content: TITLE },
    { name: "twitter:description", content: DESC },
  ];
}

const HEAD = ["Catch", "the", "story", "while", "it's", "still", "rising."];

const WIRE = [
  ["HN", "Agent swarms in Minecraft drown in bureaucracy"],
  ["Reddit", "Anyone else seeing agents stall on approvals?"],
  ["News", "Labs race to ship multi-agent coding tools"],
  ["Bluesky", "the agent hype cycle just met middle management"],
  ["Trends", "\"ai agent framework\" searches up this week"],
  ["Wiki", "Multi-agent system pageviews climbing"],
];

const STEPS = [
  { Icon: IconRadar, t: "Discover", b: "Six free feeds scanned for what's climbing in your niche.", tag: "Signals" },
  { Icon: IconFlame, t: "Find the narrative", b: "The agent groups loose signals into stories with a why-now.", tag: "Signals" },
  { Icon: IconShieldCheck, t: "Approve sources", b: "It reads and recommends. Only sources you approve count.", tag: "Forge" },
  { Icon: IconFileText, t: "Brief and drafts", b: "One brief, then X, LinkedIn, Instagram, newsletter and video drafts.", tag: "Forge" },
  { Icon: IconCalendarEvent, t: "Plan the week", b: "Drag approved drafts onto days. Export to any calendar.", tag: "Calendar" },
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const els = ref.current?.querySelectorAll("[data-reveal]") ?? [];
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

function Forge() {
  return (
    <div className="lp-forge lp-in" style={{ "--i": 6 } as React.CSSProperties} aria-hidden>
      <div className="lp-bar lp-m">
        <span className="lp-dot" /> <b>Live</b> scanning “AI agents”
      </div>
      <div className="lp-wave">
        {Array.from({ length: 28 }, (_, i) => (
          <span key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
      <div className="lp-wire">
        <ul>
          {[...WIRE, ...WIRE].map(([feed, t], i) => (
            <li key={i}>
              <i className="lp-m">{feed}</i>
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="lp-card">
        <div className="lp-bar lp-m">
          <b>Rising</b> · narrative
        </div>
        <h4 className="lp-d">Agent swarms hit the bureaucracy wall</h4>
        <div className="lp-mom">
          <span className="lp-molten" />
        </div>
        <div className="lp-srcs">
          <div className="lp-src">
            Tom's Hardware · swarm experiment <em className="lp-m ok" style={{ "--i": 0 } as React.CSSProperties}>APPROVED</em>
          </div>
          <div className="lp-src">
            Research write-up · Mindustry runs <em className="lp-m ok" style={{ "--i": 1 } as React.CSSProperties}>APPROVED</em>
          </div>
          <div className="lp-src">
            Off-topic election story <em className="lp-m no" style={{ "--i": 2 } as React.CSSProperties}>REJECTED</em>
          </div>
        </div>
      </div>
      <div className="lp-out lp-m">
        {["X", "LinkedIn", "Instagram", "Newsletter", "Video"].map((p, i) => (
          <span key={p} style={{ "--i": i } as React.CSSProperties}>
            {p}
          </span>
        ))}
      </div>
      <div className="lp-cal lp-m">
        <b className="lp-molten">THU 9:00</b> LinkedIn post on the calendar · .ics ready
      </div>
    </div>
  );
}

export default function Landing() {
  const ref = useReveal();
  const studio = appPath("/signals");
  return (
    <div className="lp" ref={ref}>
      <div className="lp-grid" aria-hidden />
      <header className="lp-nav">
        <a href="/" className="lp-brand lp-d">
          <SignalForgeMark /> SignalForge
        </a>
        <a className="lp-link" href={studio}>
          Open the studio
        </a>
      </header>
      <main>
        <section className="lp-hero">
          <div>
            <span className="lp-kicker lp-m lp-in" style={{ "--i": 0 } as React.CSSProperties}>
              <span className="lp-dot" /> AI content intelligence studio
            </span>
            <h1 className="lp-title lp-d" aria-label={HEAD.join(" ")}>
              {HEAD.map((w, i) => (
                <span key={i} aria-hidden>
                  <span className={`lp-w ${w === "rising." ? "lp-molten-t" : ""}`} style={{ "--i": i } as React.CSSProperties}>
                    {w}
                  </span>{" "}
                </span>
              ))}
            </h1>
            <p className="lp-sub lp-in" style={{ "--i": 8 } as React.CSSProperties}>
              SignalForge spots the narratives heating up in your niche, checks them against sources you approve, and forges a
              campaign for every platform onto your calendar.
            </p>
            <div className="lp-ctas lp-in" style={{ "--i": 10 } as React.CSSProperties}>
              <a className="lp-btn lp-btn--hot lp-molten" href={studio}>
                Start forging <IconArrowRight size={18} />
              </a>
              <a className="lp-btn lp-btn--quiet" href="#how">
                How it works
              </a>
            </div>
          </div>
          <Forge />
        </section>

        <section className="lp-sec" id="how">
          <h2 className="lp-h2 lp-d" data-reveal>
            From signal to schedule
            <br />
            <span className="lp-molten-t">in one sitting.</span>
          </h2>
          <div className="lp-steps">
            {STEPS.map(({ Icon, t, b, tag }, i) => (
              <article key={t} className="lp-step" data-reveal style={{ "--i": i } as React.CSSProperties}>
                <i>
                  <Icon size={20} />
                </i>
                <b className="lp-d">{t}</b>
                <p>{b}</p>
                <small className="lp-m">{String(i + 1).padStart(2, "0")} · {tag.toUpperCase()}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-sec">
          <h2 className="lp-h2 lp-d" data-reveal>
            The agent proposes. <span className="lp-molten-t">You decide.</span>
          </h2>
          <div className="lp-control">
            {[
              ["Sources need your yes", "The agent can recommend. Briefs can only cite sources you approved."],
              ["Drafts need your yes", "Edit anything inline. Only you can approve a draft for the calendar."],
              ["You press post", "SignalForge never posts for you. Copy, schedule and export to .ics."],
            ].map(([t, b], i) => (
              <div key={t} data-reveal style={{ "--i": i } as React.CSSProperties}>
                <b className="lp-d">{t}</b>
                <p>{b}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-final" data-reveal>
          <h2 className="lp-h2 lp-d">What's rising in your niche?</h2>
          <div className="lp-ctas" style={{ marginTop: 28 }}>
            <a className="lp-btn lp-btn--hot lp-molten" href={studio}>
              Find out now <IconArrowRight size={18} />
            </a>
          </div>
        </section>
      </main>
      <footer className="lp-foot">
        <span>Built on Agent-Native with Builder.io. SignalForge never posts on your behalf.</span>
        <a href="https://github.com/PinnacleCryptNG/signalforge" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </footer>
    </div>
  );
}
