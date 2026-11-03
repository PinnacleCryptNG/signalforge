import { useId } from "react";

/** The SignalForge mark: a cold signal line that heats as it rises and strikes a spark. */
export function SignalForgeMark({ size = 28, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      <defs>
        <linearGradient id={`sfh${id}`} x1="5" y1="25" x2="27" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7FA7C9" />
          <stop offset=".42" stopColor="#FF6A1F" />
          <stop offset="1" stopColor="#FFC05C" />
        </linearGradient>
        <radialGradient id={`sfg${id}`} cx="24.5" cy="8" r="11" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF6A1F" stopOpacity=".7" />
          <stop offset=".55" stopColor="#FF6A1F" stopOpacity=".18" />
          <stop offset="1" stopColor="#FF6A1F" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="#110E12" />
      <rect x=".5" y=".5" width="31" height="31" rx="7.5" fill="none" stroke="#FFC05C" strokeOpacity=".14" />
      <circle cx="24.5" cy="8" r="11" fill={`url(#sfg${id})`} />
      <path d="M5.2 22.6c2.1-4.9 3.9-4.9 5.3 0s3.5 4.7 5.5-1.7C17.9 14.7 20.3 10.5 23.4 8.7" fill="none" stroke={`url(#sfh${id})`} strokeWidth="3.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24.6 2.4c.5 3 2.1 4.6 5.1 5.1-3 .5-4.6 2.1-5.1 5.1-.5-3-2.1-4.6-5.1-5.1 3-.5 4.6-2.1 5.1-5.1z" fill="#FFF1D6" />
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
