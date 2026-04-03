"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { Plus, Search, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useProjects, useCreateProject } from "@/hooks/useProjects";
import { useClientContext } from "@/contexts/client-context";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectDrawer } from "@/components/projects/project-drawer";
import { ProjectForm, type ProjectFormValues } from "@/components/projects/project-form";
export default function ProjectsPage() {
  const { selectedClientId } = useClientContext();
  const { data: projects = [], isLoading } = useProjects(selectedClientId);
  const createProject = useCreateProject();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const filtered = projects.filter((p) =>
    p.project_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.client_name ?? "").toLowerCase().includes(search.toLowerCase())
  );
  async function handleCreate(values: ProjectFormValues) {
    await createProject.mutateAsync({
      ...values,
      team_members: [],
      description: values.description || null,
      project_type: values.project_type || null,
      project_owner: values.project_owner || null,
      start_date: values.start_date || null,
      end_date: values.end_date || null,
      budget: values.budget ? parseFloat(values.budget) : null,
      revenue: values.revenue ? parseFloat(values.revenue) : null,
      estimated_expenses: values.estimated_expenses
        ? parseFloat(values.estimated_expenses)
        : null,
      actual_expenses: null,
      margin: null,
    });
    setCreating(false);
  }
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Project
        </Button>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onCreate={() => setCreating(true)} hasSearch={!!search} />
      ) : (
        <div className="space-y-2">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => setSelectedId(project.id)}
            />
          ))}
        </div>
      )}
      <ProjectDrawer
        projectId={selectedId}
        onClose={() => setSelectedId(null)}
      />
      <Sheet open={creating} onOpenChange={(open) => !open && setCreating(false)}>
        <SheetContent
          side="right"
          className="w-full sm:w-[520px] sm:max-w-none overflow-y-auto"
        >
          <SheetHeader className="mb-6">
            <SheetTitle>New Project</SheetTitle>
          </SheetHeader>
          <ProjectForm
            defaultClientId={selectedClientId ?? undefined}
            onSubmit={handleCreate}
            loading={createProject.isPending}
            submitLabel="Create Project"
          />
        </SheetContent>
      </Sheet>
    </div>
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
      <FolderKanban className="h-10 w-10 text-muted-foreground/40 mb-3" />
      <p className="font-medium text-muted-foreground">
        {hasSearch ? "No projects match your search" : "No projects yet"}
      </p>
      {!hasSearch && (
        <Button onClick={onCreate} className="mt-4">
          <Plus className="h-4 w-4 mr-1.5" />
          Create Project
        </Button>
      )}
    </div>
  );
}
