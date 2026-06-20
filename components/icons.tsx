interface IconProps {
  className?: string;
  size?: number;
}

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function IconDashboard({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function IconBuilding({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M4 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16" />
      <path d="M12 21V9a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v12" />
      <path d="M9 21v-3" />
      <path d="M6 8h2M6 11h2M6 14h2M15 12h2M15 15h2" />
    </svg>
  );
}

export function IconUsers({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M21 20c0-2.5-1.8-4.6-4.2-5.4" />
    </svg>
  );
}

export function IconTarget({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function IconFileCheck({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9.5 14.5l2 2 4-4.5" />
    </svg>
  );
}

export function IconBell({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M6 9a6 6 0 1 1 12 0c0 3 1 5 2 6H4c1-1 2-3 2-6Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconHistory({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v4h4" />
      <path d="M12 8v5l3 2" />
    </svg>
  );
}

export function IconMegaphone({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M3 10v4a1 1 0 0 0 1 1h2l4 4V5L6 9H4a1 1 0 0 0-1 1Z" />
      <path d="M14 7a5 5 0 0 1 0 10" />
      <path d="M17 4a8 8 0 0 1 0 16" />
    </svg>
  );
}

export function IconUser({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.9 3.6-7 8-7s8 3.1 8 7" />
    </svg>
  );
}

export function IconShield({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6Z" />
      <path d="M9 12l2 2 4-4.5" />
    </svg>
  );
}

export function IconMenu({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function IconX({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconChevronDown({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function IconLogOut({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}