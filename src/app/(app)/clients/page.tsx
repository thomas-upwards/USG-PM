"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { Plus, Search, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { useClientContext } from "@/contexts/client-context";
import { ClientDrawer } from "@/components/clients/client-drawer";
import { ClientForm, type ClientFormValues } from "@/components/clients/client-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";
import type { Client } from "@/types";
export default function ClientsPage() {
  const { selectedClientId } = useClientContext();
  const { data: clients = [], isLoading } = useClients(selectedClientId);
  const createClient = useCreateClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const filtered = clients.filter((c) =>
    c.organisation_name.toLowerCase().includes(search.toLowerCase())
  );
  async function handleCreate(values: ClientFormValues) {
    await createClient.mutateAsync({
      ...values,
      team_members: [],
      organisation_type: values.organisation_type || null,
      industry: values.industry || null,
      main_contact_name: values.main_contact_name || null,
      email: values.email || null,
      phone: values.phone || null,
      account_owner: values.account_owner || null,
      contract_start_date: values.contract_start_date || null,
      contract_end_date: values.contract_end_date || null,
      notes: values.notes || null,
    });
    setCreating(false);
  }
  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {clients.length} client{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Client
        </Button>
      </div>
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onCreate={() => setCreating(true)} hasSearch={!!search} />
      ) : (
        <div className="space-y-2">
          {filtered.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              onClick={() => setSelectedId(client.id)}
            />
          ))}
        </div>
      )}
      {/* Detail drawer */}
      <ClientDrawer
        clientId={selectedId}
        onClose={() => setSelectedId(null)}
      />
      {/* Create drawer */}
      <Sheet open={creating} onOpenChange={(open) => !open && setCreating(false)}>
        <SheetContent
          side="right"
          className="w-full sm:w-[480px] sm:max-w-none overflow-y-auto"
        >
          <SheetHeader className="mb-6">
            <SheetTitle>New Client</SheetTitle>
          </SheetHeader>
          <ClientForm
            onSubmit={handleCreate}
            loading={createClient.isPending}
            submitLabel="Create Client"
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
function ClientRow({
  client,
  onClick,
}: {
  client: Client;
  onClick: () => void;
}) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-4 py-4">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{client.organisation_name}</p>
          <p className="text-sm text-muted-foreground truncate">
            {[client.organisation_type, client.industry]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {client.account_owner && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              {client.account_owner}
            </span>
          )}
          {client.contract_end_date && (
            <span className="text-xs text-muted-foreground hidden md:block">
              Ends {format(new Date(client.contract_end_date), "d MMM yyyy")}
            </span>
          )}
          <StatusBadge status={client.relationship_status} />
        </div>
      </CardContent>
    </Card>
  );
}
function EmptyState({
  onCreate,
  hasSearch,
}: {
  onCreate: () => void;
  hasSearch: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Building2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
      <p className="font-medium text-muted-foreground">
        {hasSearch ? "No clients match your search" : "No clients yet"}
      </p>
      {!hasSearch && (
        <Button onClick={onCreate} className="mt-4">
          <Plus className="h-4 w-4 mr-1.5" />
          Create Client
        </Button>
      )}
    </div>
  );
}
