import { SignalsScreen } from "@/components/signals/SignalsScreen";

export function meta() {
  return [
    { title: "Signals · SignalForge" },
    { name: "description", content: "See what's rising in your niche and the narratives behind it." },
  ];
}

export default function SignalsRoute() {
  return <SignalsScreen />;
}
