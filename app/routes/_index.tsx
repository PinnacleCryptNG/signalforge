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

const TITLE = "SignalForge · Create 5 pieces of content on social media in 10 minutes";
const DESC =
  "Content takes hours you don't have. Type your topic and SignalForge finds what people are talking about, checks the facts and writes 5 posts for X, LinkedIn, Instagram, email and video that sound like you, not AI slop.";
const OG_IMAGE = "https://signalforge-agent.vercel.app/og.jpg?v=4";

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
    { property: "og:image:alt", content: "SignalForge: create 5 pieces of content on social media in 10 minutes" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: OG_IMAGE },
    { name: "twitter:title", content: TITLE },
    { name: "twitter:description", content: DESC },
  ];
}

const PAINS = [
  { Icon: IconSearch, title: "Finding something to say", body: "An hour of scrolling to find a topic, then tab after tab checking the facts before you put your name on it." },
  { Icon: IconPencil, title: "Staring at a blank page", body: "Not everyone is a natural writer. Turning an idea into a post people actually stop for is hard work." },
  { Icon: IconFileText, title: "Writing it five times", body: "A thread for X, a post for LinkedIn, a caption, a newsletter, a video script. Each one with its own rules." },
  { Icon: IconClock, title: "Doing it all again tomorrow", body: "Growth needs you to show up every day, and a busy week is the first thing that breaks the streak." },
];

const FAST_HABITS = ["They show up every single day", "They're early on the story", "They have a specific angle", "They fit each platform's format"];

const POINTS = [
  { Icon: IconRadar, title: "Built on real stories", body: "Every post starts from a story people are talking about today and the articles you approved, so it has names, facts and details instead of filler." },
  { Icon: IconPencil, title: "Your angle, set first", body: "The main point, who it's for and the tone are set in a short plan before a single word is written." },
  { Icon: IconWand, title: "Native to each platform", body: "A real X thread, a LinkedIn post, an Instagram caption, a newsletter and a video script. Not one text copied five times." },
  { Icon: IconEdit, title: "You have the last word", body: "Edit any line, or tap More personal, Punchier or Shorter. The AI is told to skip buzzwords, emoji walls and hashtag stuffing." },
];

const STEPS = [
  { Icon: IconRadar, n: "30 sec", title: "1. Type your topic", body: "Fitness, crypto, football, anything. SignalForge shows the stories people are talking about right now." },
  { Icon: IconWand, n: "1 min", title: "2. Tap Autopilot", body: "The AI checks the facts and writes 5 posts: an X thread, a LinkedIn post, an Instagram caption, a newsletter and a video script." },
  { Icon: IconCalendarEvent, n: "5–8 min", title: "3. Read, tweak, post", body: "Change any line or tap “Shorter” or “More personal”. Approve, put them on your calendar, and post when you're ready." },
];

