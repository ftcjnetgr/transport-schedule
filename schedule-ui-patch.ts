import type { Plugin } from 'vite'

const filterMarkup = `<section className="schedule-filters"><div className="category-filter"><span className="filter-label">Tipe perjalanan</span><div className="filter-chips">{(['Normal','Campaign'] as const).map(category=><button key={category} className={categoryFilter===category?'active':''} onClick={()=>setCategoryFilter(category)}>{category}</button>)}</div></div><div className="route-filter"><span className="filter-label">Rute</span><div className="route-tabs">{(['interhub','transit','direct'] as const).map(route=><button key={route} className={routeFilter===route?'active':''} onClick={()=>setRouteFilter(route)}>{route==='interhub'?'Interhub':route==='transit'?'Transit':'Direct'}</button>)}</div></div></section>`

export default function scheduleUiPatch(): Plugin {
  return {
    name: 'schedule-ui-patch',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/main.tsx')) return null

      let out = code

      const oldState = "const[dateFilter,setDateFilter]=useState<DateFilter>('today');const[categoryFilter,setCategoryFilter]=useState<'all'|'Normal'|'Campaign'>('all')"
      const newState = "const[routeFilter,setRouteFilter]=useState<'interhub'|'transit'|'direct'>('interhub');const[categoryFilter,setCategoryFilter]=useState<'Normal'|'Campaign'>('Normal')"
      const stateIndex = out.indexOf(oldState)
      if (stateIndex >= 0) out = out.slice(0, stateIndex) + newState + out.slice(stateIndex + oldState.length)

      const visibleStart = out.indexOf('  const visibleSchedules=useMemo')
      if (visibleStart >= 0) {
        const visibleEnd = out.indexOf('\n', visibleStart)
        if (visibleEnd >= 0) {
          const newVisible = "  const visibleSchedules=useMemo(()=>schedules.filter(s=>(s.route??'').toLowerCase()===routeFilter&&(categoryName(s.category)===categoryFilter)),[schedules,routeFilter,categoryFilter])"
          out = out.slice(0, visibleStart) + newVisible + out.slice(visibleEnd)
        }
      }

      const markupStart = out.indexOf('<section className="schedule-filters">')
      if (markupStart >= 0) {
        const markupEnd = out.indexOf('</section>', markupStart)
        if (markupEnd >= 0) out = out.slice(0, markupStart) + filterMarkup + out.slice(markupEnd + '</section>'.length)
      }

      out = out.replaceAll('Mau berangkat kapan?', 'Cari jadwal yang pas')
      out = out.replaceAll('Pilih hari dan tipe schedule yang mau kamu lihat.', 'Pilih tipe perjalanan dan rute yang kamu butuhkan.')
      if (out === code) return null
      return { code: out, map: null }
    },
  }
}
