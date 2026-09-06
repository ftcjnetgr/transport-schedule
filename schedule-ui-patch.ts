import type { Plugin } from 'vite'

const replacement = `<section className="schedule-filters"><div className="category-filter"><span className="filter-label">Category</span><div className="filter-chips">{(['Normal','Campaign'] as const).map(category=><button key={category} className={categoryFilter===category?'active':''} onClick={()=>setCategoryFilter(category)}>{category}</button>)}</div></div><div className="route-filter"><div className="route-tabs">{(['interhub','transit','direct'] as const).map(route=><button key={route} className={routeFilter===route?'active':''} onClick={()=>setRouteFilter(route)}>{route==='interhub'?'Interhub':route==='transit'?'Transit':'Direct'}</button>)}</div></div></section>{visibleSchedules.length===0?<div className="empty">Belum ada schedule untuk filter ini.</div>:<div className="schedule-grid">{visibleSchedules.map(s=><article className="schedule-card" key={s.id}><div className="schedule-head"><div><span className="schedule-id">{s.schedule_id}</span><div className="route-code">{s.start_point_3lc} <span>→</span> {s.destination_3lc}</div></div><span className="category">{categoryName(s.category)}</span></div><div className="location-row"><div><small>START</small><strong>{s.start_point}</strong></div><div><small>DESTINATION</small><strong>{s.destination}</strong></div></div><div className="time-row"><div><small>STD</small><b>{s.std.slice(0,5)}</b></div><div><small>STA</small><b>{s.sta.slice(0,5)}</b></div>{profile.role!=='Controller'&&<button className="primary small" onClick={()=>setSelected(s)}>Order</button>}</div></article>)}</div>}`

export default function scheduleUiPatch(): Plugin {
  return {
    name: 'schedule-ui-patch',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/main.tsx')) return null
      if (!code.includes('const groupedSchedules=useMemo')) return null

      let out = code
      out = out.replace(/const\[dateFilter,setDateFilter\]=useState<DateFilter>\('today'\);const\[categoryFilter,setCategoryFilter\]=useState<'all'\|'Normal'\|'Campaign'>\('all'\)/, `const[routeFilter,setRouteFilter]=useState<'interhub'|'transit'|'direct'>('interhub');const[categoryFilter,setCategoryFilter]=useState<'Normal'|'Campaign'>('Normal')`)
      out = out.replace(/const visibleSchedules=useMemo\(\(\)=>\{.*?\},\[schedules,dateFilter,categoryFilter,profile\.role\]\)\n  const groupedSchedules=useMemo\(\(\)=>\{.*?\},\[visibleSchedules\]\)/s, `const visibleSchedules=useMemo(()=>schedules.filter(s=>(s.route??'').toLowerCase()===routeFilter&&(categoryName(s.category)===categoryFilter)),[schedules,routeFilter,categoryFilter])`)
      out = out.replace(/<section className="schedule-filters">.*?<\/div>}<\/>:tab==='orders'/s, `${replacement}</>:tab==='orders'`)

      if (out === code) return null
      return { code: out, map: null }
    },
  }
}
