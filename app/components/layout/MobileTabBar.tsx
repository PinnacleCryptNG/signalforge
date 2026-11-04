import { focusAgentChat } from "@agent-native/toolkit/app/chat";
import { NavLink } from "react-router";

import { IconCalendarEvent, IconFlame, IconRadar, IconSparkles } from "@/components/icons";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/signals", label: "Signals", Icon: IconRadar },
  { to: "/forge", label: "Forge", Icon: IconFlame },
  { to: "/calendar", label: "Calendar", Icon: IconCalendarEvent },
] as const;

/** Phone navbar: the three screens plus the agent, always one thumb away. */
export function MobileTabBar({ className }: { className?: string }) {
  return (
    <nav aria-label="Primary" className={cn("sf-tabbar", className)}>
      {TABS.map(({ to, label, Icon }) => (
        <NavLink key={to} to={to} data-tour={`nav-${label.toLowerCase()}`} className={({ isActive }) => cn("sf-tabbar-item", isActive && "is-active")}>
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
      <button type="button" data-tour="agent" className="sf-tabbar-item sf-tabbar-agent" onClick={() => focusAgentChat()}>
        <span className="sf-tabbar-agent-orb"><IconSparkles size={20} /></span>
        <span>AI help</span>
      </button>
    </nav>
  );
}
