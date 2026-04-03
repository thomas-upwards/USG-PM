"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Building2,
  ChevronDown,
  LogOut,
  Check,
  Menu,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Search,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { useClientContext } from "@/contexts/client-context";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Client } from "@/types";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
];

function useClientList() {
  return useQuery<Client[]>({
    queryKey: ["clients-list"],
    enabled: isSupabaseConfigured(),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("clients")
        .select("id, organisation_name, relationship_status")
        .order("organisation_name");
      if (error) throw error;
      return data as Client[];
    },
  });
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedClientId, selectedClientName, setSelectedClient } =
    useClientContext();
  const { data: clients = [] } = useClientList();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  async function handleSignOut() {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "SG";

  return (
    <header className="fixed left-0 md:left-60 right-0 top-0 z-30 flex h-16 items-center border-b bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/80 px-4 gap-3">
      {/* Mobile hamburger */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger className="md:hidden flex items-center justify-center h-8 w-8 rounded-md hover:bg-gray-100 transition-colors">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0 bg-slate-900 border-0" showCloseButton={false}>
          <div className="flex h-16 items-center px-5 gap-3 border-b border-slate-700/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold text-sm shrink-0">U</div>
            <span className="text-white font-semibold text-base tracking-tight">Upwards SG</span>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active ? "bg-slate-700 text-white font-medium" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-gray-100 text-sm text-gray-700 placeholder:text-gray-400 border-0 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Bell */}
        <button className="relative flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="h-4.5 w-4.5 text-gray-500" />
        </button>

        {/* Client Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger className="hidden sm:flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 h-9 text-sm text-gray-700 max-w-[180px] hover:bg-gray-50 transition-colors shadow-xs">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="truncate">{selectedClientName ?? "All Clients"}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400 ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem onSelect={() => setSelectedClient(null, null)} className="gap-2">
              {!selectedClientId && <Check className="h-3.5 w-3.5 text-indigo-600" />}
              {selectedClientId && <span className="w-3.5" />}
              All Clients
            </DropdownMenuItem>
            {clients.length > 0 && <DropdownMenuSeparator />}
            {clients.map((c) => (
              <DropdownMenuItem
                key={c.id}
                onSelect={() => setSelectedClient(c.id, c.organisation_name)}
                className="gap-2"
              >
                {selectedClientId === c.id ? (
                  <Check className="h-3.5 w-3.5 text-indigo-600" />
                ) : (
                  <span className="w-3.5" />
                )}
                <span className="truncate">{c.organisation_name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-indigo-500 text-white">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-700 hidden sm:block truncate max-w-28">
              {userEmail?.split("@")[0] ?? "Account"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={handleSignOut} className="gap-2 text-red-600 focus:text-red-600">
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
