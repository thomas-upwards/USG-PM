"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Task, TaskInsert, TaskUpdate } from "@/types";

interface TaskFilters {
  clientId?: string;
  projectId?: string;
}

export function useTasks(filters: TaskFilters = {}) {
  return useQuery<Task[]>({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      const supabase = createClient();
      let q = supabase
        .from("tasks")
        .select("*, projects(project_name, client_id, clients(organisation_name))")
        .is("parent_task_id", null)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (filters.projectId) q = q.eq("project_id", filters.projectId);
      if (filters.clientId) q = q.eq("client_id", filters.clientId);

      const { data, error } = await q;
      if (error) throw error;

      return (data ?? []).map((t: any) => ({
        ...t,
        project_name: t.projects?.project_name ?? null,
        client_name: t.projects?.clients?.organisation_name ?? null,
        projects: undefined,
      })) as Task[];
    },
  });
}

export function useTask(id: string | undefined) {
  return useQuery<Task>({
    queryKey: ["task", id],
    enabled: !!id,
    queryFn: async () => {
      const supabase = createClient();
      const [taskRes, subtasksRes, commentsRes, attachmentsRes] =
        await Promise.all([
          supabase
            .from("tasks")
            .select("*, projects(project_name, client_id, clients(organisation_name))")
            .eq("id", id!)
            .single(),
          supabase
            .from("tasks")
            .select("*")
            .eq("parent_task_id", id!)
            .order("created_at"),
          supabase
            .from("task_comments")
            .select("*")
            .eq("task_id", id!)
            .order("created_at"),
          supabase
            .from("attachments")
            .select("*")
            .eq("task_id", id!)
            .order("created_at"),
        ]);

      if (taskRes.error) throw taskRes.error;
      const t = taskRes.data as any;
      return {
        ...t,
        project_name: t.projects?.project_name ?? null,
        client_name: t.projects?.clients?.organisation_name ?? null,
        projects: undefined,
        subtasks: subtasksRes.data ?? [],
        comments: commentsRes.data ?? [],
        attachments: attachmentsRes.data ?? [],
      } as Task;
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TaskInsert) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tasks")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      if (data.parent_task_id) {
        qc.invalidateQueries({ queryKey: ["task", data.parent_task_id] });
      }
      toast.success("Task created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: TaskUpdate & { id: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from("tasks").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task", id] });
      toast.success("Task updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      content,
      author,
    }: {
      taskId: string;
      content: string;
      author: string | null;
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("task_comments")
        .insert({ task_id: taskId, content, author });
      if (error) throw error;
    },
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: ["task", taskId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
