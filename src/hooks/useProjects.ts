"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Project, ProjectInsert, ProjectUpdate } from "@/types";

export function useProjects(clientIdFilter?: string | null) {
  return useQuery<Project[]>({
    queryKey: ["projects", clientIdFilter],
    queryFn: async () => {
      const supabase = createClient();
      let q = supabase
        .from("projects")
        .select("*, clients(organisation_name)")
        .order("end_date", { ascending: true, nullsFirst: false });
      if (clientIdFilter) q = q.eq("client_id", clientIdFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        ...p,
        client_name: p.clients?.organisation_name ?? "",
        clients: undefined,
      })) as Project[];
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery<Project>({
    queryKey: ["project", id],
    enabled: !!id,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .select("*, clients(organisation_name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return {
        ...data,
        client_name: (data as any).clients?.organisation_name ?? "",
        clients: undefined,
      } as Project;
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProjectInsert) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: ProjectUpdate & { id: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from("projects").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Project updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
