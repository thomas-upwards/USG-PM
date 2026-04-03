"use client";

import { cn } from "@/lib/utils";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { Calendar, User } from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import type { Task } from "@/types";

interface Props {
  task: Task;
  onClick?: () => void;
  compact?: boolean;
}

export function TaskRow({ task, onClick, compact }: Props) {
  const isOverdue =
    task.due_date &&
    task.status !== "Completed" &&
    task.status !== "Cancelled" &&
    isPast(parseISO(task.due_date));

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-md border bg-card transition-colors",
        onClick && "cursor-pointer hover:bg-muted/50"
      )}
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium truncate",
            task.status === "Completed" && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>
        {!compact && (
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {task.project_name && <span>{task.project_name}</span>}
            {task.assignee && (
              <span className="flex items-center gap-0.5">
                <User className="h-3 w-3" />
                {task.assignee}
              </span>
            )}
            {task.due_date && (
              <span
                className={cn(
                  "flex items-center gap-0.5",
                  isOverdue && "text-destructive font-medium"
                )}
              >
                <Calendar className="h-3 w-3" />
                {format(parseISO(task.due_date), "d MMM")}
                {isOverdue && " · overdue"}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
      </div>
    </div>
  );
}
