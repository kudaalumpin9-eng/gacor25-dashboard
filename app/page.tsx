"use client"
import { useState, useEffect } from "react"

export default function Home() {
  const [data, setData] = useState<any[]>([])
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [reportText, setReportText] = useState("")
  const [showQuick, setShowQuick] = useState(false)
  const [quickInput, setQuickInput] = useState("")
  const [editIndex, setEditIndex] = useState<number | null>(null)
  
  // State untuk nama pemeriksa/pengisi report
  const [checkerName, setCheckerName] = useState("DIMAS RZ")

  const [form, setForm] = useState({
    id: "",
    password: "",
    kode: "",
    type: "hari_ini",
    dari: "@Gcrpra"
  })

  // List opsi status bawaan untuk validasi value dropdown
  const defaultStatuses = ["limit", "suspend", "blokir", "dibatasi", "tidak bisa di gunakan"];

  // ===================================================
  // [MODIFIKASI] LOGIKA LOCALSTORAGE & SINKRONISASI TAB
  // ===================================================
  
  // 1. Ambil data dari localStorage saat komponen pertama kali dimuat
  useEffect(() => {
    const savedData = localStorage.getItem("gacor_dashboard_data")
    const savedCheckerName = localStorage.getItem("gacor_checker_name")
    
    if (savedData) {
      try {
        setData(JSON.parse(savedData))
      } catch (e) {
        console.error("Gagal memuat data dari localStorage", e)
      }
    }
    if (savedCheckerName) {
      setCheckerName(savedCheckerName)
    }

    // LISTENER UNTUK SINKRONISASI REAL-TIME ANTAR TAB
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "gacor_dashboard_data" && e.newValue) {
        try {
          setData(JSON.parse(e.newValue))
        } catch (err) {
          console.error("Gagal sinkronisasi data antar tab", err)
        }
      }
      if (e.key === "gacor_checker_name" && e.newValue) {
        setCheckerName(e.newValue)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  // 2. Simpan data otomatis setiap kali state 'data' berubah
  useEffect(() => {
    if (data.length > 0 || localStorage.getItem("gacor_dashboard_data")) {
      localStorage.setItem("gacor_dashboard_data", JSON.stringify(data))
    }
  }, [data])

  // 3. Simpan nama pemeriksa otomatis setiap kali 'checkerName' berubah
  useEffect(() => {
    localStorage.setItem("gacor_checker_name", checkerName)
  }, [checkerName])

  // ===================================================

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
    const now = new Date()
    const todayStr = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".")
    
    const fullDateTime = `${todayStr} ${timeStr}`

    const hariIni = data.filter(d => d.type === "hari_ini")
    const kemarin = data.filter(d => d.type === "kemarin")
    
    let totalHariIni = 0
    let totalResponHariIni = 0
    
    let totalKemarin = 0
    let totalResponKemarin = 0

    const uniqueSources = Array.from(new Set(data.map(d => d.dari).filter(Boolean)))
    const sumberFp = uniqueSources.length > 0 ? uniqueSources.join(", ") : "@Gcrpra"

    const formatHariIni = hariIni.map((d, index) => { 
      const blastCount = d.total_blast || 0
      const responCount = Number(d.respon_angka) || 0
      totalHariIni += blastCount
      totalResponHariIni += responCount
      return `${index + 1}. User Fp = ${d.id} / ${d.status?.toUpperCase()}\nTotal Blast = ${blastCount}\nRespon = ${d.respon_angka || "0"}\nketerangan = ${d.keterangan || "manual"}` 
    }).join("\n\n")

    const formatKemarin = kemarin.map((d, index) => { 
      const blastCount = d.total_blast || 0
      const responCount = Number(d.respon_angka) || 0
      totalKemarin += blastCount
      totalResponKemarin += responCount
      return `${index + 1}. User Fp = ${d.id} / ${d.status?.toUpperCase()}\nTotal Blast = ${blastCount}\nRespon = ${d.respon_angka || "0"}\nketerangan = ${d.keterangan || "manual"}` 
    }).join("\n\n")

    // Output dasar (Hanya total blast untuk Hari Ini)
    let reportOutput = `${fullDateTime}\nRealtime / report harian\nNama : ${checkerName.toUpperCase()} (FP dari ${sumberFp})\n\nFP Hari Ini :\n\n${formatHariIni || "Tidak ada data"}\n\nTotal blast = ${totalHariIni}`

    if (kemarin.length > 0) {
      reportOutput += `\n\n==========================\n\nFP Kemarin :\n\n${formatKemarin}\n\nTotal blast = ${totalKemarin}`
      
      const grandTotalBlast = totalHariIni + totalKemarin
      const grandTotalRespon = totalResponHariIni + totalResponKemarin
      
      // Menampilkan total all blast dan total all respon gabungan di paling bawah
      reportOutput += `\n\n==========================\n\ntotal all blast = ${grandTotalBlast}\ntotal all respon = ${grandTotalRespon}\n==========================`
    } else {
      // Jika tidak ada data kemarin, total all respon tetap ditampilkan di paling bawah laporan utama
      reportOutput += `\n\ntotal all respon = ${totalResponHariIni}\n==========================`
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
          
          {/* Kolom Input Nama Pemeriksa */}
          <div style={{ marginBottom: "15px", paddingBottom: "15px", borderBottom: "1px dashed rgba(255,255,255,0.1)" }}>
            <label style={{ fontSize: "12px", fontWeight: "bold", color: "#3b82f6" }}>NAMA PEMERIKSA / REPORT</label>
            <input placeholder="Isi nama Anda (cth: DIMAS RZ)" value={checkerName} onChange={e => setCheckerName(e.target.value)} style={{ marginTop: "6px", borderColor: "#3b82f6" }} />
          </div>

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
                      <button className="btn-sm btn3d" onClick={() => navigator.clipboard.writeText(item.kode)}>KODE</button>
                      <button className="btn-sm btn3d blue" onClick={() => handleEdit(realIndex)}>EDIT</button>
                      <button className="btn-sm btn3d" onClick={() => { const txt = `${item.id}\nStatus : ${item.status} (${item.total_blast})\nDari : ${item.dari}`; navigator.clipboard.writeText(txt) }}>REPORT</button>
                      <button className={`btn-sm btn3d ${item.login ? "green" : "red"}`} onClick={() => { const newData = [...data]; newData[realIndex].login = !newData[realIndex].login; setData(newData); }}>{item.login ? "LOGIN" : "LOGOUT"}</button>
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
                      <button className="btn-sm btn3d" onClick={() => navigator.clipboard.writeText(item.kode)}>KODE</button>
                      <button className="btn-sm btn3d blue" onClick={() => handleEdit(realIndex)}>EDIT</button>
                      <button className="btn-sm btn3d" onClick={() => { const txt = `${item.id}\nStatus : ${item.status} (${item.total_blast})\nDari : ${item.dari}`; navigator.clipboard.writeText(txt) }}>REPORT</button>
                      <button className={`btn-sm btn3d ${item.login ? "green" : "red"}`} onClick={() => { const newData = [...data]; newData[realIndex].login = !newData[realIndex].login; setData(newData); }}>{item.login ? "LOGIN" : "LOGOUT"}</button>
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
        @keyframes glow { 0%{background-position:0%} 100%{background-position:200%} }
        .grid { display:grid; grid-template-columns:1fr 1fr; gap:24px }
        .card { background:rgba(255,255,255,0.04); padding:22px; border-radius:18px; box-shadow:0 8px 30px rgba(0,0,0,0.4); }
        input, select, textarea { width:100%; padding:12px; margin-top:12px; border-radius:12px; background:#0f172a; color:white; border: 1px solid rgba(255,255,255,0.1); }
        .inline-group { display: flex; gap: 10px; margin-top: 5px; }
        .inline-group input, .inline-group select { margin-top: 8px; }
        textarea { height:240px }
        .btn { margin-top:14px; padding:12px; border-radius:12px; background:linear-gradient(#22c55e,#15803d); box-shadow:0 5px 0 #14532d; }
        .btn:active { transform:translateY(3px); box-shadow:0 1px 0 #14532d; }
        .btn-sm { padding:7px 12px; border-radius:10px; background:#1f2937; box-shadow:0 4px 0 #111; }
        .btn3d:active { transform:translateY(3px); box-shadow:0 1px 0 #111; }
        .btn-row { display:flex; gap:8px; margin-top:14px; flex-wrap:wrap; }
        .quick-box { margin-top:22px }
        .generate-box { margin-top:30px }
        .list-box { margin-top:14px; padding:14px; border-radius:14px; background:rgba(0,0,0,0.45); border:1px solid rgba(255,255,255,0.08); }
        .list-header { display:flex; justify-content:space-between; cursor:pointer; font-weight:600; }
        .list-body { margin-top:12px; border-top:1px solid rgba(255,255,255,0.08); padding-top:12px; }
        .green { background:#22c55e } .red { background:#ef4444 } .blue { background:#3b82f6 }
      `}</style>
    </div>
  )
}
