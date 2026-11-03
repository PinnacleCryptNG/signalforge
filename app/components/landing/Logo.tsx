export function SignalForgeMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="sfm" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#ff3d1a" />
          <stop offset=".55" stopColor="#ff7a1a" />
          <stop offset="1" stopColor="#ffb347" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="#1a1210" />
      <rect x="6" y="18" width="3.4" height="8" rx="1.7" fill="url(#sfm)" opacity=".55" />
      <rect x="11.2" y="13" width="3.4" height="13" rx="1.7" fill="url(#sfm)" opacity=".75" />
      <rect x="16.4" y="8" width="3.4" height="18" rx="1.7" fill="url(#sfm)" />
      <path d="M22.4 26V11.5l4-4.5v19" fill="url(#sfm)" />
    </svg>
  );
}
