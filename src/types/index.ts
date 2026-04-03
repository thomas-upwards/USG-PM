// ─── Shared ──────────────────────────────────────────────────────────────────

export type Priority = "Low" | "Medium" | "High" | "Critical";

// ─── Clients ─────────────────────────────────────────────────────────────────

export type RelationshipStatus =
  | "Active"
  | "Inactive"
  | "Prospect"
  | "On Hold"
  | "Churned";

export interface Client {
  id: string;
  organisation_name: string;
  organisation_type: string | null;
  industry: string | null;
  main_contact_name: string | null;
  email: string | null;
  phone: string | null;
  account_owner: string | null;
  team_members: string[];
  relationship_status: RelationshipStatus;
  contract_start_date: string | null;
  contract_end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ClientInsert = Omit<Client, "id" | "created_at" | "updated_at">;
export type ClientUpdate = Partial<ClientInsert>;

// ─── Projects ────────────────────────────────────────────────────────────────

export type ProjectStatus =
  | "Planning"
  | "Active"
  | "On Hold"
  | "Completed"
  | "Cancelled";

export interface Project {
  id: string;
  project_name: string;
  client_id: string;
  client_name?: string;
  description: string | null;
  project_type: string | null;
  status: ProjectStatus;
  priority: Priority;
  start_date: string | null;
  end_date: string | null;
  project_owner: string | null;
  team_members: string[];
  budget: number | null;
  revenue: number | null;
  estimated_expenses: number | null;
  actual_expenses: number | null;
  margin: number | null;
  created_at: string;
  updated_at: string;
}

export type ProjectInsert = Omit<
  Project,
  "id" | "created_at" | "updated_at" | "client_name"
>;
export type ProjectUpdate = Partial<ProjectInsert>;

// ─── Tasks ───────────────────────────────────────────────────────────────────

export type TaskStatus =
  | "Not Started"
  | "In Progress"
  | "Waiting"
  | "Completed"
  | "Cancelled";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  project_id: string;
  project_name?: string;
  client_id: string | null;
  client_name?: string;
  assignee: string | null;
  created_by: string | null;
  due_date: string | null;
  start_date: string | null;
  reminder_date: string | null;
  priority: Priority;
  status: TaskStatus;
  tags: string[];
  follow_up_notes: string | null;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  parent_task_id: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  subtasks?: Task[];
  comments?: TaskComment[];
  attachments?: Attachment[];
}

export type TaskInsert = Omit<
  Task,
  | "id"
  | "created_at"
  | "updated_at"
  | "project_name"
  | "client_name"
  | "subtasks"
  | "comments"
  | "attachments"
>;
export type TaskUpdate = Partial<TaskInsert>;

export interface TaskComment {
  id: string;
  task_id: string;
  content: string;
  author: string | null;
  created_at: string;
}

export interface Attachment {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  created_at: string;
}

// ─── Users / Profiles ────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: "super_admin" | "staff";
  avatar_url: string | null;
  created_at: string;
}
