import { appPath } from "@agent-native/core/client/api-path";
import { useEffect, useRef } from "react";

import {
  IconArrowRight,
  IconBrandGithub,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandX,
  IconCalendarEvent,
  IconCheck,
  IconClock,
  IconEdit,
  IconFileText,
  IconMail,
  IconPencil,
  IconRadar,
  IconSearch,
  IconShieldCheck,
  IconVideo,
  IconWand,
  IconX,
} from "@/components/icons";
import { SignalForgeMark, SignalForgeWordmark } from "@/components/landing/Logo";
import { SignalField } from "@/components/landing/SignalField";
import "@/components/landing/landing.css";

const TITLE = "SignalForge · Turn what's trending into a week of posts";
const DESC =
  "Content takes hours you don't have. SignalForge finds what's rising in your niche, checks the facts with sources you approve, and drafts human-sounding posts for X, LinkedIn, Instagram, email and video, planned on your calendar.";
const OG_IMAGE = "https://signalforge-agent.vercel.app/og.jpg?v=2";

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
    { property: "og:image:alt", content: "SignalForge: turn what's trending into a week of posts" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: OG_IMAGE },
    { name: "twitter:title", content: TITLE },
    { name: "twitter:description", content: DESC },
  ];
}

const PAINS = [
  { Icon: IconSearch, title: "Finding something to say", body: "An hour of scrolling to find a topic, only to see ten people already posted it." },
  { Icon: IconShieldCheck, title: "Making sure it's true", body: "Tab after tab to check a claim before you put your name on it." },
  { Icon: IconFileText, title: "Writing it five times", body: "A thread for X, a post for LinkedIn, a caption, a newsletter, a script. Each with its own rules." },
  { Icon: IconClock, title: "Doing it all again tomorrow", body: "Consistency is what grows an account, and a busy week is the first thing that breaks the streak." },
];

const FAST_HABITS = ["They show up every single day", "They're early on the story", "They have a specific angle", "They fit each platform's format"];

const POINTS = [
  { Icon: IconRadar, title: "Built on real stories", body: "Every draft starts from a live story and the sources you approved, so it carries names, facts and specifics instead of filler." },
  { Icon: IconPencil, title: "Your angle, set first", body: "You lock the hook, audience and tone in a brief before a single word is drafted." },
  { Icon: IconWand, title: "Native to each platform", body: "A real X thread, a LinkedIn post with room to breathe, a caption, a newsletter, a video script. Not one text resized five times." },
  { Icon: IconEdit, title: "You have the last word", body: "Edit any line, or tap More personal, Punchier or Shorter. The agent is told to skip buzzwords, emoji walls and hashtag stuffing." },
];

const STEPS = [
  { Icon: IconRadar, n: "01", title: "Spot what's rising", body: "Type a niche. SignalForge scans six free live feeds and groups the noise into stories, each with a momentum score." },
  { Icon: IconSearch, n: "02", title: "Check the facts", body: "The research agent gathers sources and recommends which to trust. You approve or reject every one." },
  { Icon: IconFileText, n: "03", title: "Lock the angle", body: "A brief with the hook, audience and key points, citing only the sources you approved." },
  { Icon: IconWand, n: "04", title: "Draft every platform", body: "X thread, LinkedIn, Instagram, newsletter and a video script, each within its limits. Edit or rewrite in one tap." },
  { Icon: IconCalendarEvent, n: "05", title: "Plan the week", body: "Drop approved posts on the calendar, then copy or export to Google or Apple Calendar." },
];

