"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  Clock,
  Star,
  User,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useClients } from "@/hooks/useClients";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useClientContext } from "@/contexts/client-context";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/client";
import {
  isToday,
  isPast,
  parseISO,
  format,
  isFuture,
  differenceInDays,
} from "date-fns";
export default function DashboardPage() {
  const { selectedClientId } = useClientContext();
  const { data: clients = [], isLoading: loadingClients } = useClients(selectedClientId);
  const { data: projects = [], isLoading: loadingProjects } = useProjects(selectedClientId);
  const { data: tasks = [], isLoading: loadingTasks } = useTasks({
    clientId: selectedClientId ?? undefined,
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);
  const loading = loadingClients || loadingProjects || loadingTasks;
  // Computed metrics
  const activeClients = clients.filter((c) => c.relationship_status === "Active").length;
  const activeProjects = projects.filter((p) => p.status === "Active").length;
  const dueTodayTasks = tasks.filter(
    (t) =>
      t.status !== "Completed" &&
      t.status !== "Cancelled" &&
      t.due_date &&
      isToday(parseISO(t.due_date))
  );
  const overdueTasks = tasks.filter(
    (t) =>
      t.status !== "Completed" &&
      t.status !== "Cancelled" &&
      t.due_date &&
      isPast(parseISO(t.due_date)) &&
      !isToday(parseISO(t.due_date))
  );
  const highPriorityTasks = tasks.filter(
    (t) =>
      (t.priority === "High" || t.priority === "Critical") &&
      t.status !== "Completed" &&
      t.status !== "Cancelled"
  );
  const myTasks = tasks.filter(
    (t) =>
      t.assignee &&
      userEmail &&
      t.assignee.toLowerCase().includes(userEmail.split("@")[0].toLowerCase()) &&
      t.status !== "Completed" &&
      t.status !== "Cancelled"
  );
  // Tasks by status
  const tasksByStatus = [
    "Not Started",
    "In Progress",
    "Waiting",
    "Completed",
    "Cancelled",
  ].map((s) => ({
    status: s,
    count: tasks.filter((t) => t.status === s).length,
  }));
  // Tasks by priority
  const tasksByPriority = ["Critical", "High", "Medium", "Low"].map((p) => ({
    priority: p,
    count: tasks.filter(
      (t) => t.priority === p && t.status !== "Completed" && t.status !== "Cancelled"
    ).length,
  }));
  // Upcoming deadlines (next 14 days)
  const upcomingDeadlines = tasks
    .filter((t) => {
      if (t.status === "Completed" || t.status === "Cancelled" || !t.due_date) return false;
      const days = differenceInDays(parseISO(t.due_date), new Date());
      return days >= 0 && days <= 14;
    })
    .sort((a, b) => parseISO(a.due_date!).getTime() - parseISO(b.due_date!).getTime())
    .slice(0, 8);
  // Active projects list
  const activeProjectsList = projects
    .filter((p) => p.status === "Active")
    .slice(0, 5);
  // Workload by assignee
  const workloadMap = new Map<string, number>();
  tasks
    .filter((t) => t.assignee && t.status !== "Completed" && t.status !== "Cancelled")
    .forEach((t) => {
      workloadMap.set(t.assignee!, (workloadMap.get(t.assignee!) ?? 0) + 1);
    });
  const workload = [...workloadMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxWorkload = workload[0]?.[1] ?? 1;
  const summaryCards = [
    {
      label: "Total Clients",
      value: activeClients,
      icon: Building2,
      href: "/clients",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Active Projects",
      value: activeProjects,
      icon: FolderKanban,
      href: "/projects",
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      label: "Tasks Due Today",
      value: dueTodayTasks.length,
      icon: Clock,
      href: "/tasks",
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950/30",
    },
    {
      label: "Overdue Tasks",
      value: overdueTasks.length,
      icon: AlertTriangle,
      href: "/tasks",
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950/30",
    },
    {
      label: "High Priority",
      value: highPriorityTasks.length,
      icon: Star,
      href: "/tasks",
      color: "text-yellow-600",
      bg: "bg-yellow-50 dark:bg-yellow-950/30",
    },
    {
      label: "My Tasks",
      value: myTasks.length,
      icon: User,
      href: "/tasks",
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/30",
    },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {selectedClientId
            ? "Filtered by selected client"
            : "All clients overview"}
        </p>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {summaryCards.map(({ label, value, icon: Icon, href, color, bg }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4">
                <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                {loading ? (
                  <Skeleton className="h-7 w-10 mb-1" />
                ) : (
                  <p className="text-2xl font-bold">{value}</p>
                )}
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Active Projects */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Active Projects</CardTitle>
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 rounded" />
              ))
            ) : activeProjectsList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active projects.</p>
            ) : (
              activeProjectsList.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.project_name}</p>
                    {p.client_name && (
                      <p className="text-xs text-muted-foreground">{p.client_name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <PriorityBadge priority={p.priority} />
                    {p.end_date && (
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {format(parseISO(p.end_date), "d MMM")}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
              <Badge variant="secondary" className="text-xs">
                Next 14 days
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 rounded" />
              ))
            ) : upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming deadlines.
              </p>
            ) : (
              upcomingDeadlines.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 text-sm"
                >
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{t.title}</p>
                    {t.project_name && (
                      <p className="text-xs text-muted-foreground">{t.project_name}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {format(parseISO(t.due_date!), "d MMM")}
                  </div>
                  <PriorityBadge priority={t.priority} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
        {/* Tasks by Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {loading
              ? [...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-6 rounded" />
                ))
              : tasksByStatus.map(({ status, count }) => (
                  <div key={status} className="flex items-center gap-3 text-sm">
                    <StatusBadge status={status} />
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary rounded-full h-1.5 transition-all"
                        style={{
                          width:
                            tasks.length > 0
                              ? `${(count / tasks.length) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                    <span className="text-muted-foreground w-6 text-right text-xs">
                      {count}
                    </span>
                  </div>
                ))}
          </CardContent>
        </Card>
        {/* Tasks by Priority */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {loading
              ? [...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-6 rounded" />
                ))
              : tasksByPriority.map(({ priority, count }) => (
                  <div key={priority} className="flex items-center gap-3 text-sm">
                    <PriorityBadge priority={priority} />
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary rounded-full h-1.5 transition-all"
                        style={{
                          width:
                            highPriorityTasks.length > 0 || count > 0
                              ? `${(count / Math.max(...tasksByPriority.map((x) => x.count), 1)) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                    <span className="text-muted-foreground w-6 text-right text-xs">
                      {count}
                    </span>
                  </div>
                ))}
          </CardContent>
        </Card>
      </div>
      {/* Workload by Team Member */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Workload by Team Member</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 rounded" />
              ))}
            </div>
          ) : workload.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No assigned tasks.
            </p>
          ) : (
            <div className="space-y-3">
              {workload.map(([name, count]) => (
                <div key={name} className="flex items-center gap-3 text-sm">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-primary">
                      {name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <span className="w-28 truncate">{name}</span>
                  <div className="flex-1 bg-muted rounded-full h-1.5">
                    <div
                      className="bg-primary rounded-full h-1.5 transition-all"
                      style={{ width: `${(count / maxWorkload) * 100}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground text-xs w-12 text-right">
                    {count} task{count !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
