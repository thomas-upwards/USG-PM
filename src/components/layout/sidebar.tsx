"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  CheckSquare,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden md:flex w-60 flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 items-center px-5 gap-3 border-b border-slate-700/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold text-sm shrink-0">
          U
        </div>
        <span className="text-white font-semibold text-base tracking-tight">
          Upwards SG
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-slate-700 text-white font-medium"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="border-t border-slate-700/50 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            SG
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white font-medium truncate">Upwards SG</p>
            <p className="text-xs text-slate-400">Logged in</p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        </div>
      </div>
    </aside>
  );
}