const WORDS = [
  { Icon: IconRadar, word: "Signals", means: "Find trends", body: "The stories people are talking about right now in your topic." },
  { Icon: IconWand, word: "Autopilot", means: "AI does it all", body: "One tap and the AI finds the facts and writes all 5 posts. You read and approve." },
  { Icon: IconPencil, word: "Forge", means: "Write posts", body: "Your workshop, where a story becomes finished posts you can edit." },
  { Icon: IconFileText, word: "Plan", means: "What every post follows", body: "The main point, who it's for, the tone and the key facts." },
  { Icon: IconCalendarEvent, word: "Calendar", means: "Plan when to post", body: "Where approved posts wait. Nothing is posted for you." },
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
        <a className="lp-btn lp-btn--ghost lp-btn--sm" href={studio}>Open the app</a>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <h1 className="lp-h1">
              Create <span className="lp-hot">5 pieces of content</span> on social media in <span className="lp-hot">10 minutes.</span>
            </h1>
            <p className="lp-sub">
              You know you should post every day. But finding a topic, checking the facts and writing it five different ways takes hours you don't have, and it's even harder if writing isn't your thing. SignalForge does that work for you, in your voice.
            </p>
            <div className="lp-ctas">
              <a className="lp-btn lp-btn--hot" href={studio}>Try it free <IconArrowRight size={18} /></a>
              <a className="lp-btn lp-btn--ghost" href="#how">See how it works</a>
            </div>
            <ul className="lp-proof">
              <li><b>5</b> posts</li>
              <li><b>10</b> minutes</li>
              <li><b>0</b> AI slop</li>
            </ul>
          </div>
          <div className="lp-hero-visual">
            <SignalField className="lp-field" />
            <div className="lp-legend" aria-hidden>
              <span><i className="lp-sw lp-sw--cold" />what people are saying</span>
              <span><i className="lp-sw lp-sw--hot" />your ready posts</span>
            </div>
          </div>
        </section>

        <section id="why" className="lp-section">
          <div className="lp-head" data-reveal>
            <p className="lp-kicker">Sound familiar?</p>
            <h2 className="lp-h2">Posting every day is a second job.</h2>
            <p className="lp-lead">Most people don't stop posting because they have nothing to say. They stop because every post costs an hour or two they don't have, again and again.</p>
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
              <h2 className="lp-h2">Growing on X is harder than ever.</h2>
              <p className="lp-lead">X keeps changing what it shows people, and nobody sends you the memo. What got you reach last month stops working this month. Topics turn over in hours, a take that's a day late barely gets seen, and posting a few times a week rarely moves the needle.</p>
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
            <p className="lp-kicker">This is not AI slop</p>
            <h2 className="lp-h2">Not AI slop. Posts that sound like a person wrote them.</h2>
            <p className="lp-lead">AI slop is the bland, buzzword-stuffed stuff everyone scrolls straight past. SignalForge is built to avoid it: every post starts from a real story and real facts, follows your angle, and skips the words that give AI away.</p>
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
            <h2 className="lp-h2">5 posts in 10 minutes. Here's how.</h2>
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

        <section id="words" className="lp-section">
          <div className="lp-head" data-reveal>
            <p className="lp-kicker">No jargon</p>
            <h2 className="lp-h2">Five words you'll see, in plain English.</h2>
          </div>
          <div className="lp-points lp-words">
            {WORDS.map(({ Icon, word, means, body }, i) => (
              <div key={word} className="lp-panel lp-point" data-reveal style={{ transitionDelay: `${i * 60}ms` }}>
                <span className="lp-panel-icon"><Icon size={22} /></span>
                <h3>{word} <span className="lp-word-means">= {means}</span></h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="control" className="lp-section lp-control">
          <div className="lp-head" data-reveal>
            <p className="lp-kicker">You stay in charge</p>
            <h2 className="lp-h2">The AI suggests. You decide.</h2>
          </div>
          <div className="lp-control-grid">
            <div className="lp-panel" data-reveal>
              <span className="lp-panel-icon"><IconShieldCheck size={24} /></span>
              <h3>Facts need your yes</h3>
              <p>The AI suggests which articles to trust. Nothing is used until you approve it, or turn on Autopilot to let it choose.</p>
              <ul className="lp-sources">
                <li className="is-ok"><IconCheck size={14} /> reuters.com · Banks restrict agent access</li>
                <li className="is-ok"><IconCheck size={14} /> news.ycombinator.com · First-hand write-up</li>
                <li className="is-no"><IconX size={14} /> random-blog.net · Off topic</li>
              </ul>
            </div>
            <div className="lp-panel" data-reveal>
              <span className="lp-panel-icon"><IconFileText size={24} /></span>
              <h3>Posts only use approved facts</h3>
              <p>SignalForge won't write a plan from an article that hasn't been approved.</p>
            </div>
            <div className="lp-panel" data-reveal>
              <span className="lp-panel-icon"><IconCalendarEvent size={24} /></span>
              <h3>Nothing posts by itself</h3>
              <p>You put approved posts on the calendar, copy them, and post them yourself.</p>
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
          <p className="lp-sub">Free to start, nothing to set up. Type your topic and see what's trending in about two seconds.</p>
          <a className="lp-btn lp-btn--hot" href={studio}>Try it free <IconArrowRight size={18} /></a>
        </section>
      </main>

      <footer className="lp-foot">
        <span className="lp-foot-brand"><SignalForgeMark size={20} /> SignalForge · MIT licensed</span>
        <a href="https://github.com/PinnacleCryptNG/signalforge" target="_blank" rel="noreferrer"><IconBrandGithub size={16} /> Source on GitHub</a>
      </footer>
    </div>
  );
}
