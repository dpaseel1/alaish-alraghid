import type { SVGProps } from "react";

/**
 * أيقونات خطية (outline) بدون تلوين - بديل الإيموجي لشكل أكثر رسمية.
 * كل الأيقونات تستخدم currentColor فتتوارث اللون من العنصر الأب تلقائيًا.
 */
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function ToolIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2Z" />
    </svg>
  );
}

export function TeacherIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="7.5" r="3.3" />
      <path d="M4.5 20c0-3.8 3.4-6.5 7.5-6.5s7.5 2.7 7.5 6.5" />
    </svg>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.8 9.2 13 13l-3.8 1.8L11 11l3.8-1.8Z" />
    </svg>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5.2C4 4.5 4.6 4 5.3 4H11v16H5.3c-.7 0-1.3-.5-1.3-1.2Z" />
      <path d="M20 5.2c0-.7-.6-1.2-1.3-1.2H13v16h5.7c.7 0 1.3-.5 1.3-1.2Z" />
    </svg>
  );
}

export function MosqueIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3c1.5 1.4 2 2.6 2 3.8A2 2 0 0 1 12 8.8a2 2 0 0 1-2-2C10 5.6 10.5 4.4 12 3Z" />
      <path d="M4 21v-6.5c0-2.2 1.6-4 3.6-4.4M20 21v-6.5c0-2.2-1.6-4-3.6-4.4" />
      <path d="M8.2 21v-4a1 1 0 0 1 1-1h5.6a1 1 0 0 1 1 1v4" />
      <path d="M3 21h18" />
    </svg>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}

export function AwardIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8.5" r="5" />
      <path d="M8.5 12.8 7 21l5-2.6 5 2.6-1.5-8.2" />
    </svg>
  );
}

export function ArchiveIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="4" width="17" height="4.5" rx="1" />
      <path d="M4.5 8.5V19a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V8.5" />
      <path d="M10 12.5h4" />
    </svg>
  );
}

export function LogIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3.5h9l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V5A1.5 1.5 0 0 1 6 3.5Z" />
      <path d="M9 12h6M9 15.5h6M9 8.5h3" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4M17.8 17.8l-1.4-1.4M7.6 7.6 6.2 6.2" />
    </svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15" />
      <path d="M10 8l-4 4 4 4M6 12h11" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
    </svg>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4.5A1.5 1.5 0 0 0 3 6.5C3 8.4 4.5 10 6.3 10" />
      <path d="M17 5h2.5A1.5 1.5 0 0 1 21 6.5c0 1.9-1.5 3.5-3.3 3.5" />
      <path d="M9.5 13.5h5L15 18h-6l.5-4.5Z" />
      <path d="M8.5 21h7" />
    </svg>
  );
}

export function FlaskIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10 3h4M10.5 3v5.5L5.8 17a2 2 0 0 0 1.8 3h8.8a2 2 0 0 0 1.8-3l-4.7-8.5V3" />
      <path d="M7.5 15h9" />
    </svg>
  );
}

export function PenIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function DotIcon(props: IconProps) {
  return (
    <svg {...base} fill="currentColor" {...props}>
      <circle cx="12" cy="12" r="5" />
    </svg>
  );
}
