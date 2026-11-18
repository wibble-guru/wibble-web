import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Stroke({ size = 20, children, strokeWidth = 2.2, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}>
      {children}
    </svg>
  );
}

export const SearchIcon = (p: IconProps) => (
  <Stroke {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></Stroke>
);
export const ChevronRightIcon = (p: IconProps) => (
  <Stroke strokeWidth={2.4} {...p}><path d="m9 6 6 6-6 6" /></Stroke>
);
export const ChevronLeftIcon = (p: IconProps) => (
  <Stroke {...p}><path d="m15 5-7 7 7 7" /></Stroke>
);
export const ShareIcon = (p: IconProps) => (
  <Stroke {...p}><path d="M12 15V4" /><path d="m7.5 8.5 4.5-4.5 4.5 4.5" /><path d="M5 13v4.5A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5V13" /></Stroke>
);
export const HomeIcon = (p: IconProps) => (
  <Stroke {...p}><path d="M4 11.2 12 4.5l8 6.7V18a2 2 0 0 1-2 2h-3.5v-5h-5v5H6a2 2 0 0 1-2-2z" /></Stroke>
);
export const GridIcon = (p: IconProps) => (
  <Stroke strokeWidth={2} {...p}><rect x="4" y="4" width="7" height="7" rx="2.5" /><rect x="13" y="4" width="7" height="7" rx="2.5" /><rect x="4" y="13" width="7" height="7" rx="2.5" /><rect x="13" y="13" width="7" height="7" rx="2.5" /></Stroke>
);
export const FlameIcon = (p: IconProps) => (
  <Stroke strokeWidth={2} {...p}><path d="M12 21c3.6 0 6.5-2.6 6.5-6.3 0-3.4-2.3-5.3-3.6-7.7-.4 1.7-1.3 2.9-2.6 3.5.3-2.8-.8-5.8-3.3-7.5.1 3.3-1.7 5.2-3 7.1A7.3 7.3 0 0 0 5.5 14.7C5.5 18.4 8.4 21 12 21Z" /></Stroke>
);
export const RestartIcon = (p: IconProps) => (
  <Stroke {...p}><path d="M3 12a9 9 0 1 0 2.64-6.36L3 8.3" /><path d="M3 3.5V8.3h4.8" /></Stroke>
);
export const MaximizeIcon = (p: IconProps) => (
  <Stroke {...p}><path d="M8 3.5H5.5a2 2 0 0 0-2 2V8" /><path d="M16 3.5h2.5a2 2 0 0 1 2 2V8" /><path d="M3.5 16v2.5a2 2 0 0 0 2 2H8" /><path d="M20.5 16v2.5a2 2 0 0 1-2 2H16" /></Stroke>
);
export const MinimizeIcon = (p: IconProps) => (
  <Stroke {...p}><path d="M8 3.5V6a2 2 0 0 1-2 2H3.5" /><path d="M16 3.5V6a2 2 0 0 0 2 2h2.5" /><path d="M3.5 16H6a2 2 0 0 1 2 2v2.5" /><path d="M20.5 16H18a2 2 0 0 0-2 2v2.5" /></Stroke>
);
export const LinkIcon = (p: IconProps) => (
  <Stroke {...p}><path d="M10 14a4.5 4.5 0 0 0 6.4 0l2.6-2.6a4.5 4.5 0 0 0-6.4-6.4L11.5 6" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0L5 12.6A4.5 4.5 0 0 0 11.4 19l1.1-1.1" /></Stroke>
);
export const InstagramIcon = (p: IconProps) => (
  <Stroke strokeWidth={2} {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" /></Stroke>
);
export const KakaoIcon = ({ size = 28, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...rest}>
    <path d="M12 4C7 4 3 7.1 3 11c0 2.5 1.7 4.7 4.2 6l-.9 3.3c-.1.3.3.6.6.4l3.9-2.6c.4 0 .8.1 1.2.1 5 0 9-3.1 9-7.1S17 4 12 4Z" fill="#3a1d1d" />
  </svg>
);
export const PlayIcon = ({ size = 11, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...rest}>
    <path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5Z" fill="currentColor" />
  </svg>
);
