import { createAdminSupabaseClient } from '@/lib/supabase-admin';

export type Account = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  primary_contact_name?: string | null;
  primary_contact_email?: string | null;
  account_manager_id?: string | null;
  created_at: string;
  updated_at?: string;
};

export type ProjectWithDetails = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  account_id?: string | null;
  department_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  [key: string]: unknown;
};

export type AccountWithProjects = Account & {
  projects: ProjectWithDetails[];
};

export type AccountMetrics = {
  healthScore: number;
  activeProjects: number;
  totalProjects: number;
  completedProjects: number;
  upcomingDeadlines: number;
  overdueProjects: number;
  pendingApprovals: number;
};

export type UrgentItem = {
  title: string;
  description: string;
  priority: string;
};

type SupabaseLike = {
  from: (table: string) => any;
} | null;

function resolveClient(supabase?: SupabaseLike) {
  return supabase ?? createAdminSupabaseClient();
}

async function getAllAccounts(supabase?: SupabaseLike): Promise<Account[]> {
  const client = resolveClient(supabase);
  if (!client) return [];

  const { data, error } = await client.from('accounts').select('*').order('name');
  if (error) {
    console.error('accountService.getAllAccounts', error);
    return [];
  }
  return (data as Account[]) || [];
}

async function getUserAccounts(userId: string, supabase?: SupabaseLike): Promise<Account[]> {
  const client = resolveClient(supabase);
  if (!client) return [];

  const { data: memberships, error: membershipError } = await client
    .from('account_members')
    .select('account_id')
    .eq('user_id', userId)
    .is('removed_at', null);

  if (membershipError) {
    console.error('accountService.getUserAccounts memberships', membershipError);
    return [];
  }

  const memberAccountIds = (memberships || []).map((m: { account_id: string }) => m.account_id);

  const { data: managed, error: managedError } = await client
    .from('accounts')
    .select('*')
    .eq('account_manager_id', userId);

  if (managedError) {
    console.error('accountService.getUserAccounts managed', managedError);
  }

  const byId = new Map<string, Account>();
  for (const account of (managed as Account[]) || []) {
    byId.set(account.id, account);
  }

  if (memberAccountIds.length > 0) {
    const { data: memberAccounts, error } = await client
      .from('accounts')
      .select('*')
      .in('id', memberAccountIds);
    if (error) {
      console.error('accountService.getUserAccounts accounts', error);
    } else {
      for (const account of (memberAccounts as Account[]) || []) {
        byId.set(account.id, account);
      }
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}

async function canUserAccessAccount(
  userId: string,
  accountId: string,
  supabase?: SupabaseLike,
): Promise<boolean> {
  const client = resolveClient(supabase);
  if (!client) return false;

  const { data: account } = await client
    .from('accounts')
    .select('id, account_manager_id')
    .eq('id', accountId)
    .maybeSingle();

  if (!account) return false;
  if (account.account_manager_id === userId) return true;

  const { data: membership } = await client
    .from('account_members')
    .select('id')
    .eq('account_id', accountId)
    .eq('user_id', userId)
    .is('removed_at', null)
    .maybeSingle();

  return !!membership;
}

async function hasFullAccountAccess(
  userId: string,
  accountId: string,
  supabase?: SupabaseLike,
): Promise<boolean> {
  const client = resolveClient(supabase);
  if (!client) return false;

  const { data: account } = await client
    .from('accounts')
    .select('account_manager_id')
    .eq('id', accountId)
    .maybeSingle();

  return account?.account_manager_id === userId;
}

async function getAccountById(
  id: string,
  _unused?: unknown,
  supabase?: SupabaseLike,
): Promise<AccountWithProjects | null> {
  const client = resolveClient(supabase);
  if (!client) return null;

  const { data: account, error } = await client.from('accounts').select('*').eq('id', id).maybeSingle();
  if (error || !account) {
    if (error) console.error('accountService.getAccountById', error);
    return null;
  }

  const { data: projects } = await client
    .from('projects')
    .select('*')
    .eq('account_id', id)
    .order('name');

  return {
    ...(account as Account),
    projects: (projects as ProjectWithDetails[]) || [],
  };
}

async function getAccountMetrics(
  accountId: string,
  supabase?: SupabaseLike,
): Promise<AccountMetrics> {
  const client = resolveClient(supabase);
  const empty: AccountMetrics = {
    healthScore: 100,
    activeProjects: 0,
    totalProjects: 0,
    completedProjects: 0,
    upcomingDeadlines: 0,
    overdueProjects: 0,
    pendingApprovals: 0,
  };

  if (!client) return empty;

  const { data: projects } = await client.from('projects').select('id, status, end_date').eq('account_id', accountId);
  const list = projects || [];
  const now = Date.now();
  const activeStatuses = new Set(['planning', 'in_progress', 'review', 'on_hold']);

  const totalProjects = list.length;
  const completedProjects = list.filter((p: { status: string }) => p.status === 'complete').length;
  const activeProjects = list.filter((p: { status: string }) => activeStatuses.has(p.status)).length;
  const overdueProjects = list.filter((p: { status: string; end_date?: string | null }) => {
    if (!p.end_date || p.status === 'complete') return false;
    return new Date(p.end_date).getTime() < now;
  }).length;
  const upcomingDeadlines = list.filter((p: { status: string; end_date?: string | null }) => {
    if (!p.end_date || p.status === 'complete') return false;
    const end = new Date(p.end_date).getTime();
    const week = 7 * 24 * 60 * 60 * 1000;
    return end >= now && end <= now + week;
  }).length;

  const healthScore = Math.max(
    0,
    Math.min(100, 100 - overdueProjects * 15 - (activeProjects > 0 ? 0 : 0)),
  );

  return {
    healthScore,
    activeProjects,
    totalProjects,
    completedProjects,
    upcomingDeadlines,
    overdueProjects,
    pendingApprovals: 0,
  };
}

async function getUrgentItems(
  accountId: string,
  supabase?: SupabaseLike,
): Promise<UrgentItem[]> {
  const client = resolveClient(supabase);
  if (!client) return [];

  const { data: projects } = await client
    .from('projects')
    .select('name, status, end_date')
    .eq('account_id', accountId);

  const now = Date.now();
  return ((projects as { name: string; status: string; end_date?: string | null }[]) || [])
    .filter((p) => p.end_date && p.status !== 'complete' && new Date(p.end_date).getTime() < now)
    .slice(0, 5)
    .map((p) => ({
      title: p.name,
      description: 'Project is past its end date',
      priority: 'high',
    }));
}

async function deleteProject(_projectId: string): Promise<boolean> {
  return false;
}

export const accountService = {
  getAllAccounts,
  getUserAccounts,
  canUserAccessAccount,
  hasFullAccountAccess,
  getAccountById,
  getAccountMetrics,
  getUrgentItems,
  deleteProject,
};
