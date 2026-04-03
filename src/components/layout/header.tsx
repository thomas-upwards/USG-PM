"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Building2, ChevronDown, LogOut, Check, Menu, LayoutDashboard, FolderKanban, CheckSquare } from "lucide-react";
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
        .select(
          "id, organisation_name, relationship_status"
        )
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

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : "??";

  return (
    <header className="fixed left-0 md:left-60 right-0 top-0 z-30 flex h-14 items-center border-b bg-background px-4 gap-3">
      {/* Mobile hamburger */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger className="md:hidden flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0" showCloseButton={false}>
          <div className="flex h-14 items-center border-b px-5">
            <span className="text-base font-semibold tracking-tight">Upwards SG</span>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

      {/* Client Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md border border-input bg-background px-3 h-8 text-sm max-w-xs hover:bg-accent transition-colors">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {selectedClientName ?? "All Clients"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground ml-auto" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuItem
            onSelect={() => setSelectedClient(null, null)}
            className="gap-2"
          >
            {!selectedClientId && <Check className="h-3.5 w-3.5" />}
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
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span className="w-3.5" />
              )}
              <span className="truncate">{c.organisation_name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="ml-auto flex items-center gap-3">
        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted transition-colors">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground hidden sm:block truncate max-w-32">
              {userEmail}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={handleSignOut}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
