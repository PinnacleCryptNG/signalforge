import type { ReactNode, SVGProps } from "react";

// SignalForge's own icon set: a 24px grid, 1.75 rounded strokes, and an ember
// accent stroke (var(--icon-accent)) on the part of each glyph that "heats up".
export type IconProps = Omit<SVGProps<SVGSVGElement>, "stroke"> & { size?: number | string; strokeWidth?: number | string; stroke?: number | string };

function make(name: string, body: ReactNode) {
  const Icon = ({ size = 24, strokeWidth = 1.75, stroke, className, ...rest }: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke ?? strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={rest["aria-label"] ? undefined : true}
      className={["sf-icon", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {body}
    </svg>
  );
  Icon.displayName = name;
  return Icon;
}

const A = { stroke: "var(--icon-accent, currentColor)" } as const;
const AF = { fill: "var(--icon-accent, currentColor)", stroke: "none" } as const;

/** Signals: waves rising off a source point. */
export const IconRadar = make("IconRadar", <>
  <path d="M3 19h18" opacity=".45" />
  <path d="M5 15.5c1.6-3.6 3.2-3.6 4.4 0s2.8 3.6 4.4-2.2c1.4-5 3.2-8.3 5.2-8.3" />
  <circle cx="19" cy="5" r="1.6" {...AF} />
  <path d="M19 1.8v.6M21.6 3.4l-.5.4M16.4 3.4l.5.4" {...A} />
</>);
/** Forge: an anvil with a spark leaving it. */
export const IconFlame = make("IconFlame", <>
  <path d="M3.5 9.5h12c.2 2.2 1.8 3.4 5 3.5v1.2c-3 .1-4.6 1.3-4.8 3.3H8.3c-.2-2.1-2-3.2-4.8-3.3z" />
  <path d="M8 21h8M10 17.5V21M14 17.5V21" />
  <path d="M11 2.5v3M7.8 3.7l1.6 1.6M14.2 3.7l-1.6 1.6" {...A} />
</>);
export const IconCalendarEvent = make("IconCalendarEvent", <>
  <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
  <path d="M3.5 10h17M8 3v4M16 3v4" />
  <path d="m14.6 13.2.8 1.7 1.8.3-1.3 1.3.3 1.8-1.6-.9-1.6.9.3-1.8-1.3-1.3 1.8-.3z" {...A} />
</>);
export const IconCalendarDown = make("IconCalendarDown", <>
  <path d="M20.5 12V8a3 3 0 0 0-3-3h-11a3 3 0 0 0-3 3v9.5a3 3 0 0 0 3 3H12" />
  <path d="M3.5 10h17M8 3v4M16 3v4" />
  <path d="M17.5 14v7M15 18.6l2.5 2.4 2.5-2.4" {...A} />
</>);
/** Approve: a stamped tick. */
export const IconCheck = make("IconCheck", <path d="M4.5 12.8 9.4 17.5 19.5 6.5" />);
export const IconReject = make("IconReject", <path d="M6 6l12 12M18 6 6 18" />);
/** Agent: a forged spark. */
export const IconSparkles = make("IconSparkles", <>
  <path d="M10 3.5c.7 3.9 2.6 5.8 6.5 6.5-3.9.7-5.8 2.6-6.5 6.5-.7-3.9-2.6-5.8-6.5-6.5 3.9-.7 5.8-2.6 6.5-6.5z" />
  <path d="M18 14.5c.3 1.8 1.2 2.7 3 3-1.8.3-2.7 1.2-3 3-.3-1.8-1.2-2.7-3-3 1.8-.3 2.7-1.2 3-3z" {...A} />
</>);
export const IconAgent = IconSparkles;
export const IconLoader2 = make("IconLoader2", <>
  <path d="M12 3.5a8.5 8.5 0 1 1-8.5 8.5" opacity=".3" />
  <path d="M3.5 12A8.5 8.5 0 0 1 12 3.5" {...A} />
</>);
export const IconSearch = make("IconSearch", <>
  <circle cx="10.5" cy="10.5" r="6.5" />
  <path d="m15.5 15.5 5 5" />
  <path d="M7.3 11.3 9 9.2l1.8 2.6 1.8-2.4" {...A} />
</>);
/** Brief: a page with a spark corner. */
export const IconFileText = make("IconFileText", <>
  <path d="M14 3.5H7.5a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3V9z" />
  <path d="M14 3.5V9h5.5" />
  <path d="M8.5 13h7M8.5 16.5h4.5" {...A} />
</>);
export const IconCopy = make("IconCopy", <>
  <rect x="8.5" y="8.5" width="12" height="12" rx="3" />
  <path d="M15.5 5.5v-.2a1.8 1.8 0 0 0-1.8-1.8H5.3a1.8 1.8 0 0 0-1.8 1.8v8.4a1.8 1.8 0 0 0 1.8 1.8h.2" {...A} />
</>);
export const IconArrowUpRight = make("IconArrowUpRight", <><path d="M7 17 17 7" /><path d="M9 7h8v8" {...A} /></>);
export const IconArrowRight = make("IconArrowRight", <><path d="M4 12h15" /><path d="m13.5 6 6 6-6 6" {...A} /></>);
export const IconChevronRight = make("IconChevronRight", <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />);
export const IconChevronLeft = make("IconChevronLeft", <path d="M14.5 5.5 8 12l6.5 6.5" />);
/** Rewrite: a forging hammer. */
export const IconWand = make("IconWand", <>
  <path d="m13.5 9.5-9 9a1.6 1.6 0 0 0 2.3 2.3l9-9" />
  <path d="m11.8 6.4 4.6-4.2 5.4 5.4-4.2 4.6z" />
  <path d="M5 3.5v2M3 5.5h2M20 16.5v2.5M18.8 17.8h2.5" {...A} />
</>);
export const IconVideo = make("IconVideo", <>
  <rect x="3" y="5" width="18" height="14" rx="3.5" />
  <path d="M10 9.2v5.6l4.6-2.8z" {...A} />
</>);
export const IconUsers = make("IconUsers", <>
  <circle cx="9" cy="8.5" r="3.5" />
  <path d="M3 20c.6-3.4 3-5.3 6-5.3s5.4 1.9 6 5.3" />
  <path d="M15.5 5.3a3.3 3.3 0 0 1 0 6.4M18 14.9c1.6.7 2.6 2.4 3 5.1" {...A} />
</>);
export const IconTrash = make("IconTrash", <>
  <path d="M4 7h16M9.5 7V4.5h5V7" />
  <path d="M6 7l1 11.6a2.2 2.2 0 0 0 2.2 1.9h5.6a2.2 2.2 0 0 0 2.2-1.9L18 7" />
  <path d="M10.2 11v5.5M13.8 11v5.5" {...A} />
</>);
/** Human control: a shield with a tick. */
export const IconShieldCheck = make("IconShieldCheck", <>
  <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6z" />
  <path d="m8.8 12 2.3 2.3 4.3-4.6" {...A} />
</>);
export const IconPlus = make("IconPlus", <path d="M12 5v14M5 12h14" />);
export const IconPencil = make("IconPencil", <>
  <path d="m4 20 1-4.5L15.8 4.7a2.1 2.1 0 0 1 3 0l.5.5a2.1 2.1 0 0 1 0 3L8.5 19z" />
  <path d="m13.8 6.7 3.5 3.5" {...A} />
</>);
export const IconEdit = make("IconEdit", <>
  <path d="M20.5 11.5A8.5 8.5 0 0 1 8.3 19.2L3.5 20.5l1.3-4.4A8.5 8.5 0 1 1 20.5 11.5z" />
  <path d="M12 8.3v6.4M8.8 11.5h6.4" {...A} />
</>);
export const IconMenu2 = make("IconMenu2", <path d="M4 7h16M4 12h10M4 17h16" />);
export const IconMail = make("IconMail", <>
  <rect x="3" y="5" width="18" height="14" rx="3.5" />
  <path d="m4 7.5 8 6 8-6" {...A} />
</>);
export const IconLink = make("IconLink", <>
  <path d="M10 14a4.2 4.2 0 0 0 6 0l3-3a4.2 4.2 0 0 0-6-6l-.8.8" />
  <path d="M14 10a4.2 4.2 0 0 0-6 0l-3 3a4.2 4.2 0 0 0 6 6l.8-.8" {...A} />
</>);
export const IconLayoutSidebarRight = make("IconLayoutSidebarRight", <>
  <rect x="3" y="4" width="18" height="16" rx="3.5" />
  <path d="M15 4v16" />
  <path d="M17.6 8.5l.6 1.2 1.2.2" {...A} />
</>);
export const IconLayoutSidebarLeftCollapse = make("IconLayoutSidebarLeftCollapse", <>
  <rect x="3" y="4" width="18" height="16" rx="3.5" />
  <path d="M9 4v16" />
  <path d="m15.5 10-2 2 2 2" {...A} />
</>);
export const IconLayoutSidebarLeftExpand = make("IconLayoutSidebarLeftExpand", <>
  <rect x="3" y="4" width="18" height="16" rx="3.5" />
  <path d="M9 4v16" />
  <path d="m13.5 10 2 2-2 2" {...A} />
</>);
export const IconHandFinger = make("IconHandFinger", <>
  <path d="M9.5 13V5.8a1.7 1.7 0 0 1 3.4 0V11l3.9.7a2.3 2.3 0 0 1 1.9 2.6l-.6 3.9a3.5 3.5 0 0 1-3.5 2.8h-2.4a3.5 3.5 0 0 1-2.8-1.4L6 15.4a1.6 1.6 0 0 1 2.4-2.1z" />
  <path d="M6.5 3.8 7.6 5M15.7 3.8 14.6 5M11.2 1.5v1.2" {...A} />
</>);
export const IconClock = make("IconClock", <>
  <circle cx="12" cy="12" r="8.5" />
  <path d="M12 7.5V12l3 2" {...A} />
</>);
export const IconBook = make("IconBook", <>
  <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
  <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" />
  <path d="M9 8h6" {...A} />
</>);
export const IconAlertTriangle = make("IconAlertTriangle", <>
  <path d="M10.3 4.2 2.9 17.5A2 2 0 0 0 4.6 20.5h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" />
  <path d="M12 9.5v4" {...A} /><circle cx="12" cy="16.8" r=".9" {...AF} />
</>);
export const IconSend = make("IconSend", <>
  <path d="M4.5 12 20 4.5 15.5 20l-3.3-6.2z" />
  <path d="m12.2 13.8 3.3-3.3" {...A} />
</>);
// Platform glyphs: SignalForge's own line-drawn takes, not the official logos.
export const IconBrandX = make("IconBrandX", <><path d="M5 4.5l14 15" /><path d="M19 4.5l-5.8 6.3M10.8 13.2 5 19.5" {...A} /></>);
export const IconBrandLinkedin = make("IconBrandLinkedin", <>
  <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
  <path d="M8 10.5v6M8 7.6v.1" />
  <path d="M11.5 16.5v-6M11.5 13a2.5 2.5 0 0 1 5 0v3.5" {...A} />
</>);
export const IconBrandInstagram = make("IconBrandInstagram", <>
  <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
  <circle cx="12" cy="12" r="3.8" {...A} />
  <path d="M16.9 7.1v.1" />
</>);
export const IconBrandGithub = make("IconBrandGithub", <><path d="m8 8-4 4 4 4M16 8l4 4-4 4" /><path d="m13.5 5-3 14" {...A} /></>);
export const IconBrandDiscord = make("IconBrandDiscord", <>
  <path d="M7 6.5c3.4-1.4 6.6-1.4 10 0 1.8 2.8 2.6 5.9 2.5 9.3-1.6 1.3-3.2 2-4.7 2.2l-1-1.8H10.2l-1 1.8C7.7 17.8 6.1 17.1 4.5 15.8 4.4 12.4 5.2 9.3 7 6.5z" />
  <circle cx="9.5" cy="12" r="1" {...AF} /><circle cx="14.5" cy="12" r="1" {...AF} />
</>);
export const IconNewsletter = IconMail;
export const IconX = IconReject;
