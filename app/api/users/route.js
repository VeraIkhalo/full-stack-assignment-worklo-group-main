const { NextResponse } = require('next/server');
const { createApiSupabaseClient, createAdminSupabaseClient } = require('@/lib/supabase-server');
const { requireAuthAndPermission, handleGuardError } = require('@/lib/server-guards');
const { Permission } = require('@/lib/permissions');
const { logger } = require('@/lib/debug-logger');

function normalizeSearch(search) {
  if (typeof search !== 'string') return '';
  return search.trim().replace(/\s+/g, ' ');
}

async function GET(request) {
  try {
    await requireAuthAndPermission(Permission.MANAGE_USERS, {}, request);

    const supabase = createApiSupabaseClient(request);
    const adminClient = createAdminSupabaseClient();
    if (!supabase || !adminClient) {
      logger.error('Supabase not configured', { action: 'getUsers' });
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const search = normalizeSearch(request.nextUrl?.searchParams?.get('search'));
    let query = supabase
      .from('user_profiles')
      .select(
        `
        id,
        name,
        email,
        image,
        user_roles!user_id(
          id,
          removed_at,
          roles!role_id(
            id,
            name,
            department_id,
            departments(
              id,
              name
            )
          )
        )
      `,
      )
      .order('name');

    if (search) {
      const safeSearch = search.replace(/'/g, "''");
      query = query.or(`name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`);
    }

    const { data: profiles, error } = await query;

    if (error) {
      logger.error('Error fetching users', { action: 'getUsers' }, error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const users = (profiles || [])
      .filter((profile) => (profile.user_roles || []).some((roleAssignment) => !roleAssignment.removed_at))
      .map((profile) => {
        const activeRoles = (profile.user_roles || []).filter((roleAssignment) => !roleAssignment.removed_at);
        const roles = activeRoles.map((roleAssignment) => {
          const role = roleAssignment.roles;
          if (!role) return 'Unknown role';
          return role.departments?.name ? `${role.name} (${role.departments.name})` : role.name;
        });

        return {
          id: profile.id,
          name: profile.name || 'Unnamed user',
          email: profile.email || '',
          image: profile.image || null,
          roles,
        };
      });

    return NextResponse.json({ users });
  } catch (error) {
    return handleGuardError(error);
  }
}

async function PATCH(request) {
  try {
    await requireAuthAndPermission(Permission.MANAGE_USERS, {}, request);

    const supabase = createApiSupabaseClient(request);
    const adminClient = createAdminSupabaseClient();
    if (!supabase || !adminClient) {
      logger.error('Supabase not configured', { action: 'softRemoveUser' });
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    let payload = {};
    try {
      payload = await request.json();
    } catch {
      payload = {};
    }

    const userId = payload.userId || payload.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data: activeRoles, error: lookupError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .is('removed_at', null);

    if (lookupError) {
      logger.error('Error checking active roles for soft removal', { action: 'softRemoveUser' }, lookupError);
      return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 });
    }

    if (!activeRoles?.length) {
      return NextResponse.json({ success: true, alreadyRemoved: true });
    }

    const { error: updateError } = await adminClient
      .from('user_roles')
      .update({ removed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('removed_at', null);

    if (updateError) {
      logger.error('Error soft-removing user roles', { action: 'softRemoveUser' }, updateError);
      return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 });
    }

    return NextResponse.json({ success: true, removed: true });
  } catch (error) {
    return handleGuardError(error);
  }
}

// CommonJS exports
exports.GET = GET;
exports.PATCH = PATCH;
