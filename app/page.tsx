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
    const timeNow = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(/\./g, ':')

    const hariIni = data.filter(d => d.type === "hari_ini")
    const kemarin = data.filter(d => d.type === "kemarin")
    
    let totalHariIni = 0
    let totalKemarin = 0

    const formatHariIni = hariIni.map(d => { 
      const blastCount = d.total_blast || 0
      totalHariIni += blastCount
      return `User Fp = ${d.id} / ${d.status?.toUpperCase()}\nTotal Blast = ${blastCount}\nKeterangan = ${d.keterangan || "manual"}\nRespon = ${d.respon_angka || ""}` 
    }).join("\n\n")

    const formatKemarin = kemarin.map(d => { 
      const blastCount = d.total_blast || 0
      totalKemarin += blastCount
      return `User Fp = ${d.id} / ${d.status?.toUpperCase()}\nTotal Blast = ${blastCount}\nKeterangan = ${d.keterangan || "manual"}\nRespon = ${d.respon_angka || ""}` 
    }).join("\n\n")

    let reportOutput = `DIMAS\n${today}\nReal Time ${timeNow}\n\nFP Hari Ini :\n\n${formatHariIni || "Tidak ada data"}\n\nTotal blast = ${totalHariIni}`

    if (kemarin.length > 0) {
      reportOutput += `\n\n==========================\n\nFP Kemarin :\n\n${formatKemarin}\n\nTotal blast = ${totalKemarin}`
      
      const grandTotalBlast = totalHariIni + totalKemarin
      reportOutput += `\n\n==========================\n\ntotal all blast = ${grandTotalBlast}\n\n==========================`
    } else {
      reportOutput += `\n\n==========================`
    }

    setReportText(reportOutput)
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
                  <span>#{realIndex + 1} - {item.id} // {item.total_blast || 0} // {item.status}</span>
                  <span>{openIndex === realIndex ? "▲" : "▼"}</span>
                </div>
                {openIndex === realIndex && (
                  <div className="list-body">
                    <p>PASS: {item.password}</p>
                    <p>KODE: {item.kode}</p>
                    <div className="inline-group">
                      <input type="number" placeholder="Total Blast" value={item.total_blast} onChange={(e) => { const newData = [...data]; newData[realIndex].total_blast = Number(e.target.value); setData(newData); }} />
                      <input type="text" placeholder="Respon" value={item.respon_angka || ""} onChange={(e) => { const newData = [...data]; newData[realIndex].respon_angka = e.target.value; setData(newData); }} />
                      <select value={item.status} onChange={(e) => { const newData = [...data]; newData[realIndex].status = e.target.value; setData(newData); }}>
                        <option value="limit">LIMIT</option><option value="suspend">SUSPEND</option><option value="blokir">BLOKIR</option><option value="dibatasi">DIBATASI</option>
                      </select>
                    </div>
                    {/* DROP DOWN KETERANGAN */}
                    <div className="inline-group">
                      <select value={item.keterangan || "manual"} onChange={(e) => { const newData = [...data]; newData[realIndex].keterangan = e.target.value; setData(newData); }}>
                        <option value="manual">manual</option>
                        <option value="sender">sender</option>
                      </select>
                    </div>
                    <div className="inline-group">
                      <select value={item.type} onChange={(e) => { const newData = [...data]; newData[realIndex].type = e.target.value; setData(newData); }}>
                        <option value="hari_ini">FP Hari Ini</option><option value="kemarin">FP Kemarin</option>
                      </select>
                      <select value={item.dari} onChange={(e) => { const newData = [...data]; newData[realIndex].dari = e.target.value; setData(newData); }}>
                        <option>@Gcrpra</option><option>@mandiluuuu</option><option value="custom">Isi sendiri</option>
                      </select>
                    </div>
                    <div className="btn-row">
                      <button className="btn-sm btn3d" onClick={() => navigator.clipboard.writeText(item.id)}>ID</button>
                      <button className="btn-sm btn3d" onClick={() => navigator.clipboard.writeText(item.password)}>PASS</button>
                      <button className="btn-sm btn3d" onClick={() => navigator.clipboard.writeText(item.kode)}>KODE</button>
                      <button className="btn-sm btn3d blue" onClick={() => handleEdit(realIndex)}>EDIT</button>
                      <button className="btn-sm btn3d" onClick={() => { const txt = `${item.id}\nStatus : ${item.status} (${item.total_blast})\nDari : ${item.dari}`; navigator.clipboard.writeText(txt) }}>REPORT</button>
                      <button className="btn-sm btn3d ${item.login ? 'green' : 'red'}" onClick={() => { const newData = [...data]; newData[realIndex].login = !newData[realIndex].login; setData(newData); }}>{item.login ? "LOGIN" : "LOGOUT"}</button>
                      <button className="btn-sm btn3d red" onClick={() => setData(data.filter((_, idx) => idx !== realIndex))}>DEL</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          <hr style={{ margin: "20px 0", opacity: 0.2 }} />
          <h2>FP KEMARIN</h2>
          {data.filter(d => d.type === "kemarin").map((item) => {
            const realIndex = data.findIndex(d => d === item)
            return (
              <div key={realIndex} className="list-box">
                <div className="list-header" onClick={() => setOpenIndex(openIndex === realIndex ? null : realIndex)}>
                  <span>#{realIndex + 1} - {item.id} // {item.total_blast || 0} // {item.status}</span>
                  <span>{openIndex === realIndex ? "▲" : "▼"}</span>
                </div>
                {openIndex === realIndex && (
                  <div className="list-body">
                    <p>PASS: {item.password}</p>
                    <p>KODE: {item.kode}</p>
                    <div className="inline-group">
                      <input type="number" placeholder="Total Blast" value={item.total_blast} onChange={(e) => { const newData = [...data]; newData[realIndex].total_blast = Number(e.target.value); setData(newData); }} />
                      <input type="text" placeholder="Respon" value={item.respon_angka || ""} onChange={(e) => { const newData = [...data]; newData[realIndex].respon_angka = e.target.value; setData(newData); }} />
                      <select value={item.status} onChange={(e) => { const newData = [...data]; newData[realIndex].status = e.target.value; setData(newData); }}>
                        <option value="limit">LIMIT</option><option value="suspend">SUSPEND</option><option value="blokir">BLOKIR</option><option value="dibatasi">DIBATASI</option>
                      </select>
                    </div>
                    {/* DROP DOWN KETERANGAN */}
                    <div className="inline-group">
                      <select value={item.keterangan || "manual"} onChange={(e) => { const newData = [...data]; newData[realIndex].keterangan = e.target.value; setData(newData); }}>
                        <option value="manual">manual</option>
                        <option value="sender">sender</option>
                      </select>
                    </div>
                    <div className="inline-group">
                      <select value={item.type} onChange={(e) => { const newData = [...data]; newData[realIndex].type = e.target.value; setData(newData); }}>
                        <option value="hari_ini">FP Hari Ini</option><option value="kemarin">FP Kemarin</option>
                      </select>
                      <select value={item.dari} onChange={(e) => { const newData = [...data]; newData[realIndex].dari = e.target.value; setData(newData); }}>
                        <option>@Gcrpra</option><option>@mandiluuuu</option><option value="custom">Isi sendiri</option>
                      </select>
                    </div>
                    <div className="btn-row">
                      <button className="btn-sm btn3d" onClick={() => navigator.clipboard.writeText(item.id)}>ID</button>
                      <button className="btn-sm btn3d" onClick={() => navigator.clipboard.writeText(item.password)}>PASS</button>
                      <button className="btn-sm btn3d" onClick={() => navigator.clipboard.writeText(item.kode)}>KODE</button>
                      <button className="btn-sm btn3d blue" onClick={() => handleEdit(realIndex)}>EDIT</button>
                      <button className="btn-sm btn3d" onClick={() => { const txt = `${item.id}\nStatus : ${item.status} (${item.total_blast})\nDari : ${item.dari}`; navigator.clipboard.writeText(txt) }}>REPORT</button>
                      <button className="btn-sm btn3d ${item.login ? 'green' : 'red'}" onClick={() => { const newData = [...data]; newData[realIndex].login = !newData[realIndex].login; setData(newData); }}>{item.login ? "LOGIN" : "LOGOUT"}</button>
                      <button className="btn-sm btn3d red" onClick={() => setData(data.filter((_, idx) => idx !== realIndex))}>DEL</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <style jsx>{`
        /* CUSTOM SCROLLBAR - LEBIH TEBAL */
        :global(::-webkit-scrollbar) {
          width: 12px;
          height: 12px;
        }
        :global(::-webkit-scrollbar-track) {
          background: #0f172a;
          border-radius: 10px;
        }
        :global(::-webkit-scrollbar-thumb) {
          background: linear-gradient(180deg, #3b82f6, #1d4ed8);
          border-radius: 10px;
          border: 2px solid #0f172a;
        }
        :global(::-webkit-scrollbar-thumb:hover) {
          background: linear-gradient(180deg, #60a5fa, #2563eb);
        }

        .main { padding:30px; background:#020617; min-height:100vh; color:white }
        .title { text-align:center; margin-bottom:30px; font-size:48px; font-weight:900; background: linear-gradient(90deg,#22d3ee,#3b82f6,#22d3ee); background-size:200%; -webkit-background-clip:text; color:transparent; animation: glow 5s linear infinite; }
