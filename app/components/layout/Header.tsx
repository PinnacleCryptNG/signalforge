import {
  useHeaderTitle,
  useHeaderActions,
} from "@agent-native/toolkit/app-shell";
import { AgentToggleButton } from "@agent-native/toolkit/app/chat";

import { IconHelp } from "@/components/icons";
import { startTour, Tour } from "@/components/guide/Tour";

import { MobileAppBar } from "./MobileAppBar";

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const title = useHeaderTitle();
  const actions = useHeaderActions();

  return (
    <MobileAppBar
      className="md:ps-4"
      onOpenNavigation={onOpenMobileSidebar}
      title={title}
      actions={
        <>
          {actions}
          <button
            type="button"
            onClick={startTour}
            aria-label="Take the tour"
            title="Take the tour"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <IconHelp className="size-[18px]" />
          </button>
          <span data-tour="agent" className="hidden md:inline-flex">
            <AgentToggleButton />
          </span>
          <Tour />
        </>
      }
    />
  );
}
