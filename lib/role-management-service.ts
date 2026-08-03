import { createAdminSupabaseClient } from '@/lib/supabase-admin';

type RoleUpdateBody = {
  name?: string;
  description?: string | null;
  permissions?: Record<string, boolean>;
  hierarchy_level?: number;
  department_id?: string | null;
  [key: string]: unknown;
};

async function updateRole(roleId: string, body: RoleUpdateBody) {
  const client = createAdminSupabaseClient();
  if (!client) return null;

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.description !== undefined) updates.description = body.description;
  if (body.permissions !== undefined) updates.permissions = body.permissions;
  if (body.hierarchy_level !== undefined) updates.hierarchy_level = body.hierarchy_level;
  if (body.department_id !== undefined) updates.department_id = body.department_id;

  if (Object.keys(updates).length === 0) {
    const { data } = await client.from('roles').select('*').eq('id', roleId).maybeSingle();
    return data;
  }

  const { data, error } = await client
    .from('roles')
    .update(updates)
    .eq('id', roleId)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('roleManagementService.updateRole', error);
    return null;
  }

  return data;
}

export const roleManagementService = {
  updateRole,
};
