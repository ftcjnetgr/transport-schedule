import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { ArrowLeft, CheckCircle2, FileSpreadsheet, Upload, X } from 'lucide-react'
import { supabase } from './lib/supabase'

type Row = Record<string, unknown>
type Props = { onBack: () => void }

const scheduleHeaders = ['schedule_id','start_point_3lc','destination_3lc','trip','schedule_hub_id','route','category','start_point','start_point_type','destination','destination_type','schedule_day','schedule_day_name','aging','std','sta','minute','active']
const userHeaders = ['username','hub_name','hub_group','role','status']

function normalizeRows(rows: Row[]) {
  return rows.map(row => Object.fromEntries(Object.entries(row).map(([k,v]) => [String(k).trim().toLowerCase(), v])))
}
function csvToRows(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (!lines.length) return []
  const parse = (line: string) => { const out: string[] = []; let cur=''; let quote=false; for(let i=0;i<line.length;i++){const c=line[i]; if(c==='"'){ if(quote && line[i+1]==='"'){cur+='"';i++} else quote=!quote } else if(c===','&&!quote){out.push(cur.trim());cur=''} else cur+=c } out.push(cur.trim()); return out }
  const headers = parse(lines[0]).map(x=>x.toLowerCase())
  return lines.slice(1).map(line=>{const vals=parse(line);return Object.fromEntries(headers.map((h,i)=>[h,vals[i]??'']))})
}
function cleanCell(v: unknown) { return v === null || v === undefined ? '' : String(v).trim() }

export default function MasterData({ onBack }: Props) {
  const [kind,setKind] = useState<'schedule'|'user'>('schedule')
  const [rows,setRows] = useState<Row[]>([])
  const [fileName,setFileName] = useState('')
  const [errors,setErrors] = useState<string[]>([])
  const [busy,setBusy] = useState(false)
  const [message,setMessage] = useState('')
  const headers = kind==='schedule' ? scheduleHeaders : userHeaders
  const preview = useMemo(()=>rows.slice(0,8),[rows])

  async function onFile(file?: File) {
    if(!file) return
    setFileName(file.name); setMessage(''); setErrors([])
    try {
      let parsed: Row[]
      if(file.name.toLowerCase().endsWith('.csv')) parsed = csvToRows(await file.text())
      else { const data = await file.arrayBuffer(); const wb=XLSX.read(data,{type:'array'}); const ws=wb.Sheets[wb.SheetNames[0]]; parsed=normalizeRows(XLSX.utils.sheet_to_json<Row>(ws,{defval:''})) }
      const normalized=normalizeRows(parsed)
      const missing=headers.filter(h=>!(h in (normalized[0]??{})))
      if(missing.length){setErrors([`Header tidak lengkap: ${missing.join(', ')}`]);setRows([]);return}
      const nextErrors:string[]=[]
      normalized.forEach((r,i)=>{if(kind==='schedule'){if(!cleanCell(r.schedule_id))nextErrors.push(`Baris ${i+2}: schedule_id wajib diisi`);if(!cleanCell(r.schedule_hub_id))nextErrors.push(`Baris ${i+2}: schedule_hub_id wajib diisi`);if(!cleanCell(r.std)||!cleanCell(r.sta))nextErrors.push(`Baris ${i+2}: STD dan STA wajib diisi`)}else{if(!cleanCell(r.username))nextErrors.push(`Baris ${i+2}: username wajib diisi`);if(!['User','Controller','Super User'].includes(cleanCell(r.role)))nextErrors.push(`Baris ${i+2}: role harus User/Controller/Super User`)}})
      setRows(normalized);setErrors(nextErrors)
    } catch(e){setRows([]);setErrors([e instanceof Error?e.message:'File tidak bisa dibaca'])}
  }

  async function apply() {
    if(!rows.length||errors.length||kind!=='schedule') return
    setBusy(true);setMessage('')
    const payload=rows.map(r=>Object.fromEntries(scheduleHeaders.map(h=>[h,cleanCell(r[h])])))
    const {data,error}=await supabase.rpc('bulk_upsert_schedules',{p_rows:payload})
    if(error)setErrors([error.message]);else{setMessage(`${data} schedule berhasil di-apply.`);setRows([]);setFileName('')}
    setBusy(false)
  }

  return <main className="app-shell"><header className="topbar"><button className="back-button" onClick={onBack}><ArrowLeft size={18}/> Kembali</button><div><span className="eyebrow">MASTER DATA</span><div className="top-title">Kelola data operasional</div></div></header>
    <section className="panel master-panel"><div className="section-title"><div><span className="eyebrow">SUPER USER</span><h1>Bulk update</h1><p className="muted">Upload template → preview → validasi → apply. Data yang tidak ada di file tidak akan dihapus.</p></div></div>
      <div className="tabs"><button className={kind==='schedule'?'active':''} onClick={()=>{setKind('schedule');setRows([]);setErrors([])}}>Schedule</button><button className={kind==='user'?'active':''} onClick={()=>{setKind('user');setRows([]);setErrors([])}}>User</button></div>
      <div className="upload-box"><FileSpreadsheet size={24}/><div><strong>{fileName||'Pilih file Excel atau CSV'}</strong><span>Sheet pertama dibaca untuk preview. Format mengikuti template bulk update.</span></div><label className="secondary small upload-button"><Upload size={16}/> Pilih file<input type="file" accept=".xlsx,.xls,.csv" onChange={e=>void onFile(e.target.files?.[0])}/></label></div>
      {message&&<div className="success"><CheckCircle2 size={17}/>{message}</div>}
      {errors.length>0&&<div className="error wide"><strong>Validasi belum lolos</strong>{errors.slice(0,12).map((e,i)=><div key={i}>{e}</div>)}{errors.length>12&&<div>+ {errors.length-12} error lainnya</div>}</div>}
      {kind==='user'&&<div className="hint"><strong>User bulk upload:</strong> untuk saat ini preview & validasi sudah aktif. Provisioning Auth user baru akan diproses lewat jalur server-side, bukan dari browser.</div>}
      {rows.length>0&&<div className="preview-wrap"><div className="preview-head"><div><span className="eyebrow">PREVIEW</span><h2>{rows.length} baris siap diperiksa</h2></div><button className="icon-button" onClick={()=>{setRows([]);setFileName('')}}><X size={17}/></button></div><div className="table-scroll"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{preview.map((r,i)=><tr key={i}>{headers.map(h=><td key={h}>{cleanCell(r[h])||'-'}</td>)}</tr>)}</tbody></table></div>{rows.length>8&&<div className="muted">Menampilkan 8 baris pertama dari {rows.length}.</div>}</div>}
      <div className="master-actions"><button className="secondary" onClick={onBack}>Batal</button><button className="primary" disabled={busy||!rows.length||errors.length>0||kind!=='schedule'} onClick={()=>void apply()}>{busy?'Meng-apply…':'Validate & Apply'}</button></div>
    </section></main>
}
