import { sendToAgentChatAndConfirm } from "@agent-native/core/client/agent-chat";
import { toast } from "sonner";

// The first submit can be dropped while the closed sidebar is still mounting, so confirm delivery and resend.
export async function askAgent(message: string, opts: { newTab?: boolean } = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await sendToAgentChatAndConfirm(
      { message, submit: true, openSidebar: true, chatTarget: "local", newTab: opts.newTab ?? false, reuseEmptyTab: true },
      { timeoutMs: 4000 }
    );
    if (res.delivered) return true;
  }
  toast.error("The agent didn't get that. Tap the button again.");
  return false;
}
