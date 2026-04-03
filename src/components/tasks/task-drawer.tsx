"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Pencil,
  Plus,
  Send,
  Paperclip,
  RefreshCw,
  Calendar,
  User,
  Bell,
  Tag,
  MessageSquare,
  CheckSquare,
} from "lucide-react";
import { useTask, useUpdateTask, useAddComment, useCreateTask } from "@/hooks/useTasks";
import { TaskForm, type TaskFormValues } from "./task-form";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { format, parseISO } from "date-fns";

interface Props {
  taskId: string | null;
  onClose: () => void;
  userEmail?: string | null;
}

export function TaskDrawer({ taskId, onClose, userEmail }: Props) {
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState("");
  const { data: task, isLoading } = useTask(taskId ?? undefined);
  const updateTask = useUpdateTask();
  const addComment = useAddComment();
  const createSubtask = useCreateTask();

  async function handleEdit(values: TaskFormValues) {
    if (!taskId) return;
    await updateTask.mutateAsync({
      id: taskId,
      ...values,
      description: values.description || null,
      assignee: values.assignee || null,
      due_date: values.due_date || null,
      start_date: values.start_date || null,
      reminder_date: values.reminder_date || null,
      follow_up_notes: values.follow_up_notes || null,
      recurrence_pattern: values.recurrence_pattern || null,
      tags: values.tags
        ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    });
    setEditing(false);
  }

  async function handleAddComment() {
    if (!taskId || !comment.trim()) return;
    await addComment.mutateAsync({
      taskId,
      content: comment.trim(),
      author: userEmail ?? null,
    });
    setComment("");
  }

  async function handleAddSubtask() {
    if (!task) return;
    const title = prompt("Subtask title:");
    if (!title?.trim()) return;
    await createSubtask.mutateAsync({
      title: title.trim(),
      project_id: task.project_id,
      client_id: task.client_id,
      parent_task_id: task.id,
      priority: "Medium",
      status: "Not Started",
      tags: [],
      is_recurring: false,
      description: null,
      assignee: null,
      created_by: userEmail ?? null,
      due_date: null,
      start_date: null,
      reminder_date: null,
      recurrence_pattern: null,
      follow_up_notes: null,
    });
  }

  return (
    <Sheet open={!!taskId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[55vw] sm:max-w-none p-0 flex flex-col"
      >
        {isLoading || !task ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : editing ? (
          <div className="p-6 overflow-y-auto flex-1">
            <SheetHeader className="mb-4">
              <SheetTitle>Edit Task</SheetTitle>
            </SheetHeader>
            <TaskForm
              defaultValues={task}
              onSubmit={handleEdit}
              loading={updateTask.isPending}
              submitLabel="Save changes"
            />
            <Button
              variant="ghost"
              className="mt-2"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 pb-4 border-b shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <SheetTitle className="text-xl leading-tight">
                    {task.title}
                  </SheetTitle>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                    {task.is_recurring && (
                      <Badge variant="secondary" className="gap-1">
                        <RefreshCw className="h-3 w-3" />
                        {task.recurrence_pattern ?? "Recurring"}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                  className="shrink-0"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-5">
                {/* Meta */}
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {task.project_name && (
                    <div>
                      <dt className="text-muted-foreground">Project</dt>
                      <dd className="font-medium mt-0.5">{task.project_name}</dd>
                    </div>
                  )}
                  {task.client_name && (
                    <div>
                      <dt className="text-muted-foreground">Client</dt>
                      <dd className="font-medium mt-0.5">{task.client_name}</dd>
                    </div>
                  )}
                  {task.assignee && (
                    <div>
                      <dt className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-3.5 w-3.5" /> Assignee
                      </dt>
                      <dd className="font-medium mt-0.5">{task.assignee}</dd>
                    </div>
                  )}
                  {task.due_date && (
                    <div>
                      <dt className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" /> Due
                      </dt>
                      <dd className="font-medium mt-0.5">
                        {format(parseISO(task.due_date), "d MMM yyyy")}
                      </dd>
                    </div>
                  )}
                  {task.start_date && (
                    <div>
                      <dt className="text-muted-foreground">Start</dt>
                      <dd className="font-medium mt-0.5">
                        {format(parseISO(task.start_date), "d MMM yyyy")}
                      </dd>
                    </div>
                  )}
                  {task.reminder_date && (
                    <div>
                      <dt className="flex items-center gap-1 text-muted-foreground">
                        <Bell className="h-3.5 w-3.5" /> Reminder
                      </dt>
                      <dd className="font-medium mt-0.5">
                        {format(parseISO(task.reminder_date), "d MMM yyyy")}
                      </dd>
                    </div>
                  )}
                </dl>

                {task.description && (
                  <>
                    <Separator />
                    <p className="text-sm whitespace-pre-wrap">{task.description}</p>
                  </>
                )}

                {task.tags && task.tags.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      {task.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}

                {task.follow_up_notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                        Follow-up Notes
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{task.follow_up_notes}</p>
                    </div>
                  </>
                )}

                {/* Subtasks */}
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <CheckSquare className="h-3.5 w-3.5" />
                      Subtasks ({task.subtasks?.length ?? 0})
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleAddSubtask}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  {(task.subtasks ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No subtasks.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {(task.subtasks ?? []).map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center gap-2 p-2 rounded border bg-muted/30 text-sm"
                        >
                          <StatusBadge status={sub.status} />
                          <span className="flex-1 truncate">{sub.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Comments */}
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-3">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Comments ({task.comments?.length ?? 0})
                  </p>
                  <div className="space-y-3 mb-3">
                    {(task.comments ?? []).map((c) => (
                      <div key={c.id} className="text-sm">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-xs">
                            {c.author ?? "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(c.created_at), "d MMM, h:mm a")}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{c.content}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a comment…"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleAddComment}
                      disabled={!comment.trim() || addComment.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Attachments placeholder */}
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <Paperclip className="h-3.5 w-3.5" />
                    Attachments ({task.attachments?.length ?? 0})
                  </p>
                  {(task.attachments ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No attachments.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {(task.attachments ?? []).map((a) => (
                        <a
                          key={a.id}
                          href={a.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          {a.file_name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
