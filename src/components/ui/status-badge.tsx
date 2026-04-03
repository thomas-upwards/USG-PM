import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  // Client statuses
  Active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Inactive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  Prospect: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "On Hold": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Churned: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  // Project statuses
  Planning: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  Completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  // Task statuses
  "Not Started": "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Waiting: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

const PRIORITY_STYLES: Record<string, string> = {
  Low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  Medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  High: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn("text-xs font-medium border-0", STATUS_STYLES[status] ?? "")}
    >
      {status}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn("text-xs font-medium border-0", PRIORITY_STYLES[priority] ?? "")}
    >
      {priority}
    </Badge>
  );
}
