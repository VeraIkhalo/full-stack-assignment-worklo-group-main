/**
 * Task types used by task dialogs and API routes.
 * Row shape mirrors the `tasks` table in supabase/schema.sql.
 */
export type Task = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'blocked' | string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | string;
  start_date: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  assigned_to: string | null;
  created_at?: string;
  updated_at?: string;
};

export type UpdateTaskData = Partial<
  Pick<
    Task,
    | 'name'
    | 'description'
    | 'status'
    | 'priority'
    | 'start_date'
    | 'due_date'
    | 'estimated_hours'
    | 'assigned_to'
  >
>;
