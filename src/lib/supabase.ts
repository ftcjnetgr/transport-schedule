import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are missing.')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Route password changes through the server-side Edge Function so the first-login
// password flow does not depend on the browser Auth update path.
const nativeUpdateUser = supabase.auth.updateUser.bind(supabase.auth)
;(supabase.auth as any).updateUser = async (attributes: any, options?: any) => {
  if (attributes?.password) {
    const { data, error } = await supabase.functions.invoke('change-password', {
      body: { password: attributes.password },
    })
    if (error) return { data: { user: null }, error }
    if (!data?.ok) return { data: { user: null }, error: new Error(data?.error || 'Password baru belum bisa disimpan.') }
    const { data: userData } = await supabase.auth.getUser()
    return { data: { user: userData.user }, error: null }
  }
  return nativeUpdateUser(attributes, options)
}

export const usernameToEmail = (username: string) =>
  `${username.trim().toLowerCase()}@transport-schedule.local`
