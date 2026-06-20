"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { NAV_ITEMS, ROLE_LABELS } from "@/lib/constants";
import {
  IconDashboard, IconBuilding, IconUsers, IconTarget, IconFileCheck,
  IconBell, IconMegaphone, IconHistory, IconShield,
} from "@/components/icons";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  "/dashboard": IconDashboard,
  "/departments": IconBuilding,
  "/employees": IconUsers,
  "/kpis": IconTarget,
  "/submissions": IconFileCheck,
  "/alerts": IconBell,
  "/broadcast": IconMegaphone,
  "/audit": IconHistory,
  "/admin": IconShield,
};

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const user = useAuth();
  const items = NAV_ITEMS[user.role];

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`app-sidebar${open ? " open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">
            <Image src="/harmony-logo.png" alt="Harmony Garden" width={28} height={28} style={{ objectFit: "contain" }} />
          </div>
          <div>
            <p className="sidebar-brand-name">Galadima</p>
            <p className="sidebar-brand-sub">Harmony Garden</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {items.map((item) => {
            const Icon = ICON_MAP[item.href];
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={`nav-item${isActive ? " active" : ""}`} onClick={onClose}>
                {Icon && <Icon className="nav-item-icon" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-role-badge">{ROLE_LABELS[user.role]}</p>
        </div>
      </aside>
    </>
  );
}