import { CalendarScreen } from "@/components/calendar/CalendarScreen";

export function meta() {
  return [
    { title: "Calendar · SignalForge" },
    { name: "description", content: "Plan when each approved draft goes out, then export to your calendar." },
  ];
}

export default function CalendarRoute() {
  return <CalendarScreen />;
}
