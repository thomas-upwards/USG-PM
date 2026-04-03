"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Pencil, Building2, FolderKanban, CheckSquare, StickyNote } from "lucide-react";
import { useClient, useUpdateClient } from "@/hooks/useClients";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { ClientForm, type ClientFormValues } from "./client-form";
import { ProjectCard } from "@/components/projects/project-card";
import { TaskRow } from "@/components/tasks/task-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";

interface Props {
  clientId: string | null;
  onClose: () => void;
}

export function ClientDrawer({ clientId, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  const { data: client, isLoading } = useClient(clientId ?? undefined);
  const { data: projects = [] } = useProjects(clientId);
  const { data: tasks = [] } = useTasks({ clientId: clientId ?? undefined });
  const updateClient = useUpdateClient();

  async function handleEdit(values: ClientFormValues) {
    if (!clientId) return;
    await updateClient.mutateAsync({ id: clientId, ...values });
    setEditing(false);
  }

  return (
    <Sheet open={!!clientId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[55vw] sm:max-w-none overflow-y-auto p-0"
      >
        {isLoading || !client ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : editing ? (
          <div className="p-6">
            <SheetHeader className="mb-4">
              <SheetTitle>Edit Client</SheetTitle>
            </SheetHeader>
            <ClientForm
              defaultValues={client}
              onSubmit={handleEdit}
              loading={updateClient.isPending}
              submitLabel="Save changes"
            />
            <Button
              variant="ghost"
              className="mt-2"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 pb-4 border-b">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <SheetTitle className="text-xl truncate">
                    {client.organisation_name}
                  </SheetTitle>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {client.organisation_type && (
                      <span className="text-sm text-muted-foreground">
                        {client.organisation_type}
                      </span>
                    )}
                    {client.organisation_type && client.industry && (
                      <span className="text-muted-foreground">·</span>
                    )}
                    {client.industry && (
                      <span className="text-sm text-muted-foreground">
                        {client.industry}
                      </span>
                    )}
                    <StatusBadge status={client.relationship_status} />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                  className="shrink-0"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="flex-1">
              <TabsList className="w-full rounded-none border-b h-10 px-6 justify-start gap-0 bg-transparent">
                {[
                  { value: "overview", label: "Overview", icon: Building2 },
                  { value: "projects", label: `Projects (${projects.length})`, icon: FolderKanban },
                  { value: "tasks", label: `Tasks (${tasks.length})`, icon: CheckSquare },
                  { value: "notes", label: "Notes", icon: StickyNote },
                ].map(({ value, label, icon: Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-1.5 px-3"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Overview */}
              <TabsContent value="overview" className="p-6 space-y-4">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {[
                    ["Main Contact", client.main_contact_name],
                    ["Email", client.email],
                    ["Phone", client.phone],
                    ["Account Owner", client.account_owner],
                    [
                      "Contract Start",
                      client.contract_start_date
                        ? format(new Date(client.contract_start_date), "d MMM yyyy")
                        : null,
                    ],
                    [
                      "Contract End",
                      client.contract_end_date
                        ? format(new Date(client.contract_end_date), "d MMM yyyy")
                        : null,
                    ],
                  ].map(([label, value]) =>
                    value ? (
                      <div key={label as string}>
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="font-medium mt-0.5">{value}</dd>
                      </div>
                    ) : null
                  )}
                </dl>
                {client.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                        Notes
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Projects */}
              <TabsContent value="projects" className="p-6 space-y-3">
                {projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No projects yet.</p>
                ) : (
                  projects.map((p) => <ProjectCard key={p.id} project={p} compact />)
                )}
              </TabsContent>

              {/* Tasks */}
              <TabsContent value="tasks" className="p-6 space-y-2">
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks yet.</p>
                ) : (
                  tasks.map((t) => <TaskRow key={t.id} task={t} />)
                )}
              </TabsContent>

              {/* Notes */}
              <TabsContent value="notes" className="p-6">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {client.notes || "No notes."}
                </p>
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
