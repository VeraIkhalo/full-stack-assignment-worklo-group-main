import { createAdminSupabaseClient } from '@/lib/supabase-admin';

export type Department = {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type DepartmentMetrics = {
  id: string;
  name: string;
  description?: string | null;
  activeProjects: number;
  teamSize: number;
  capacityUtilization: number;
  projectHealth: {
    healthy: number;
    atRisk: number;
    critical: number;
  };
  workloadDistribution: unknown[];
  recentProjects: unknown[];
};

async function getAllDepartments(): Promise<Department[]> {
  const client = createAdminSupabaseClient();
  if (!client) return [];

  const { data, error } = await client.from('departments').select('*').order('name');
  if (error) {
    console.error('serverDepartmentService.getAllDepartments', error);
    return [];
  }
  return (data as Department[]) || [];
}

async function getDepartmentById(id: string): Promise<Department | null> {
  const client = createAdminSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.from('departments').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error('serverDepartmentService.getDepartmentById', error);
    return null;
  }
  return (data as Department) || null;
}

async function getDepartmentMetrics(id: string): Promise<DepartmentMetrics | null> {
  const department = await getDepartmentById(id);
  if (!department) return null;

  const client = createAdminSupabaseClient();
  if (!client) {
    return {
      id: department.id,
      name: department.name,
      description: department.description,
      activeProjects: 0,
      teamSize: 0,
      capacityUtilization: 0,
      projectHealth: { healthy: 0, atRisk: 0, critical: 0 },
      workloadDistribution: [],
      recentProjects: [],
    };
  }

  const { data: projects } = await client
    .from('projects')
    .select('id, name, status, end_date')
    .eq('department_id', id);

  const { data: roles } = await client.from('roles').select('id').eq('department_id', id);
  const roleIds = ((roles as { id: string }[]) || []).map((r) => r.id);

  let teamSize = 0;
  if (roleIds.length > 0) {
    const { data: userRoles } = await client
      .from('user_roles')
      .select('user_id')
      .in('role_id', roleIds)
      .is('removed_at', null);
    teamSize = new Set(((userRoles as { user_id: string }[]) || []).map((ur) => ur.user_id)).size;
  }

  const list = (projects as { id: string; name: string; status: string; end_date?: string | null }[]) || [];
  const now = Date.now();
  const activeProjects = list.filter((p) => p.status !== 'complete').length;
  let healthy = 0;
  let atRisk = 0;
  let critical = 0;

  for (const project of list) {
    if (project.status === 'complete') {
      healthy += 1;
      continue;
    }
    if (!project.end_date) {
      healthy += 1;
      continue;
    }
    const end = new Date(project.end_date).getTime();
    if (end < now) critical += 1;
    else if (end < now + 14 * 24 * 60 * 60 * 1000) atRisk += 1;
    else healthy += 1;
  }

  return {
    id: department.id,
    name: department.name,
    description: department.description,
    activeProjects,
    teamSize,
    capacityUtilization: 0,
    projectHealth: { healthy, atRisk, critical },
    workloadDistribution: [],
    recentProjects: list.slice(0, 5),
  };
}

async function getDepartmentProjects(id: string): Promise<unknown[]> {
  const client = createAdminSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('department_id', id)
    .order('name');

  if (error) {
    console.error('serverDepartmentService.getDepartmentProjects', error);
    return [];
  }
  return data || [];
}

export const serverDepartmentService = {
  getAllDepartments,
  getDepartmentById,
  getDepartmentMetrics,
  getDepartmentProjects,
};
