import { createToolkitAuthPlugin, renderAuthPage } from "@agent-native/toolkit/app/auth/server";

const SIGNALFORGE_AUTH_STYLE = `<style data-signalforge-auth>
@font-face{font-family:"Fraunces SF";src:url("/fonts/fraunces.woff2") format("woff2");font-weight:100 900;font-display:swap}@font-face{font-family:"DM Sans SF";src:url("/fonts/dm-sans.woff2") format("woff2");font-weight:100 1000;font-display:swap}
:root{--auth-marketing-left-bg:#0b0a0d;--auth-marketing-right-bg:#100e13;--auth-marketing-foreground:#f3ece2;--auth-marketing-muted:#a39d98;--auth-marketing-subtle:#6f6a66;--auth-marketing-border:rgba(255,241,214,.09);--auth-marketing-badge-bg:rgba(255,106,31,.14);--auth-wave-fg:#ff6a1f;--auth-wave-bg:#0b0a0d}
html{background:#0b0a0d}body{min-height:100dvh;background:radial-gradient(900px 520px at 85% -10%,rgba(255,106,31,.16),transparent 60%),radial-gradient(700px 500px at -10% 110%,rgba(127,167,201,.10),transparent 60%),#0b0a0d!important;color:#f3ece2;font-family:"DM Sans SF",system-ui,sans-serif!important}
.card{background:linear-gradient(180deg,rgba(255,255,255,.03),transparent),#141218!important;border:1px solid rgba(255,241,214,.1)!important;border-radius:24px!important;padding:28px!important;box-shadow:0 40px 100px -50px rgba(255,106,31,.5)!important}
body .card h1,body .card h2,.app-name-label,.auth-marketing-headline{font-family:"Fraunces SF",Georgia,serif!important;font-weight:600!important;font-variation-settings:"SOFT" 50;letter-spacing:-.015em}
button[type="submit"],.btn-primary{background:linear-gradient(100deg,#ffc05c,#ff6a1f 60%,#ff3f2a)!important;color:#1a0b03!important;border:0!important;border-radius:999px!important;font-weight:700!important}
button[type="submit"]:hover,.btn-primary:hover{filter:brightness(1.06)}
input{background:#0e0c11!important;border-color:rgba(255,241,214,.14)!important;border-radius:12px!important}
input:focus{border-color:rgba(255,106,31,.7)!important;box-shadow:0 0 0 3px rgba(255,106,31,.18)!important}
.tab.active{color:#ffc05c!important;background:rgba(255,106,31,.14)!important;box-shadow:inset 0 0 0 1px rgba(255,106,31,.45)!important}
.link-button,a{color:#ffc05c}
.brand-mark{border-radius:10px;filter:none!important}
.app-status-badge{color:#ffc05c!important}
body{background-attachment:fixed!important}
</style>`;

export default createToolkitAuthPlugin({
  workspaceAppPublicPaths: ["/"],
  rootAuth: false,
  marketing: {
    appName: "SignalForge",
    tagline: "Create 5 pieces of content on social media in 10 minutes.",
    description:
      "Type your topic, see what people are talking about, and get ready-to-post content for X, LinkedIn, Instagram, email and video. You approve everything before it goes out.",
    features: [
      "Six free live trend feeds, scanned in seconds",
      "You approve every source; briefs cite only those",
      "Nothing posts by itself: schedule, copy, export .ics",
    ],
  },
  renderSignInPage: (props) => SIGNALFORGE_AUTH_STYLE + renderAuthPage(props),
});
