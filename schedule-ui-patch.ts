import type { Plugin } from 'vite'

const filterMarkup = `<section className="schedule-filters"><div className="category-filter"><span className="filter-label">Tipe perjalanan</span><div className="filter-chips">{(['Normal','Campaign'] as const).map(category=><button key={category} className={categoryFilter===category?'active':''} onClick={()=>setCategoryFilter(category)}>{category}</button>)}</div></div><div className="route-filter"><div className="route-tabs">{(['interhub','transit','direct'] as const).map(route=><button key={route} className={routeFilter===route?'active':''} onClick={()=>setRouteFilter(route)}>{route==='interhub'?'Interhub':route==='transit'?'Transit':'Direct'}</button>)}</div></div></section>`

export default function scheduleUiPatch(): Plugin {
  return {
    name: 'schedule-ui-patch',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/main.tsx')) return null

      let out = code
      out = out.replace(
        /const\[dateFilter,setDateFilter\]=useState<DateFilter>\('today'\);const\[categoryFilter,setCategoryFilter\]=useState<'all'\|'Normal'|'Campaign'>\('all'\)/,
        `const[routeFilter,setRouteFilter]=useState<'interhub'|'transit'|'direct'>('interhub');const[categoryFilter,setCategoryFilter]=useState<'Normal'|'Campaign'>('Normal')`,
      )
      out = out.replace(
        /const visibleSchedules=useMemo\(\(\)=>\{.*?\},\[schedules,dateFilter,categoryFilter,profile\.role\]\)\n  const groupedSchedules=useMemo\(\(\)=>\{.*?\},\[visibleSchedules\]\)/s,
        `const visibleSchedules=useMemo(()=>schedules.filter(s=>(s.route??'').toLowerCase()===routeFilter&&(categoryName(s.category)===categoryFilter)),[schedules,routeFilter,categoryFilter])\n  const groupedSchedules=useMemo(()=>{const groups=new Map<string,Schedule[]>();visibleSchedules.forEach(s=>{const name=s.hubs?.group_name||'Lainnya';if(!groups.has(name))groups.set(name,[]);groups.get(name)!.push(s)});return Array.from(groups.entries()).sort((a,b)=>a[0].localeCompare(b[0]))},[visibleSchedules])`,
      )
      out = out.replace(/<section className="schedule-filters">.*?<\/section>/s, filterMarkup)

      if (out === code) return null
      return { code: out, map: null }
    },
  }
}
