"use client";

import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

interface Props {
  project: Project;
  compact?: boolean;
  onClick?: () => void;
}

export function ProjectCard({ project, compact, onClick }: Props) {
  return (
    <Card
      className={cn(
        "transition-shadow",
        onClick && "cursor-pointer hover:shadow-md"
      )}
      onClick={onClick}
    >
      <CardContent className={cn("py-4", compact ? "px-4" : "px-5")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={cn("font-medium truncate", compact ? "text-sm" : "")}>
              {project.project_name}
            </p>
            {!compact && project.client_name && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {project.client_name}
              </p>
            )}
            {project.description && !compact && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <PriorityBadge priority={project.priority} />
            <StatusBadge status={project.status} />
          </div>
        </div>
        {!compact && (
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            {project.project_owner && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {project.project_owner}
              </span>
            )}
            {project.end_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Due {format(new Date(project.end_date), "d MMM yyyy")}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
