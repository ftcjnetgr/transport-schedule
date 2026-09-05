import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

function App() {
  return (
    <main className="shell">
      <section className="card">
        <span className="eyebrow">TRANSPORT SCHEDULE</span>
        <h1>Siap berangkat?</h1>
        <p>Fondasi aplikasi sudah aktif. Login, schedule, order, dan konfirmasi akan dibangun di tahap berikutnya.</p>
        <div className="status">Phase 1 · App shell ready</div>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
