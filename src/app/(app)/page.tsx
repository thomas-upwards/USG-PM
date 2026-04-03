"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
  TrendingUp,
} from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useClientContext } from "@/contexts/client-context";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { isToday, isPast, parseISO, format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import type { Task, Project } from "@/types";

/* ── helpers ────────────────────────────────────────────────── */
const PRIORITY_COLOR: Record<string, string> = {
  Critical: "bg-red-500",
  High:     "bg-orange-500",
  Medium:   "bg-amber-400",
  Low:      "bg-slate-300",
};

const STATUS_COLOR: Record<string, string> = {
  "Not Started": "#94a3b8",
  "In Progress":  "#6366f1",
  "Waiting":      "#f59e0b",
  "Completed":    "#10b981",
  "Cancelled":    "#ef4444",
};

const PROJECT_ACCENTS = [
  "border-l-indigo-500",
  "border-l-emerald-500",
  "border-l-amber-500",
  "border-l-pink-500",
  "border-l-cyan-500",
];

/* ── mini calendar ──────────────────────────────────────────── */
function MiniCalendar({ tasks }: { tasks: Task[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const deadlineMap = new Map<number, "overdue" | "upcoming" | "today">();
  tasks
    .filter((t) => t.due_date && t.status !== "Completed" && t.status !== "Cancelled")
    .forEach((t) => {
      const d = parseISO(t.due_date!);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (isToday(d)) deadlineMap.set(day, "today");
        else if (isPast(d)) deadlineMap.set(day, "overdue");
        else if (!deadlineMap.has(day)) deadlineMap.set(day, "upcoming");
      }
    });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          const kind = day ? deadlineMap.get(day) : undefined;
          return (
            <div
              key={i}
              className={cn(
                "text-center text-xs py-1 rounded-full mx-auto w-7 leading-5",
                !day && "invisible",
                day === today.getDate() && month === today.getMonth() && "bg-indigo-600 text-white font-semibold",
                kind === "overdue" && day !== today.getDate() && "bg-red-100 text-red-600 font-semibold",
                kind === "upcoming" && "bg-amber-50 text-amber-700 font-medium",
              )}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── donut chart ────────────────────────────────────────────── */
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0)
    return (
      <div className="h-24 w-24 rounded-full border-[10px] border-gray-100 flex items-center justify-center">
        <span className="text-xs text-gray-400">—</span>
      </div>
    );

  const r = 40;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="relative">
      <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
        {segments.map((seg, i) => {
          const dash = (seg.value / total) * circ;
          const el = (
            <circle
              key={i}
              cx="50" cy="50" r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-gray-800">{total}</span>
        <span className="text-[10px] text-gray-400">tasks</span>
      </div>
    </div>
  );
}

/* ── task checkbox row ──────────────────────────────────────── */
function TaskRow({ task, highlight }: { task: Task; highlight?: string }) {
  const done = task.status === "Completed";
  return (
    <div className={cn("flex items-start gap-3 py-2 px-3 rounded-lg", highlight)}>
      <div className="mt-0.5 shrink-0">
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <Circle className="h-4 w-4 text-gray-300" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium truncate", done && "line-through text-gray-400")}>
          {task.title}
        </p>
        {task.project_name && (
          <p className="text-xs text-gray-400 truncate">{task.project_name}</p>
        )}
      </div>
      {task.priority && (
        <span className={cn("h-1.5 w-1.5 rounded-full mt-1.5 shrink-0", PRIORITY_COLOR[task.priority])} />
      )}
    </div>
  );
}

/* ── project card ───────────────────────────────────────────── */
function ProjectCard({ project, accent }: { project: Project; accent: string }) {
  return (
    <div className={cn("border-l-4 pl-3 py-2", accent)}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-sm font-semibold text-gray-800 truncate">{project.project_name}</p>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 shrink-0">
          {project.status}
        </span>
      </div>
      {project.client_name && (
        <p className="text-xs text-gray-400 mb-2">{project.client_name}</p>
      )}
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: project.status === "Completed" ? "100%" : project.status === "Active" ? "55%" : "20%" }}
        />
      </div>
      {project.end_date && (
        <p className="text-[10px] text-gray-400 mt-1.5">
          Due {format(parseISO(project.end_date), "d MMM yyyy")}
        </p>
      )}
    </div>
  );
}

/* ── page ───────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { selectedClientId } = useClientContext();
  const { data: clients = [] } = useClients(selectedClientId);
  const { data: projects = [] } = useProjects(selectedClientId);
  const { data: tasks = [] } = useTasks({ clientId: selectedClientId ?? undefined });
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);

  const userName = userEmail ? userEmail.split("@")[0] : "there";

  // Derived data
  const activeProjects = projects.filter((p) => p.status === "Active").slice(0, 4);
  const todayTasks = tasks.filter(
    (t) => t.due_date && isToday(parseISO(t.due_date)) && t.status !== "Cancelled"
  );
  const overdueTasks = tasks.filter(
    (t) =>
      t.due_date &&
      isPast(parseISO(t.due_date)) &&
      !isToday(parseISO(t.due_date)) &&
      t.status !== "Completed" &&
      t.status !== "Cancelled"
  );
  const upcomingTasks = tasks
    .filter((t) => {
      if (!t.due_date || t.status === "Completed" || t.status === "Cancelled") return false;
      const days = differenceInDays(parseISO(t.due_date), new Date());
      return days > 0 && days <= 14;
    })
    .sort((a, b) => parseISO(a.due_date!).getTime() - parseISO(b.due_date!).getTime());

  // Recent activity = last 6 non-completed tasks (sorted by priority)
  const activityTasks = [...tasks]
    .filter((t) => t.status !== "Completed" && t.status !== "Cancelled")
    .sort((a, b) => {
      const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
    })
    .slice(0, 5);

  // Status breakdown for donut
  const statusSegments = [
    { label: "In Progress", value: tasks.filter((t) => t.status === "In Progress").length, color: STATUS_COLOR["In Progress"] },
    { label: "Not Started", value: tasks.filter((t) => t.status === "Not Started").length, color: STATUS_COLOR["Not Started"] },
    { label: "Waiting",     value: tasks.filter((t) => t.status === "Waiting").length,     color: STATUS_COLOR["Waiting"] },
    { label: "Completed",   value: tasks.filter((t) => t.status === "Completed").length,   color: STATUS_COLOR["Completed"] },
  ];

  // Summary stats
  const stats = [
    { label: "Active Clients",  value: clients.filter((c) => c.relationship_status === "Active").length, color: "bg-indigo-50 text-indigo-700", dot: "bg-indigo-500" },
    { label: "Active Projects", value: projects.filter((p) => p.status === "Active").length,             color: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
    { label: "Due Today",       value: todayTasks.length,  color: "bg-amber-50 text-amber-700",   dot: "bg-amber-500" },
    { label: "Overdue",         value: overdueTasks.length, color: "bg-red-50 text-red-700",      dot: "bg-red-500" },
  ];

  return (
    <div className="space-y-6">

      {/* Welcome banner */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-heading text-gray-900">
              Welcome back, <span className="capitalize">{userName}</span>!
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedClientId ? "Filtered by selected client · " : "All clients · "}
              {format(new Date(), "EEEE, d MMMM yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/tasks"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Task
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ label, value, color, dot }) => (
          <div key={label} className={cn("rounded-xl px-4 py-3 flex items-center gap-3", color)}>
            <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", dot)} />
            <div>
              <p className="text-xl font-bold leading-tight">{value}</p>
              <p className="text-xs opacity-70">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main 3-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Active Projects */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Active Projects</h2>
            <Link href="/projects" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {activeProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <TrendingUp className="h-8 w-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No active projects</p>
              <Link href="/projects" className="text-xs text-indigo-600 mt-1 hover:underline">Create one</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeProjects.map((p, i) => (
                <ProjectCard key={p.id} project={p} accent={PROJECT_ACCENTS[i % PROJECT_ACCENTS.length]} />
              ))}
            </div>
          )}
        </div>

        {/* Today's Tasks */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Today's Tasks</h2>
            <Link href="/tasks" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              All tasks <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {overdueTasks.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-semibold text-red-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Overdue ({overdueTasks.length})
              </p>
              {overdueTasks.slice(0, 2).map((t) => (
                <TaskRow key={t.id} task={t} highlight="bg-red-50" />
              ))}
            </div>
          )}

          {todayTasks.length > 0 ? (
            <div>
              <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Due Today ({todayTasks.length})
              </p>
              {todayTasks.slice(0, 4).map((t) => (
                <TaskRow key={t.id} task={t} highlight="bg-amber-50/60" />
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Nothing due today 🎉</p>
            </div>
          )}

          {todayTasks.length === 0 && overdueTasks.length === 0 && activityTasks.length > 0 && (
            <div className="mt-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Open tasks</p>
              {activityTasks.slice(0, 4).map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          )}

          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 className="h-8 w-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No tasks yet</p>
              <Link href="/tasks" className="text-xs text-indigo-600 mt-1 hover:underline">Add your first task</Link>
            </div>
          )}
        </div>

        {/* Upcoming Deadlines (calendar) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Upcoming Deadlines</h2>
            <span className="text-xs text-gray-400 font-medium">{format(new Date(), "MMMM yyyy")}</span>
          </div>
          <MiniCalendar tasks={tasks} />

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" /> Today
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Upcoming
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Overdue
            </div>
          </div>

          {/* Next few deadlines */}
          {upcomingTasks.length > 0 && (
            <div className="mt-4 space-y-2">
              {upcomingTasks.slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-center gap-3 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-amber-400" />
                  <span className="flex-1 truncate text-gray-700">{t.title}</span>
                  <span className="text-gray-400 shrink-0">{format(parseISO(t.due_date!), "d MMM")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: status breakdown + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Task status bars (spans 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-800">Tasks Overview</h2>
            <Link href="/tasks" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {Object.entries(STATUS_COLOR).map(([status, color]) => {
              const count = tasks.filter((t) => t.status === status).length;
              const pct = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24 shrink-0">{status}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>

          {tasks.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No tasks to display</p>
          )}
        </div>

        {/* Donut breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-5">Task Status</h2>
          <div className="flex items-center gap-4">
            <DonutChart segments={statusSegments} />
            <div className="space-y-2">
              {statusSegments.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-gray-500 truncate">{s.label}</span>
                  <span className="text-xs font-semibold text-gray-700 ml-auto">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