const OUTPUTS = [
  { Icon: IconBrandX, label: "X thread", meta: "3 posts · 245 / 280", text: "Banks are blocking AI agents from customer accounts. Here's what changed this week, and why it matters for anyone shipping agents →" },
  { Icon: IconBrandLinkedin, label: "LinkedIn", meta: "1,840 / 3,000", text: "Three Canadian banks just drew a line on personal AI agents. The question for builders isn't whether agents work. It's whether they can prove permission." },
  { Icon: IconBrandInstagram, label: "Instagram", meta: "caption + 8 tags", text: "Your AI agent wants your bank login. Your bank says no. Swipe for the 3 rules banks are writing right now." },
  { Icon: IconMail, label: "Newsletter", meta: "subject + body", text: "Subject: The week banks said no to AI agents" },
  { Icon: IconVideo, label: "Video script", meta: "hook · body · CTA", text: "HOOK (0–3s): “Your bank just blocked your AI assistant.” ON SCREEN: BANKS vs AGENTS" },
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const els = ref.current?.querySelectorAll<HTMLElement>("[data-reveal]") ?? [];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("is-in"), io.unobserve(e.target))),
      { threshold: 0.18 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

export default function Landing() {
  const ref = useReveal();
  const studio = appPath("/signals");
  return (
    <div className="lp" ref={ref}>
      <div className="lp-noise" aria-hidden />
      <header className="lp-nav">
        <a href="/" className="lp-brand" aria-label="SignalForge home">
          <SignalForgeMark size={32} />
          <SignalForgeWordmark className="lp-brand-word" />
        </a>
        <nav className="lp-nav-links" aria-label="Sections">
          <a href="#why">Why SignalForge</a>
          <a href="#how">How it works</a>
          <a href="#output">Output</a>
        </nav>
        <a className="lp-btn lp-btn--ghost lp-btn--sm" href={studio}>Open studio</a>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <h1 className="lp-h1">
              Turn what's <span className="lp-hot">trending</span> into a week of <span className="lp-hot">posts.</span>
            </h1>
            <p className="lp-sub">
              Posting every day takes hours you don't have. SignalForge finds what's rising in your niche, checks the facts and drafts posts for every platform that sound human, not generated. Ready on your calendar.
            </p>
            <div className="lp-ctas">
              <a className="lp-btn lp-btn--hot" href={studio}>Start forging, free <IconArrowRight size={18} /></a>
              <a className="lp-btn lp-btn--ghost" href="#how">See how it works</a>
            </div>
            <ul className="lp-proof">
              <li><b>6</b> live feeds</li>
              <li><b>5</b> platforms</li>
              <li><b>0</b> auto-posts</li>
            </ul>
          </div>
          <div className="lp-hero-visual">
            <SignalField className="lp-field" />
            <div className="lp-legend" aria-hidden>
              <span><i className="lp-sw lp-sw--cold" />raw signals</span>
              <span><i className="lp-sw lp-sw--hot" />forged drafts</span>
            </div>
          </div>
        </section>

        <section id="why" className="lp-section">
          <div className="lp-head" data-reveal>
            <p className="lp-kicker">The real cost of content</p>
            <h2 className="lp-h2">Posting every day is a second job.</h2>
            <p className="lp-lead">You know consistency is what grows an account. You also know what it costs you, every single day.</p>
          </div>
          <ul className="lp-pains">
            {PAINS.map(({ Icon, title, body }, i) => (
              <li key={title} className="lp-step lp-pain" data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
                <span className="lp-step-icon"><Icon size={24} /></span>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="lp-section">
          <div className="lp-split">
            <div data-reveal>
              <p className="lp-kicker">Growing on X</p>
              <h2 className="lp-h2">The algorithm keeps moving. Most accounts can't keep up.</h2>
              <p className="lp-lead">What X rewards keeps changing, and nobody sends you the memo. Topics turn over in hours, a take that's a day late barely gets seen, and posting a few times a week rarely moves the needle.</p>
              <p className="lp-lead">Yet some accounts grow so fast it looks supernatural: a sharp thread every morning, a smart take on every story within the hour, every day.</p>
            </div>
            <div className="lp-panel lp-habits" data-reveal>
              <p className="lp-habits-title">What the fast-growing accounts do</p>
              <ul>
                {FAST_HABITS.map((h) => (
                  <li key={h}><IconCheck size={16} /> {h}</li>
                ))}
              </ul>
              <p className="lp-habits-q">So how do they find the time?</p>
            </div>
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-secret" data-reveal>
            <p className="lp-kicker">The open secret</p>
            <h2 className="lp-h2">They're not superhuman. <span className="lp-hot">They use AI.</span></h2>
            <p className="lp-lead">Behind a lot of those accounts is a system: AI that watches the news, does the research and writes the first draft, so the creator only adds their take. The catch? Most AI tools write posts everyone can spot from a mile away.</p>
          </div>
        </section>

        <section id="human" className="lp-section">
          <div className="lp-head" data-reveal>
            <p className="lp-kicker">AI-assisted, not AI-sounding</p>
            <h2 className="lp-h2">Posts that don't read like a robot wrote them.</h2>
          </div>
          <div className="lp-compare">
            <article className="lp-post lp-post--bad" data-reveal>
              <header><IconX size={16} /> Typical AI post</header>
              <p>In today's fast-paced digital landscape, AI agents are revolutionizing banking. Here's why this game-changer matters. #AI #Fintech #Innovation #Future</p>
              <ul><li>vague</li><li>no source</li><li>buzzwords</li></ul>
            </article>
            <article className="lp-post lp-post--good" data-reveal style={{ transitionDelay: "80ms" }}>
              <header><IconCheck size={16} /> SignalForge draft</header>
              <p>Three Canadian banks just told customers to stop letting AI agents log in for them. Wells Fargo wants proof the agents are revoked. If you build agents, permission is now the product.</p>
              <ul><li>real story</li><li>approved sources</li><li>your angle</li></ul>
            </article>
          </div>
          <div className="lp-points">
            {POINTS.map(({ Icon, title, body }, i) => (
              <div key={title} className="lp-panel lp-point" data-reveal style={{ transitionDelay: `${i * 60}ms` }}>
                <span className="lp-panel-icon"><Icon size={22} /></span>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="lp-section">
          <div className="lp-head" data-reveal>
            <p className="lp-kicker">How it works</p>
            <h2 className="lp-h2">A week of content in one sitting.</h2>
          </div>
          <ol className="lp-steps">
            {STEPS.map(({ Icon, n, title, body }, i) => (
              <li key={n} className="lp-step" data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
                <span className="lp-step-icon"><Icon size={26} /></span>
                <span className="lp-step-n">{n}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="control" className="lp-section lp-control">
          <div className="lp-head" data-reveal>
            <p className="lp-kicker">Human control</p>
            <h2 className="lp-h2">The agent proposes. You decide.</h2>
          </div>
          <div className="lp-control-grid">
            <div className="lp-panel" data-reveal>
              <span className="lp-panel-icon"><IconShieldCheck size={24} /></span>
              <h3>Sources need your yes</h3>
              <p>The agent recommends. Nothing counts as evidence until you approve it.</p>
              <ul className="lp-sources">
                <li className="is-ok"><IconCheck size={14} /> reuters.com · Banks restrict agent access</li>
                <li className="is-ok"><IconCheck size={14} /> news.ycombinator.com · First-hand write-up</li>
                <li className="is-no"><IconX size={14} /> random-blog.net · Off topic</li>
              </ul>
            </div>
            <div className="lp-panel" data-reveal>
              <span className="lp-panel-icon"><IconFileText size={24} /></span>
              <h3>Briefs cite only what you approved</h3>
              <p>The server refuses a brief that points at a source you haven't approved.</p>
            </div>
            <div className="lp-panel" data-reveal>
              <span className="lp-panel-icon"><IconCalendarEvent size={24} /></span>
              <h3>Nothing posts by itself</h3>
              <p>You place approved posts on the calendar, copy them out, and post them yourself.</p>
            </div>
          </div>
        </section>

        <section id="output" className="lp-section">
          <div className="lp-head" data-reveal>
            <p className="lp-kicker">One story, five formats</p>
            <h2 className="lp-h2">Every platform, in its own voice.</h2>
          </div>
          <div className="lp-outputs">
            {OUTPUTS.map(({ Icon, label, meta, text }, i) => (
              <article key={label} className="lp-out" data-reveal style={{ transitionDelay: `${i * 60}ms` }}>
                <header><Icon size={18} /> <b>{label}</b> <span>{meta}</span></header>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-final" data-reveal>
          <SignalForgeMark size={56} />
          <h2 className="lp-h2">Get your evenings back. Keep your voice.</h2>
          <p className="lp-sub">Free live feeds, no setup. Type your niche and your first scan takes about two seconds.</p>
          <a className="lp-btn lp-btn--hot" href={studio}>Start forging <IconArrowRight size={18} /></a>
        </section>
      </main>

      <footer className="lp-foot">
        <span className="lp-foot-brand"><SignalForgeMark size={20} /> SignalForge · MIT licensed</span>
        <a href="https://github.com/PinnacleCryptNG/signalforge" target="_blank" rel="noreferrer"><IconBrandGithub size={16} /> Source on GitHub</a>
      </footer>
    </div>
  );
}
