"use client"
import { useState } from "react"

export default function Home() {
  const [data, setData] = useState<any[]>([])
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [reportText, setReportText] = useState("")
  const [showQuick, setShowQuick] = useState(false)
  const [quickInput, setQuickInput] = useState("")
  const [editIndex, setEditIndex] = useState<number | null>(null)

  const [form, setForm] = useState({
    id: "",
    password: "",
    kode: "",
    type: "hari_ini",
    dari: "@Gcrpra"
  })

  // List opsi status bawaan untuk validasi value dropdown
  const defaultStatuses = ["limit", "suspend", "blokir", "dibatasi", "tidak bisa di gunakan"];

  const handleSave = () => {
    if (!form.id) return alert("ID wajib diisi")
    if (editIndex !== null) {
      const updatedData = [...data]
      updatedData[editIndex] = { ...updatedData[editIndex], ...form }
      setData(updatedData)
      setEditIndex(null)
    } else {
      setData([...data, { ...form, total_blast: 0, respon_angka: "", keterangan: "manual", status: "limit", login: false }])
    }
    setForm({ id: "", password: "", kode: "", type: "hari_ini", dari: "@Gcrpra" })
  }

  const handleEdit = (index: number) => {
    const item = data[index]
    setForm({ id: item.id, password: item.password, kode: item.kode, type: item.type, dari: item.dari })
    setEditIndex(index)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleQuickInput = () => {
    if (!quickInput) return
    
    const newDataEntries: any[] = []
    
    if (quickInput.includes("2fa :") || quickInput.includes("————")) {
      const segments = quickInput.split(/—{5,}/)
      segments.forEach(seg => {
        const idMatch = seg.match(/(\d{10,})/);
        const passMatch = seg.match(/\n([^\s(]+)\s*(\(password\))?/) || seg.match(/^([^\s(]+)/m);
        const faMatch = seg.match(/2fa\s*:\s*\n?([A-Z0-9\s]{15,})/i);
        
        if (idMatch && faMatch) {
          newDataEntries.push({
            ...form,
            id: idMatch[1].trim(),
            password: passMatch ? passMatch[1].trim() : "",
            kode: faMatch[1].replace(/\n/g, " ").trim(),
            total_blast: 0, respon_angka: "", keterangan: "manual", status: "limit", login: false
          })
        }
      })
    } 
    
    if (newDataEntries.length === 0) {
      const lines = quickInput.trim().split(/\n/)
      lines.forEach(line => {
        if (line.trim() === "") return
        const parts = line.trim().split(/\s+/)
        if (parts.length >= 3) {
          const id = parts[0]
          const password = parts[1]
          const kode = parts.slice(2).join(" ").replace(/\(kode 2fa\)/gi, "").trim()
          
          if (/^\d+$/.test(id)) {
            newDataEntries.push({
              ...form,
              id: id,
              password: password,
              kode: kode,
              total_blast: 0, respon_angka: "", keterangan: "manual", status: "limit", login: false
            })
          }
        }
      })
    }

    if (newDataEntries.length > 0) {
      setData([...data, ...newDataEntries])
      setQuickInput("")
      setShowQuick(false)
    } else {
      alert("Format tidak dikenali. Pastikan ID, Password, dan 2FA tersedia.")
    }
  }

  const handleGenerate = () => {
    const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })

    const hariIni = data.filter(d => d.type === "hari_ini")
    const kemarin = data.filter(d => d.type === "kemarin")
    
    let totalHariIni = 0
    let totalKemarin = 0

    const namaPengirim = data[0]?.dari || "DIMAS"

    const formatHariIni = hariIni.map((d, index) => { 
      const blastCount = d.total_blast || 0
      totalHariIni += blastCount
      return `${index + 1}. User Fp = ${d.id} / ${d.status?.toUpperCase()}\nTotal Blast = ${blastCount}\nRespon = ${d.respon_angka || "0"}\nketerangan = ${d.keterangan || "manual"}` 
    }).join("\n\n")

    const formatKemarin = kemarin.map((d, index) => { 
      const blastCount = d.total_blast || 0
      totalKemarin += blastCount
      return `${index + 1}. User Fp = ${d.id} / ${d.status?.toUpperCase()}\nTotal Blast = ${blastCount}\nRespon = ${d.respon_angka || "0"}\nketerangan = ${d.keterangan || "manual"}` 
    }).join("\n\n")

    let reportOutput = `${today}\nRealtime / report harian\nNama : ${namaPengirim} (FP dari ${namaPengirim})\n\nFP Hari Ini :\n\n${formatHariIni || "Tidak ada data"}\n\nTotal blast = ${totalHariIni}`

    if (kemarin.length > 0) {
      reportOutput += `\n\n==========================\n\nFP Kemarin :\n\n${formatKemarin}\n\nTotal blast = ${totalKemarin}`
      
      const grandTotalBlast = totalHariIni + totalKemarin
      reportOutput += `\n\n==========================\n\ntotal all blast = ${grandTotalBlast}\n\n==========================`
    } else {
      reportOutput += `\n\n==========================`
    }

    setReportText(reportOutput)
  }

  const handleDropdownChange = (realIndex: number, field: string, val: string) => {
    const newData = [...data]
    if (val === "custom") {
      const customValue = window.prompt(`Masukkan ${field} kustom anda:`)
      if (customValue !== null && customValue.trim() !== "") {
        newData[realIndex][field] = customValue.trim()
      }
    } else {
      newData[realIndex][field] = val
    }
    setData(newData)
  }

  return (
    <div className="main">
      <h1 className="title">DASHBOARD GACOR25 X OKE25</h1>
      <div className="grid">
        <div className="card">
          <h2>{editIndex !== null ? "EDIT DATA" : "INPUT DATA"}</h2>
          <input placeholder="ID" value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} />
          <input placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <input placeholder="Kode 2FA" value={form.kode} onChange={e => setForm({ ...form, kode: e.target.value })} />
          <div className="btn-row">
            <button onClick={handleSave} className="btn" style={{ flex: 1 }}>{editIndex !== null ? "UPDATE" : "SAVE"}</button>
            {editIndex !== null && <button onClick={() => { setEditIndex(null); setForm({ id: "", password: "", kode: "", type: "hari_ini", dari: "@Gcrpra" }); }} className="btn red">CANCEL</button>}
          </div>
          <div className="quick-box">
            <button onClick={() => setShowQuick(!showQuick)} className="btn-sm blue">LANGSUNG</button>
            {showQuick && (
              <>
                <textarea 
                  style={{ height: '120px' }}
                  placeholder="Paste ID PASS 2FA (Bisa banyak data)..." 
                  value={quickInput} 
                  onChange={(e) => setQuickInput(e.target.value)} 
                />
                <button onClick={handleQuickInput} className="btn">PROSES</button>
              </>
            )}
          </div>
          <div className="generate-box">
            <h2>GENERATE REPORT</h2>
            <div className="btn-row">
              <button onClick={handleGenerate} className="btn">GENERATE</button>
              <button onClick={() => navigator.clipboard.writeText(reportText)} className="btn blue">COPY</button>
            </div>
            <textarea value={reportText} readOnly />
          </div>
        </div>

        <div className="card">
          <h2>FP HARI INI</h2>
          {data.filter(d => d.type === "hari_ini").map((item) => {
            const realIndex = data.findIndex(d => d === item)
            return (
              <div key={realIndex} className="list-box">
                <div className="list-header" onClick={() => setOpenIndex(openIndex === realIndex ? null : realIndex)}>
                  <span>#{realIndex + 1} - {item.id} // {item.total_blast || 0} // {item.status?.toUpperCase()}</span>
                  <span>{openIndex === realIndex ? "▲" : "▼"}</span>
                </div>
                {openIndex === realIndex && (
                  <div className="list-body">
                    <p>PASS: {item.password}</p>
                    <p>KODE: {item.kode}</p>
                    <div className="inline-group">
                      <input type="number" placeholder="Total Blast" value={item.total_blast} onChange={(e) => { const newData = [...data]; newData[realIndex].total_blast = Number(e.target.value); setData(newData); }} />
                      <input type="text" placeholder="Respon" value={item.respon_angka || ""} onChange={(e) => { const newData = [...data]; newData[realIndex].respon_angka = e.target.value; setData(newData); }} />
                      <select value={defaultStatuses.includes(item.status) ? item.status : "custom"} onChange={(e) => handleDropdownChange(realIndex, "status", e.target.value)}>
                        <option value="limit">LIMIT</option>
                        <option value="suspend">SUSPEND</option>
                        <option value="blokir">BLOKIR</option>
                        <option value="dibatasi">DIBATASI</option>
                        <option value="tidak bisa di gunakan">TIDAK BISA DI GUNAKAN</option>
                        <option value="custom">{defaultStatuses.includes(item.status) ? "Isi sendiri..." : item.status}</option>
                      </select>
                    </div>
                    {/* DROP DOWN KETERANGAN */}
                    <div className="inline-group">
                      <select value={["manual", "sender", "ip"].includes(item.keterangan) ? item.keterangan : "custom"} onChange={(e) => handleDropdownChange(realIndex, "keterangan", e.target.value)}>
                        <option value="manual">manual</option>
                        <option value="sender">sender</option>
                        <option value="ip">IP</option>
                        <option value="custom">{["manual", "sender", "ip"].includes(item.keterangan) ? "Isi sendiri..." : item.keterangan}</option>
                      </select>
                    </div>
                    <div className="inline-group">
                      <select value={item.type} onChange={(e) => { const newData = [...data]; newData[realIndex].type = e.target.value; setData(newData); }}>
                        <option value="hari_ini">FP Hari Ini</option><option value="kemarin">FP Kemarin</option>
                      </select>
                      <select value={["@Gcrpra", "@mandiluuuu"].includes(item.dari) ? item.dari : "custom"} onChange={(e) => handleDropdownChange(realIndex, "dari", e.target.value)}>
                        <option value="@Gcrpra">@Gcrpra</option>
                        <option value="@mandiluuuu">@mandiluuuu</option>
                        <option value="custom">{["@Gcrpra", "@mandiluuuu"].includes(item.dari) ? "Isi sendiri..." : item.dari}</option>
                      </select>
                    </div>
                    <div className="btn-row">
                      <button className="btn-sm btn3d" onClick={() => navigator.clipboard.writeText(item.id)}>ID</button>
                      <button className="btn-sm btn3d" onClick={() => navigator.clipboard.writeText(item.password)}>PASS</button>
                      <button className="btn-sm btn3d" onClick={()
