"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Client, ClientInsert, ClientUpdate } from "@/types";

export function useClients(clientIdFilter?: string | null) {
  return useQuery<Client[]>({
    queryKey: ["clients", clientIdFilter],
    enabled: isSupabaseConfigured(),
    queryFn: async () => {
      const supabase = createClient();
      let q = supabase.from("clients").select("*").order("organisation_name");
      if (clientIdFilter) q = q.eq("id", clientIdFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as Client[];
    },
  });
}

export function useClient(id: string | undefined) {
  return useQuery<Client>({
    queryKey: ["client", id],
    enabled: !!id && isSupabaseConfigured(),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Client;
    },
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClientInsert) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("clients")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["clients-list"] });
      toast.success("Client created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: ClientUpdate & { id: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from("clients").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["client", id] });
      qc.invalidateQueries({ queryKey: ["clients-list"] });
      toast.success("Client updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["clients-list"] });
      toast.success("Client deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
