"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown, LogOut, Check } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Client } from "@/types";

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
  const { selectedClientId, selectedClientName, setSelectedClient } =
    useClientContext();
  const { data: clients = [] } = useClientList();
  const [userEmail, setUserEmail] = useState<string | null>(null);

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
    <header className="fixed left-60 right-0 top-0 z-30 flex h-14 items-center border-b bg-background px-5 gap-4">
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
