import { useId } from "react";

/** The SignalForge mark: a cold signal line that heats as it rises and strikes a spark. */
export function SignalForgeMark({ size = 28, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      <defs>
        <linearGradient id={`sfh${id}`} x1="4" y1="26" x2="27" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7FA7C9" />
          <stop offset=".45" stopColor="#FF6A1F" />
          <stop offset="1" stopColor="#FFC05C" />
        </linearGradient>
        <radialGradient id={`sfg${id}`} cx="24" cy="8" r="9" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF6A1F" stopOpacity=".55" />
          <stop offset="1" stopColor="#FF6A1F" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="#0E0C10" />
      <rect x=".5" y=".5" width="31" height="31" rx="8.5" fill="none" stroke="#FFFFFF" strokeOpacity=".08" />
      <circle cx="24" cy="8" r="9" fill={`url(#sfg${id})`} />
      <path d="M5 22.5c2-4.5 3.6-4.5 5 0s3.3 4.4 5.2-1.6C17 15 19.6 10.6 23 9" fill="none" stroke={`url(#sfh${id})`} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 3.6c.4 2.3 1.6 3.5 3.9 3.9-2.3.4-3.5 1.6-3.9 3.9-.4-2.3-1.6-3.5-3.9-3.9 2.3-.4 3.5-1.6 3.9-3.9z" fill="#FFF1D6" />
    </svg>
  );
}

export function SignalForgeWordmark({ className }: { className?: string }) {
  return (
    <span className={["sf-wordmark", className].filter(Boolean).join(" ")}>
      Signal<span className="sf-wordmark-forge">Forge</span>
    </span>
  );
}
