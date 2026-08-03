import { createAdminSupabaseClient } from '@/lib/supabase-admin';

export type PendingUser = {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  approval_requested_at: string;
  bio?: string | null;
  skills?: string | null;
};

export type ApprovalStats = {
  total_pending: number;
  total_approved: number;
  total_rejected: number;
  pending_by_date: Record<string, number>;
};

async function getPendingUsers(): Promise<PendingUser[]> {
  const client = createAdminSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('pending_user_approvals')
    .select(
      `
      created_at,
      user_id,
      user_profiles!pending_user_approvals_user_id_fkey (
        id,
        name,
        email,
        image
      )
    `,
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('userApprovalService.getPendingUsers', error);
    return [];
  }

  return ((data as any[]) || [])
    .map((row) => {
      const profile = Array.isArray(row.user_profiles) ? row.user_profiles[0] : row.user_profiles;
      if (!profile) return null;
      return {
        id: profile.id as string,
        name: profile.name as string | null,
        email: profile.email as string,
        image: profile.image as string | null,
        approval_requested_at: row.created_at as string,
      } satisfies PendingUser;
    })
    .filter(Boolean) as PendingUser[];
}

async function getApprovalStats(): Promise<ApprovalStats> {
  const client = createAdminSupabaseClient();
  const empty: ApprovalStats = {
    total_pending: 0,
    total_approved: 0,
    total_rejected: 0,
    pending_by_date: {},
  };
  if (!client) return empty;

  const { data, error } = await client.from('pending_user_approvals').select('status, created_at');
  if (error) {
    console.error('userApprovalService.getApprovalStats', error);
    return empty;
  }

  const pending_by_date: Record<string, number> = {};
  let total_pending = 0;
  let total_approved = 0;
  let total_rejected = 0;

  for (const row of (data as { status: string; created_at: string }[]) || []) {
    if (row.status === 'pending') {
      total_pending += 1;
      const day = row.created_at.slice(0, 10);
      pending_by_date[day] = (pending_by_date[day] || 0) + 1;
    } else if (row.status === 'approved') {
      total_approved += 1;
    } else if (row.status === 'rejected') {
      total_rejected += 1;
    }
  }

  return { total_pending, total_approved, total_rejected, pending_by_date };
}

async function approveUser(
  userId: string,
  approverId: string,
  _reason?: string,
): Promise<boolean> {
  const client = createAdminSupabaseClient();
  if (!client) return false;

  const { error } = await client
    .from('pending_user_approvals')
    .update({
      status: 'approved',
      reviewed_by: approverId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('status', 'pending');

  if (error) {
    console.error('userApprovalService.approveUser', error);
    return false;
  }
  return true;
}

async function rejectUser(
  userId: string,
  rejectorId: string,
  _reason?: string,
): Promise<boolean> {
  const client = createAdminSupabaseClient();
  if (!client) return false;

  const { error } = await client
    .from('pending_user_approvals')
    .update({
      status: 'rejected',
      reviewed_by: rejectorId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('status', 'pending');

  if (error) {
    console.error('userApprovalService.rejectUser', error);
    return false;
  }
  return true;
}

async function bulkApproveUsers(
  userIds: string[],
  approverId: string,
  reason?: string,
): Promise<{ successful: string[]; failed: string[] }> {
  const successful: string[] = [];
  const failed: string[] = [];

  for (const userId of userIds) {
    const ok = await approveUser(userId, approverId, reason);
    if (ok) successful.push(userId);
    else failed.push(userId);
  }

  return { successful, failed };
}

async function isUserApproved(userId: string): Promise<boolean> {
  const client = createAdminSupabaseClient();
  if (!client) return false;

  const { data } = await client
    .from('pending_user_approvals')
    .select('status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // No pending approval row means the user is allowed through
  if (!data) return true;
  return data.status === 'approved';
}

async function requestApproval(userId: string): Promise<boolean> {
  const client = createAdminSupabaseClient();
  if (!client) return false;

  const { data: existing } = await client
    .from('pending_user_approvals')
    .select('id, status')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) return true;

  const { error } = await client.from('pending_user_approvals').insert({
    user_id: userId,
    status: 'pending',
  });

  if (error) {
    console.error('userApprovalService.requestApproval', error);
    return false;
  }
  return true;
}

export const userApprovalService = {
  getPendingUsers,
  getApprovalStats,
  approveUser,
  rejectUser,
  bulkApproveUsers,
  isUserApproved,
  requestApproval,
};
