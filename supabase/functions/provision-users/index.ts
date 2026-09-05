import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const admin = createClient(supabaseUrl, serviceRoleKey)

Deno.serve(async () => {
  const { data: jobs, error } = await admin
    .from('user_provisioning_queue')
    .select('id, username, hub_id, role, active, initial_password')
    .eq('status', 'pending')
    .order('created_at')
    .limit(25)

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  let completed = 0
  for (const job of jobs ?? []) {
    await admin.from('user_provisioning_queue').update({ status: 'processing', error_message: null }).eq('id', job.id)
    try {
      const email = `${job.username.toLowerCase()}@transport-schedule.local`
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: job.initial_password,
        email_confirm: true,
        user_metadata: { username: job.username },
      })
      if (createError) throw createError
      const { error: profileError } = await admin.from('profiles').insert({
        id: created.user.id,
        username: job.username,
        hub_id: job.hub_id,
        role: job.role,
        active: job.active,
        must_change_password: true,
      })
      if (profileError) {
        await admin.auth.admin.deleteUser(created.user.id)
        throw profileError
      }
      await admin.from('user_provisioning_queue').update({ status: 'completed', auth_user_id: created.user.id, processed_at: new Date().toISOString() }).eq('id', job.id)
      completed++
    } catch (e) {
      await admin.from('user_provisioning_queue').update({ status: 'failed', error_message: e instanceof Error ? e.message : String(e), processed_at: new Date().toISOString() }).eq('id', job.id)
    }
  }
  return new Response(JSON.stringify({ processed: completed, total: jobs?.length ?? 0 }), { headers: { 'content-type': 'application/json' } })
})
