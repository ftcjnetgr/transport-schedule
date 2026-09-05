import { FormEvent, StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { LogOut, MapPin, RefreshCw, Truck } from 'lucide-react'
import { supabase, usernameToEmail } from './lib/supabase'
import './styles.css'

type Profile = {
  id: string
  username: string
  hub_id: number | null
  role: 'User' | 'Controller' | 'Super User'
  active: boolean
}

type Schedule = {
  id: number
  schedule_id: string
  start_point_3lc: string
  destination_3lc: string
  start_point: string
  destination: string
  std: string
  sta: string
  route: string | null
  category: string | null
}

function Login({ onLoggedIn }: { onLoggedIn: (profile: Profile) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    })

    if (signInError) {
      setError('ID atau password belum cocok. Coba lagi.')
      setBusy(false)
      return
    }

    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, hub_id, role, active')
      .single()

    if (profileError || !data?.active) {
      await supabase.auth.signOut()
      setError('Akun belum aktif atau profil belum terdaftar.')
      setBusy(false)
      return
    }

    onLoggedIn(data as Profile)
    setBusy(false)
  }

  return (
    <main className="shell">
      <section className="auth-card">
        <div className="brand-mark"><Truck size={22} /></div>
        <span className="eyebrow">TRANSPORT SCHEDULE</span>
        <h1>Siap berangkat?</h1>
        <p className="muted">Masuk untuk lihat schedule dan buat order perjalanan.</p>
        <form onSubmit={submit} className="form-stack">
          <label>
            ID
            <input value={username} onChange={(e) => setUsername(e.target.value.toUpperCase())} placeholder="Contoh: GPX" autoComplete="username" required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan password" autoComplete="current-password" required />
          </label>
          {error && <div className="error">{error}</div>}
          <button className="primary" disabled={busy}>{busy ? 'Memeriksa…' : 'Masuk'}</button>
        </form>
        <div className="hint">Password pertama dibuat saat akun diaktifkan oleh Super User.</div>
      </section>
    </main>
  )
}

function Dashboard({ profile, onLogout }: { profile: Profile; onLogout: () => void }) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const hubLabel = useMemo(() => {
    if (profile.role !== 'User' || !profile.hub_id) return 'All Area'
    return `Hub #${profile.hub_id}`
  }, [profile])

  async function loadSchedules() {
    setLoading(true)
    setError('')
    const { data, error: queryError } = await supabase
      .from('schedules')
      .select('id, schedule_id, start_point_3lc, destination_3lc, start_point, destination, std, sta, route, category')
      .eq('active', true)
      .order('std')

    if (queryError) setError(queryError.message)
    setSchedules((data ?? []) as Schedule[])
    setLoading(false)
  }

  useEffect(() => { void loadSchedules() }, [])

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">TRANSPORT SCHEDULE</span>
          <div className="top-title">Halo, {profile.username} 👋</div>
        </div>
        <div className="top-actions">
          <span className="role-pill">{profile.role} · {hubLabel}</span>
          <button className="icon-button" onClick={() => void loadSchedules()} title="Refresh"><RefreshCw size={18} /></button>
          <button className="icon-button" onClick={onLogout} title="Keluar"><LogOut size={18} /></button>
        </div>
      </header>

      <section className="hero-row">
        <div>
          <div className="eyebrow">TODAY'S RUN</div>
          <h1>Pilih schedule</h1>
          <p className="muted">Schedule yang tampil sudah mengikuti akses hub akun lo.</p>
        </div>
        <div className="hero-chip"><MapPin size={17} /> Hub-scoped</div>
      </section>

      {error && <div className="error wide">Gagal memuat schedule: {error}</div>}
      {loading ? <div className="empty">Memuat schedule…</div> : schedules.length === 0 ? <div className="empty">Belum ada schedule yang bisa di-order.</div> : (
        <div className="schedule-grid">
          {schedules.map((schedule) => (
            <article className="schedule-card" key={schedule.id}>
              <div className="schedule-head">
                <div>
                  <span className="schedule-id">{schedule.schedule_id}</span>
                  <div className="route-code">{schedule.start_point_3lc} <span>→</span> {schedule.destination_3lc}</div>
                </div>
                <span className="category">{schedule.category ?? 'Regular'}</span>
              </div>
              <div className="location-row">
                <div><small>START</small><strong>{schedule.start_point}</strong></div>
                <div><small>DESTINATION</small><strong>{schedule.destination}</strong></div>
              </div>
              <div className="time-row">
                <div><small>STD</small><b>{schedule.std?.slice(0, 5)}</b></div>
                <div><small>STA</small><b>{schedule.sta?.slice(0, 5)}</b></div>
                <button className="primary small" onClick={() => alert(`Order untuk ${schedule.schedule_id} akan dibangun berikutnya.`)}>Order</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}

function App() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const { data: currentProfile } = await supabase.from('profiles').select('id, username, hub_id, role, active').single()
        if (currentProfile?.active) setProfile(currentProfile as Profile)
      }
      setChecking(false)
    })
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  if (checking) return <main className="shell"><div className="loading-card">Menyiapkan aplikasi…</div></main>
  return profile ? <Dashboard profile={profile} onLogout={logout} /> : <Login onLoggedIn={setProfile} />
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
