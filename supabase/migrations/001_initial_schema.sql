-- ─────────────────────────────────────────────────────────────
-- USG Operations Workspace — Initial Schema
-- ─────────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin', 'staff')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Clients ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_name    TEXT NOT NULL,
  organisation_type    TEXT,
  industry             TEXT,
  main_contact_name    TEXT,
  email                TEXT,
  phone                TEXT,
  account_owner        TEXT,
  team_members         TEXT[] NOT NULL DEFAULT '{}',
  relationship_status  TEXT NOT NULL DEFAULT 'Active'
                         CHECK (relationship_status IN ('Active','Inactive','Prospect','On Hold','Churned')),
  contract_start_date  DATE,
  contract_end_date    DATE,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Projects ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_name        TEXT NOT NULL,
  client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  description         TEXT,
  project_type        TEXT,
  status              TEXT NOT NULL DEFAULT 'Planning'
                        CHECK (status IN ('Planning','Active','On Hold','Completed','Cancelled')),
  priority            TEXT NOT NULL DEFAULT 'Medium'
                        CHECK (priority IN ('Low','Medium','High','Critical')),
  start_date          DATE,
  end_date            DATE,
  project_owner       TEXT,
  team_members        TEXT[] NOT NULL DEFAULT '{}',
  budget              NUMERIC(12,2),
  revenue             NUMERIC(12,2),
  estimated_expenses  NUMERIC(12,2),
  actual_expenses     NUMERIC(12,2),
  margin              NUMERIC(12,2),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tasks ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title               TEXT NOT NULL,
  description         TEXT,
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id           UUID REFERENCES clients(id) ON DELETE SET NULL,
  assignee            TEXT,
  created_by          TEXT,
  due_date            DATE,
  start_date          DATE,
  reminder_date       DATE,
  priority            TEXT NOT NULL DEFAULT 'Medium'
                        CHECK (priority IN ('Low','Medium','High','Critical')),
  status              TEXT NOT NULL DEFAULT 'Not Started'
                        CHECK (status IN ('Not Started','In Progress','Waiting','Completed','Cancelled')),
  tags                TEXT[] NOT NULL DEFAULT '{}',
  follow_up_notes     TEXT,
  is_recurring        BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_pattern  TEXT,
  parent_task_id      UUID REFERENCES tasks(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Task Comments ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  author     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Attachments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attachments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  file_size   INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── updated_at triggers ─────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER clients_updated_at  BEFORE UPDATE ON clients  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tasks_updated_at    BEFORE UPDATE ON tasks    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Row Level Security ──────────────────────────────────────
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments  ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read/write everything (internal tool)
CREATE POLICY "auth_all" ON profiles     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON clients      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON projects     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON tasks        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON task_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON attachments  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Storage bucket for attachments ─────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "auth_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "auth_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'attachments');

CREATE POLICY "auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'attachments');
