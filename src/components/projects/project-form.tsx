"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import type { Project } from "@/types";

const schema = z.object({
  project_name: z.string().min(1, "Required"),
  client_id: z.string().min(1, "Required"),
  description: z.string().optional(),
  project_type: z.string().optional(),
  status: z.enum(["Planning", "Active", "On Hold", "Completed", "Cancelled"]),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  project_owner: z.string().optional(),
  budget: z.string().optional(),
  revenue: z.string().optional(),
  estimated_expenses: z.string().optional(),
});

export type ProjectFormValues = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<Project>;
  defaultClientId?: string;
  onSubmit: (values: ProjectFormValues) => void;
  loading?: boolean;
  submitLabel?: string;
}

export function ProjectForm({
  defaultValues,
  defaultClientId,
  onSubmit,
  loading,
  submitLabel = "Save",
}: Props) {
  const { data: clients = [] } = useClients();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      project_name: defaultValues?.project_name ?? "",
      client_id: defaultValues?.client_id ?? defaultClientId ?? "",
      description: defaultValues?.description ?? "",
      project_type: defaultValues?.project_type ?? "",
      status: defaultValues?.status ?? "Planning",
      priority: defaultValues?.priority ?? "Medium",
      start_date: defaultValues?.start_date ?? "",
      end_date: defaultValues?.end_date ?? "",
      project_owner: defaultValues?.project_owner ?? "",
      budget: defaultValues?.budget?.toString() ?? "",
      revenue: defaultValues?.revenue?.toString() ?? "",
      estimated_expenses: defaultValues?.estimated_expenses?.toString() ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>
          Project Name <span className="text-destructive">*</span>
        </Label>
        <Input {...register("project_name")} />
        {errors.project_name && (
          <p className="text-xs text-destructive">{errors.project_name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>
          Client <span className="text-destructive">*</span>
        </Label>
        <Select
          value={watch("client_id") ?? ""}
          onValueChange={(v: string | null) => setValue("client_id", v ?? "")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select client…" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.organisation_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.client_id && (
          <p className="text-xs text-destructive">{errors.client_id.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea {...register("description")} rows={3} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Project Type</Label>
          <Input {...register("project_type")} placeholder="e.g. Event, Initiative" />
        </div>
        <div className="space-y-1.5">
          <Label>Project Owner</Label>
          <Input {...register("project_owner")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={watch("status")}
            onValueChange={(v) =>
              setValue("status", v as ProjectFormValues["status"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Planning", "Active", "On Hold", "Completed", "Cancelled"].map(
                (s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select
            value={watch("priority")}
            onValueChange={(v) =>
              setValue("priority", v as ProjectFormValues["priority"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Low", "Medium", "High", "Critical"].map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Start Date</Label>
          <Input type="date" {...register("start_date")} />
        </div>
        <div className="space-y-1.5">
          <Label>End Date</Label>
          <Input type="date" {...register("end_date")} />
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Financials (SGD)
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Budget</Label>
            <Input type="number" step="0.01" {...register("budget")} />
          </div>
          <div className="space-y-1.5">
            <Label>Revenue</Label>
            <Input type="number" step="0.01" {...register("revenue")} />
          </div>
          <div className="space-y-1.5">
            <Label>Est. Expenses</Label>
            <Input type="number" step="0.01" {...register("estimated_expenses")} />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
