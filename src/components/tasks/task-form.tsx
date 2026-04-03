"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useClientContext } from "@/contexts/client-context";
import type { Task } from "@/types";

const schema = z.object({
  title: z.string().min(1, "Required"),
  description: z.string().optional(),
  project_id: z.string().min(1, "Required"),
  assignee: z.string().optional(),
  due_date: z.string().optional(),
  start_date: z.string().optional(),
  reminder_date: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  status: z.enum(["Not Started", "In Progress", "Waiting", "Completed", "Cancelled"]),
  follow_up_notes: z.string().optional(),
  is_recurring: z.boolean(),
  recurrence_pattern: z.string().optional(),
  tags: z.string().optional(), // comma-separated
});

export type TaskFormValues = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<Task>;
  defaultProjectId?: string;
  onSubmit: (values: TaskFormValues) => void;
  loading?: boolean;
  submitLabel?: string;
}

export function TaskForm({
  defaultValues,
  defaultProjectId,
  onSubmit,
  loading,
  submitLabel = "Save",
}: Props) {
  const { selectedClientId } = useClientContext();
  const { data: projects = [] } = useProjects(selectedClientId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      project_id: defaultValues?.project_id ?? defaultProjectId ?? "",
      assignee: defaultValues?.assignee ?? "",
      due_date: defaultValues?.due_date ?? "",
      start_date: defaultValues?.start_date ?? "",
      reminder_date: defaultValues?.reminder_date ?? "",
      priority: defaultValues?.priority ?? "Medium",
      status: defaultValues?.status ?? "Not Started",
      follow_up_notes: defaultValues?.follow_up_notes ?? "",
      is_recurring: defaultValues?.is_recurring ?? false,
      recurrence_pattern: defaultValues?.recurrence_pattern ?? "",
      tags: defaultValues?.tags?.join(", ") ?? "",
    },
  });

  const isRecurring = watch("is_recurring");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>
          Task Title <span className="text-destructive">*</span>
        </Label>
        <Input {...register("title")} autoFocus />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea {...register("description")} rows={3} />
      </div>

      <div className="space-y-1.5">
        <Label>
          Project <span className="text-destructive">*</span>
        </Label>
        <Select
          value={watch("project_id") ?? ""}
          onValueChange={(v: string | null) => setValue("project_id", v ?? "")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select project…" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.project_name}
                {p.client_name && (
                  <span className="text-muted-foreground ml-1.5">
                    · {p.client_name}
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.project_id && (
          <p className="text-xs text-destructive">{errors.project_id.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={watch("status")}
            onValueChange={(v) => setValue("status", v as TaskFormValues["status"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Not Started", "In Progress", "Waiting", "Completed", "Cancelled"].map(
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
            onValueChange={(v) => setValue("priority", v as TaskFormValues["priority"])}
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

      <div className="space-y-1.5">
        <Label>Assignee</Label>
        <Input {...register("assignee")} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Start Date</Label>
          <Input type="date" {...register("start_date")} />
        </div>
        <div className="space-y-1.5">
          <Label>Due Date</Label>
          <Input type="date" {...register("due_date")} />
        </div>
        <div className="space-y-1.5">
          <Label>Reminder</Label>
          <Input type="date" {...register("reminder_date")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Tags (comma-separated)</Label>
        <Input {...register("tags")} placeholder="e.g. design, urgent" />
      </div>

      <div className="space-y-1.5">
        <Label>Follow-up Notes</Label>
        <Textarea {...register("follow_up_notes")} rows={2} />
      </div>

      <div className="flex items-start gap-2.5 rounded-md border p-3">
        <Checkbox
          id="is_recurring"
          checked={isRecurring}
          onCheckedChange={(v) => setValue("is_recurring", !!v)}
          className="mt-0.5"
        />
        <div className="flex-1">
          <label htmlFor="is_recurring" className="text-sm font-medium cursor-pointer">
            Recurring task
          </label>
          {isRecurring && (
            <div className="mt-2">
              <Select
                value={watch("recurrence_pattern") ?? ""}
                onValueChange={(v: string | null) => setValue("recurrence_pattern", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pattern…" />
                </SelectTrigger>
                <SelectContent>
                  {["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"].map(
                    (p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
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
