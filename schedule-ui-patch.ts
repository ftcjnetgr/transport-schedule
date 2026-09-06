import type { Plugin } from 'vite'

const replacement = `<section className="schedule-filters"><div className="filter-block"><span className="filter-label">Route</span><div className="filter-chips">{(['interhub','transit','direct'] as const).map(route=><button key={route} className={routeFilter===route?'active':''} onClick={()=>setRouteFilter(route)}>{route==='interhub'?'Interhub':route==='transit'?'Transit':'Direct'}</button>)}</div></div><div className="filter-block"><span className="filter-label">Category</span><div className="filter-chips"><button className={categoryFilter==='Normal'?'active':''} onClick={()=>setCategoryFilter('Normal')}>Normal</button><button className={categoryFilter==='Campaign'?'active':''} onClick={()=>setCategoryFilter('Campaign')}>Campaign</button></div></div></section>{visibleSchedules.length===0?<div className="empty">Belum ada schedule untuk filter ini.</div>:<div className="schedule-grid">{visibleSchedules.map(s=><article className="schedule-card" key={s.id}><div className="schedule-head"><div><span className="schedule-id">{s.schedule_id}</span><div className="route-code">{s.start_point_3lc} <span>→</span> {s.destination_3lc}</div></div><span className="category">{categoryName(s.category)}</span></div><div className="location-row"><div><small>START</small><strong>{s.start_point}</strong></div><div><small>DESTINATION</small><strong>{s.destination}</strong></div></div><div className="time-row"><div><small>STD</small><b>{s.std.slice(0,5)}</b></div><div><small>STA</small><b>{s.sta.slice(0,5)}</b></div>{profile.role!=='Controller'&&<button className="primary small" onClick={()=>setSelected(s)}>Order</button>}</div></article>)}</div>}`

export default function scheduleUiPatch(): Plugin {
  return {
    name: 'schedule-ui-patch',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/main.tsx')) return null
      if (!code.includes('const groupedSchedules=useMemo')) return null

      let out = code
      out = out.replace(/const dayName = \(date:Date\) => \['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'\]\[date\.getDay\(\)\]\nconst isoDay = \(date:Date\) => date\.getDay\(\)===0 \? 7 : date\.getDay\(\)\nconst addDays = \(date:Date, days:number\) => \{ const d=new Date\(date\); d\.setDate\(d\.getDate\(\)\+days\); return d \}\nconst dateKey = \(date:Date\) => `\$\{date\.getFullYear\(\)\}-\$\{String\(date\.getMonth\(\)\+1\)\.padStart\(2,'0'\)\}-\$\{String\(date\.getDate\(\)\)\.padStart\(2,'0'\)\}`\nconst categoryName = \(value:string\|null\) => value\?\.toLowerCase\(\)==='campaign' \? 'Campaign' : 'Normal'\ntype DateFilter = '[^\n]+'\n/, `const categoryName = (value:string|null) => value?.toLowerCase()==='campaign' ? 'Campaign' : 'Normal'\ntype RouteFilter = 'interhub'|'transit'|'direct'\n`)
      out = out.replace(/const\[dateFilter,setDateFilter\]=useState<DateFilter>\('today'\);const\[categoryFilter,setCategoryFilter\]=useState<'all'\|'Normal'\|'Campaign'>\('all'\)/, `const[routeFilter,setRouteFilter]=useState<RouteFilter>('interhub');const[categoryFilter,setCategoryFilter]=useState<'Normal'|'Campaign'>('Normal')`)
      out = out.replace(/const visibleSchedules=useMemo\(\(\)=>\{.*?\},\[schedules,dateFilter,categoryFilter,profile\.role\]\)\n  const groupedSchedules=useMemo\(\(\)=>\{.*?\},\[visibleSchedules\]\)/s, `const visibleSchedules=useMemo(()=>schedules.filter(s=>(s.route??'').toLowerCase()===routeFilter&&(categoryName(s.category)===categoryFilter)),[schedules,routeFilter,categoryFilter])`)
      out = out.replace(/<section className="schedule-filters">.*?<\/div>}<\/>:tab==='orders'/s, `${replacement}:tab==='orders'`)

      if (out === code) return null
      return { code: out, map: null }
    },
  }
}
