const { NextResponse } = require('next/server');
const { createAdminSupabaseClient } = require('@/lib/supabase-server');
const { isFirstRun } = require('@/lib/onboarding/setup-token');

async function POST(request) {
  const firstRun = await isFirstRun();
  if (!firstRun) {
    return NextResponse.json({ error: 'Setup already completed' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.password || !body?.name) {
    return NextResponse.json(
      { error: 'Email, password, and name are required' },
      { status: 400 },
    );
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { name: body.name },
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message || 'Failed to create user' },
      { status: 500 },
    );
  }

  const userId = authData.user.id;

  const { error: profileError } = await supabase.from('user_profiles').upsert({
    id: userId,
    email: body.email,
    name: body.name,
    is_superadmin: true,
    has_completed_onboarding: false,
  });

  if (profileError) {
    console.error('Profile creation error:', profileError);
  }

  const { error: roleError } = await supabase.from('user_roles').insert({
    user_id: userId,
    role_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    assigned_by: userId,
  });

  if (roleError) {
    console.error('Role assignment error:', roleError);
  }

  await supabase.from('onboarding_state').insert({
    user_id: userId,
    tutorial_completed: false,
    tutorial_step: 0,
  });

  return NextResponse.json({
    success: true,
    message: 'Superadmin account created successfully',
    user: { id: userId, email: body.email, name: body.name },
  });
}

exports.POST = POST;
