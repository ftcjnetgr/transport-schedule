import type { Plugin } from 'vite'

const filterMarkup = `<section className="schedule-filters"><div className="schedule-search"><span className="filter-label">Cari jadwal</span><input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Cari ID, start point, destination, STD, STA, rute, tipe…" aria-label="Cari jadwal"/></div><div className="schedule-filter-row">{profile.role==='Super User'&&<div className="category-filter day-filter"><span className="filter-label">Hari</span><div className="filter-chips"><button className={dateFilter==='all'?'active':''} onClick={()=>setDateFilter('all')}>Semua hari</button>{['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'].map((name,i)=>{const value=\`day-\${i+1}\` as DateFilter;return <button key={value} className={dateFilter===value?'active':''} onClick={()=>setDateFilter(value)}>{name}</button>})}</div></div>}{profile.role!=='Super User'&&<div className="category-filter day-filter"><span className="filter-label">Hari</span><div className="filter-chips"><button className={dateFilter==='yesterday'?'active':''} onClick={()=>setDateFilter('yesterday')}>Kemarin</button><button className={dateFilter==='today'?'active':''} onClick={()=>setDateFilter('today')}>Hari ini</button><button className={dateFilter==='tomorrow'?'active':''} onClick={()=>setDateFilter('tomorrow')}>Besok</button></div></div>}<div className="category-filter"><span className="filter-label">Tipe perjalanan</span><div className="filter-chips">{(['Normal','Campaign'] as const).map(category=><button key={category} className={categoryFilter===category?'active':''} onClick={()=>setCategoryFilter(category)}>{category}</button>)}</div></div><div className="route-filter"><span className="filter-label">Rute</span><div className="route-tabs">{(['interhub','transit','direct'] as const).map(route=><button key={route} className={routeFilter===route?'active':''} onClick={()=>setRouteFilter(route)}>{route==='interhub'?'Interhub':route==='transit'?'Transit':'Direct'}</button>)}</div></div></div></section>`

export default function scheduleUiPatch(): Plugin {
  return {
    name: 'schedule-ui-patch',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/main.tsx')) return null

      let out = code

      const oldState = "const[dateFilter,setDateFilter]=useState<DateFilter>('today');const[categoryFilter,setCategoryFilter]=useState<'all'|'Normal'|'Campaign'>('all')"
      const newState = "const[dateFilter,setDateFilter]=useState<DateFilter>('today');const[routeFilter,setRouteFilter]=useState<'interhub'|'transit'|'direct'>('interhub');const[categoryFilter,setCategoryFilter]=useState<'Normal'|'Campaign'>('Normal');const[searchQuery,setSearchQuery]=useState('')"
      const stateIndex = out.indexOf(oldState)
      if (stateIndex >= 0) out = out.slice(0, stateIndex) + newState + out.slice(stateIndex + oldState.length)

      const visibleStart = out.indexOf('  const visibleSchedules=useMemo')
      if (visibleStart >= 0) {
        const visibleEnd = out.indexOf('\n', visibleStart)
        if (visibleEnd >= 0) {
          const newVisible = "  const visibleSchedules=useMemo(()=>{const query=searchQuery.trim().toLowerCase();const now=new Date();const today=isoDay(now);const yesterday=isoDay(addDays(now,-1));const tomorrow=isoDay(addDays(now,1));return schedules.filter(s=>{if((s.route??'').toLowerCase()!==routeFilter||categoryName(s.category)!==categoryFilter)return false;const scheduleDay=s.schedule_day??-1;if(profile.role==='Super User'){if(dateFilter!=='all'&&scheduleDay!==Number(dateFilter.replace('day-','')))return false}else{const targetDay=dateFilter==='yesterday'?yesterday:dateFilter==='tomorrow'?tomorrow:today;if(scheduleDay!==targetDay)return false}if(!query)return true;const haystack=[s.schedule_id,s.start_point_3lc,s.destination_3lc,s.start_point,s.destination,s.std?.slice(0,5),s.sta?.slice(0,5),s.route,s.category,s.schedule_day_name,s.schedule_hub_id,s.hubs?.name,s.hubs?.group_name].filter(Boolean).join(' ').toLowerCase();return query.split(' ').filter(Boolean).every(term=>haystack.includes(term))})},[schedules,routeFilter,categoryFilter,searchQuery,dateFilter,profile.role])"
          out = out.slice(0, visibleStart) + newVisible + out.slice(visibleEnd)
        }
      }

      const markupStart = out.indexOf('<section className="schedule-filters">')
      if (markupStart >= 0) {
        const markupEnd = out.indexOf('</section>', markupStart)
        if (markupEnd >= 0) out = out.slice(0, markupStart) + filterMarkup + out.slice(markupEnd + '</section>'.length)
      }

      out = out.replaceAll('Mau berangkat kapan?', 'Cari jadwal yang pas')
      out = out.replaceAll('Pilih hari dan tipe schedule yang mau kamu lihat.', 'Pilih tipe perjalanan, rute, dan hari yang kamu butuhkan.')
      if (out === code) return null
      return { code: out, map: null }
    },
  }
}
