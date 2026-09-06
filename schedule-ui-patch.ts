import type { Plugin } from 'vite'

const filterMarkup = `<section className="schedule-filters"><div className="category-filter"><span className="filter-label">Tipe perjalanan</span><div className="filter-chips">{(['Normal','Campaign'] as const).map(category=><button key={category} className={categoryFilter===category?'active':''} onClick={()=>setCategoryFilter(category)}>{category}</button>)}</div></div><div className="route-filter"><span className="filter-label">Rute</span><div className="route-tabs">{(['interhub','transit','direct'] as const).map(route=><button key={route} className={routeFilter===route?'active':''} onClick={()=>setRouteFilter(route)}>{route==='interhub'?'Interhub':route==='transit'?'Transit':'Direct'}</button>)}</div></div></section>`

export default function scheduleUiPatch(): Plugin {
  return {
    name: 'schedule-ui-patch',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/main.tsx')) return null
      let out = code
      const statePattern = /const\[dateFilter,setDateFilter\]=useState<DateFilter>\('today'\);const\[categoryFilter,setCategoryFilter\]=useState<'all'|'Normal'|'Campaign'>\('all'\)/
      const visiblePattern = /const visibleSchedules=useMemo\(\(\)=>\{const now=new Date\(\);let targetDays:number\[\];.*?\},\[schedules,dateFilter,categoryFilter,profile\.role\]\)\n  const groupedSchedules=useMemo\(\(\)=>\{.*?\},\[visibleSchedules\]\)/s
      const markupPattern = /<section className="schedule-filters">.*?<\/section>/s
      if (!statePattern.test(out) || !visiblePattern.test(out) || !markupPattern.test(out)) return null
      out = out.replace(statePattern, `const[routeFilter,setRouteFilter]=useState<'interhub'|'transit'|'direct'>('interhub');const[categoryFilter,setCategoryFilter]=useState<'Normal'|'Campaign'>('Normal')`)
      out = out.replace(visiblePattern, `const visibleSchedules=useMemo(()=>schedules.filter(s=>(s.route??'').toLowerCase()===routeFilter&&(categoryName(s.category)===categoryFilter)),[schedules,routeFilter,categoryFilter])`)
      out = out.replace(markupPattern, filterMarkup)
      out = out.replace('Mau berangkat kapan?', 'Cari jadwal yang pas')
      out = out.replace('Pilih hari dan tipe schedule yang mau kamu lihat.', 'Pilih tipe perjalanan dan rute yang kamu butuhkan.')
      return { code: out, map: null }
    },
  }
}
