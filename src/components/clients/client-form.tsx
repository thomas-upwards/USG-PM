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
import type { Client } from "@/types";

const schema = z.object({
  organisation_name: z.string().min(1, "Required"),
  organisation_type: z.string().optional(),
  industry: z.string().optional(),
  main_contact_name: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  account_owner: z.string().optional(),
  relationship_status: z.enum(["Active", "Inactive", "Prospect", "On Hold", "Churned"]),
  contract_start_date: z.string().optional(),
  contract_end_date: z.string().optional(),
  notes: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<Client>;
  onSubmit: (values: ClientFormValues) => void;
  loading?: boolean;
  submitLabel?: string;
}

export function ClientForm({
  defaultValues,
  onSubmit,
  loading,
  submitLabel = "Save",
}: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      organisation_name: defaultValues?.organisation_name ?? "",
      organisation_type: defaultValues?.organisation_type ?? "",
      industry: defaultValues?.industry ?? "",
      main_contact_name: defaultValues?.main_contact_name ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      account_owner: defaultValues?.account_owner ?? "",
      relationship_status: defaultValues?.relationship_status ?? "Active",
      contract_start_date: defaultValues?.contract_start_date ?? "",
      contract_end_date: defaultValues?.contract_end_date ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="organisation_name">
          Organisation Name <span className="text-destructive">*</span>
        </Label>
        <Input id="organisation_name" {...register("organisation_name")} />
        {errors.organisation_name && (
          <p className="text-xs text-destructive">{errors.organisation_name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Organisation Type</Label>
          <Input {...register("organisation_type")} placeholder="e.g. Trade Association" />
        </div>
        <div className="space-y-1.5">
          <Label>Industry / Sector</Label>
          <Input {...register("industry")} placeholder="e.g. Technology" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Main Contact Name</Label>
          <Input {...register("main_contact_name")} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input {...register("phone")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input type="email" {...register("email")} />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Internal Account Owner</Label>
          <Input {...register("account_owner")} />
        </div>
        <div className="space-y-1.5">
          <Label>Relationship Status</Label>
          <Select
            value={watch("relationship_status")}
            onValueChange={(v) =>
              setValue("relationship_status", v as ClientFormValues["relationship_status"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Active", "Inactive", "Prospect", "On Hold", "Churned"].map(
                (s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Contract Start Date</Label>
          <Input type="date" {...register("contract_start_date")} />
        </div>
        <div className="space-y-1.5">
          <Label>Contract End Date</Label>
          <Input type="date" {...register("contract_end_date")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea {...register("notes")} rows={3} />
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
