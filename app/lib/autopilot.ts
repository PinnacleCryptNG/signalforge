import { useActionMutation } from "@agent-native/core/client/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { askAgent } from "@/lib/ask-agent";

export const autopilotPrompt = (n: { id: string; title: string }) =>
  `Autopilot "${n.title}" (${n.id}). I turned Autopilot on, so your source picks are applied. Do the whole job without asking me: 1) get-forge; if it has fewer than 5 sources, run research-narrative once. 2) Judge every pending source from its excerpt and call review-source twice: once with all the ids to approve (the 3-6 most credible, on-topic ones), once with all the rest to reject, each with a short note. 3) save-brief citing only the approved ids. 4) save-drafts for all five platforms: x, linkedin, instagram, newsletter, video. Then reply in one line with what is ready for me to approve.`;

/** Turns Autopilot on (a user-only action), opens the Forge and hands the whole job to the agent. */
export function useAutopilot() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const set = useActionMutation("set-autopilot", {
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't start Autopilot"),
  });
  const start = (n: { id: string; title: string }) => {
    navigate(`/forge/${n.id}`);
    toast("Autopilot is on. The agent is picking sources and writing your drafts.");
    // Signals unmounts as soon as we navigate, and per-call mutate callbacks are dropped on unmount, so await the promise.
    void set
      .mutateAsync({ id: n.id, on: true } as never)
      .then((res: unknown) => {
        const id = (res as { id?: string } | undefined)?.id ?? n.id;
        if (id !== n.id) navigate(`/forge/${id}`, { replace: true });
        void queryClient.invalidateQueries();
        void askAgent(autopilotPrompt({ id, title: n.title }), { newTab: true });
      })
      .catch(() => {});
  };
  const stop = (id: string) =>
    set.mutate({ id, on: false } as never, { onSuccess: () => void queryClient.invalidateQueries() });
  return { start, stop, pending: set.isPending };
}
