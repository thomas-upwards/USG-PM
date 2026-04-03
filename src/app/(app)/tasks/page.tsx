"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { Plus, Search, CheckSquare, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTasks, useCreateTask } from "@/hooks/useTasks";
import { useClientContext } from "@/contexts/client-context";
import { TaskRow } from "@/components/tasks/task-row";
import { TaskDrawer } from "@/components/tasks/task-drawer";
import { TaskForm, type TaskFormValues } from "@/components/tasks/task-form";
import { createClient } from "@/lib/supabase/client";
import type { TaskStatus, Priority } from "@/types";
type FilterStatus = TaskStatus | "all";
type FilterPriority = Priority | "all";
export default function TasksPage() {
  const { selectedClientId } = useClientContext();
  const { data: tasks = [], isLoading } = useTasks({ clientId: selectedClientId ?? undefined });
  const createTask = useCreateTask();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);
  const filtered = tasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (
      search &&
      !t.title.toLowerCase().includes(search.toLowerCase()) &&
      !(t.project_name ?? "").toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });
  // Sort: overdue first, then by due date
  const sorted = [...filtered].sort((a, b) => {
    const aDate = a.due_date ? new Date(a.due_date).getTime() : Infinity;
    const bDate = b.due_date ? new Date(b.due_date).getTime() : Infinity;
    return aDate - bDate;
  });
  async function handleCreate(values: TaskFormValues) {
    await createTask.mutateAsync({
      ...values,
      client_id: selectedClientId ?? null,
      created_by: userEmail ?? null,
      description: values.description || null,
      assignee: values.assignee || null,
      due_date: values.due_date || null,
      start_date: values.start_date || null,
      reminder_date: values.reminder_date || null,
      follow_up_notes: values.follow_up_notes || null,
      recurrence_pattern: values.recurrence_pattern || null,
      parent_task_id: null,
      tags: values.tags
        ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    });
    setCreating(false);
  }
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Task
        </Button>
      </div>
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v as FilterStatus)}
        >
          <SelectTrigger className="w-40">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["Not Started", "In Progress", "Waiting", "Completed", "Cancelled"].map(
              (s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <Select
          value={filterPriority}
          onValueChange={(v) => setFilterPriority(v as FilterPriority)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {["Low", "Medium", "High", "Critical"].map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-md" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState onCreate={() => setCreating(true)} hasFilters={!!search || filterStatus !== "all"} />
      ) : (
        <div className="space-y-1.5">
          {sorted.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onClick={() => setSelectedId(task.id)}
            />
          ))}
        </div>
      )}
      <TaskDrawer
        taskId={selectedId}
        onClose={() => setSelectedId(null)}
        userEmail={userEmail}
      />
      <Sheet open={creating} onOpenChange={(open) => !open && setCreating(false)}>
        <SheetContent
          side="right"
          className="w-full sm:w-[520px] sm:max-w-none overflow-y-auto"
        >
          <SheetHeader className="mb-6">
            <SheetTitle>New Task</SheetTitle>
          </SheetHeader>
          <TaskForm
            onSubmit={handleCreate}
            loading={createTask.isPending}
            submitLabel="Create Task"
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
function EmptyState({
  onCreate,
  hasFilters,
}: {
  onCreate: () => void;
  hasFilters: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <CheckSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
      <p className="font-medium text-muted-foreground">
        {hasFilters ? "No tasks match your filters" : "No tasks yet"}
      </p>
      {!hasFilters && (
        <Button onClick={onCreate} className="mt-4">
          <Plus className="h-4 w-4 mr-1.5" />
          Create Task
        </Button>
      )}
    </div>
  );
}
