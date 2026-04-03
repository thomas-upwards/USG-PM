"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, CheckSquare, Info } from "lucide-react";
import { useProject, useUpdateProject } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { ProjectForm, type ProjectFormValues } from "./project-form";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { TaskRow } from "@/components/tasks/task-row";
import { format } from "date-fns";

const fmt = (n: number | null | undefined) =>
  n != null
    ? new Intl.NumberFormat("en-SG", {
        style: "currency",
        currency: "SGD",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";

interface Props {
  projectId: string | null;
  onClose: () => void;
}

export function ProjectDrawer({ projectId, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  const { data: project, isLoading } = useProject(projectId ?? undefined);
  const { data: tasks = [] } = useTasks({ projectId: projectId ?? undefined });
  const updateProject = useUpdateProject();

  async function handleEdit(values: ProjectFormValues) {
    if (!projectId) return;
    await updateProject.mutateAsync({
      id: projectId,
      ...values,
      budget: values.budget ? parseFloat(values.budget) : null,
      revenue: values.revenue ? parseFloat(values.revenue) : null,
      estimated_expenses: values.estimated_expenses
        ? parseFloat(values.estimated_expenses)
        : null,
      description: values.description || null,
      project_type: values.project_type || null,
      project_owner: values.project_owner || null,
      start_date: values.start_date || null,
      end_date: values.end_date || null,
    });
    setEditing(false);
  }

  return (
    <Sheet open={!!projectId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[55vw] sm:max-w-none overflow-y-auto p-0"
      >
        {isLoading || !project ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : editing ? (
          <div className="p-6">
            <SheetHeader className="mb-4">
              <SheetTitle>Edit Project</SheetTitle>
            </SheetHeader>
            <ProjectForm
              defaultValues={project}
              onSubmit={handleEdit}
              loading={updateProject.isPending}
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
            <div className="p-6 pb-4 border-b">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <SheetTitle className="text-xl truncate">
                    {project.project_name}
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {project.client_name}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <PriorityBadge priority={project.priority} />
                    <StatusBadge status={project.status} />
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

            <Tabs defaultValue="details">
              <TabsList className="w-full rounded-none border-b h-10 px-6 justify-start gap-0 bg-transparent">
                {[
                  { value: "details", label: "Details", icon: Info },
                  { value: "tasks", label: `Tasks (${tasks.length})`, icon: CheckSquare },
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

              <TabsContent value="details" className="p-6 space-y-4">
                {project.description && (
                  <p className="text-sm text-muted-foreground">
                    {project.description}
                  </p>
                )}
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {[
                    ["Type", project.project_type],
                    ["Owner", project.project_owner],
                    [
                      "Start",
                      project.start_date
                        ? format(new Date(project.start_date), "d MMM yyyy")
                        : null,
                    ],
                    [
                      "End",
                      project.end_date
                        ? format(new Date(project.end_date), "d MMM yyyy")
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
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Financials
                  </p>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {[
                      ["Budget", fmt(project.budget)],
                      ["Revenue", fmt(project.revenue)],
                      ["Est. Expenses", fmt(project.estimated_expenses)],
                      ["Actual Expenses", fmt(project.actual_expenses)],
                      ["Margin", fmt(project.margin)],
                    ].map(([label, value]) => (
                      <div key={label as string}>
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="font-medium mt-0.5">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="p-6 space-y-2">
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks yet.</p>
                ) : (
                  tasks.map((t) => <TaskRow key={t.id} task={t} />)
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
