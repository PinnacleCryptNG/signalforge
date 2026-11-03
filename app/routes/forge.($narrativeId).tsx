import { useParams } from "react-router";

import { ForgeScreen } from "@/components/forge/ForgeScreen";

export function meta() {
  return [
    { title: "Forge · SignalForge" },
    { name: "description", content: "Research a narrative, approve its sources and shape the brief." },
  ];
}

export default function ForgeRoute() {
  const { narrativeId } = useParams();
  return <ForgeScreen narrativeId={narrativeId} />;
}
