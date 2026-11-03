import { redirect } from "react-router";

const SEO_TITLE = "SignalForge — Turn what's rising into a campaign";
const SEO_DESCRIPTION =
  "SignalForge finds rising narratives in your niche, researches them with sources you approve, and drafts a campaign for every platform.";

export function meta() {
  return [
    { title: SEO_TITLE },
    { name: "description", content: SEO_DESCRIPTION },
    { property: "og:title", content: SEO_TITLE },
    { property: "og:description", content: SEO_DESCRIPTION },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: SEO_TITLE },
    { name: "twitter:description", content: SEO_DESCRIPTION },
  ];
}

export function clientLoader() {
  return redirect("/signals");
}

export default function HomeRoute() {
  return null;
}
