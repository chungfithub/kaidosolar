"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Prospect {
  id: number;
  name: string;
  platform: string;
  url?: string;
  phone?: string;
  notes?: string;
  status: string;
  createdAt: string;
}

const PLATFORM_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  facebook: { label: "Facebook", color: "#1877F2", bg: "#E7F0FF", icon: "📘" },
  zalo:     { label: "Zalo",     color: "#0068FF", bg: "#E0EEFF", icon: "💬" },
  other:    { label: "Khác",     color: "#64748b", bg: "#f1f5f9", icon: "👤" },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  new:        { label: "Mới",           color: "#1d4ed8", bg: "#eff6ff" },
  contacted:  { label: "Đã tiếp cận",   color: "#7c3aed", bg: "#f5f3ff" },
  interested: { label: "Quan tâm",      color: "#059669", bg: "#ecfdf5" },
  rejected:   { label: "Từ chối/Bỏ qua", color: "#dc2626", bg: "#fef2f2" },
};

export default function MarketingProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({ name: "", platform: "facebook", url: "", phone: "", notes: "", status: "new" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProspects = async () => {
    try {
      setError(null);
      const r = await fetch("/api/marketing-prospects");
      const data = await r.json();
      if (Array.isArray(data)) {
        setProspects(data);
      } else if (data.error) {
        setError(data.error);
        setProspects([]);
      } else {
        setProspects([]);
      }
    } catch (err: any) {
      setError(err.message);
      setProspects([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProspects(); }, []);

  const openAdd = () => {
    setEditingProspect(null);
    setForm({ name: "", platform: "facebook", url: "", phone: "", notes: "", status: "new" });
    setShowForm(true);
  };

  const openEdit = (p: Prospect) => {
    setEditingProspect(p);
    setForm({ name: p.name, platform: p.platform, url: p.url || "", phone: p.phone || "", notes: p.notes || "", status: p.status });
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    if (editingProspect) {
      await fetch(`/api/marketing-prospects/${editingProspect.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/marketing-prospects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    await fetchProspects();
    setShowForm(false);
    setSaving(false);
  };

  const remove = async (id: number) => {
    if (!confirm("Xóa liên hệ này?")) return;
    await fetch(`/api/marketing-prospects/${id}`, { method: "DELETE" });
    setProspects(prev => prev.filter(p => p.id !== id));
  };

  const filtered = prospects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.notes || "").toLowerCase().includes(search.toLowerCase()) || (p.phone || "").includes(search);
    const matchPlatform = filterPlatform === "all" || p.platform === filterPlatform;
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchPlatform && matchStatus;
  });

  return (
    <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: "#64748b" }}>
        <Link href="/admin" style={{ color: "#64748b", textDecoration: "none" }}>Tổng quan</Link>
        <span>/</span>
        <span style={{ color: "#64748b" }}>Marketing</span>
        <span>/</span>
        <span style={{ color: "#0f172a", fontWeight: 600 }}>Data Khách Hàng</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>👤 Data Khách Hàng</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Lưu trữ link Facebook/Zalo của khách hàng tiềm năng hoặc cộng tác viên</p>
        </div>
        <button onClick={openAdd} style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>
          ➕ Thêm Liên hệ
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ background: "#fef2f2", color: "#dc2626", padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14, border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: 10 }}>
          <span>⚠️ Lỗi:</span> {error}
          <button onClick={fetchProspects} style={{ marginLeft: "auto", background: "white", border: "1px solid #fecaca", borderRadius: 6, padding: "2px 8px", fontSize: 12, cursor: "pointer" }}>Thử lại</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Tìm kiếm tên, số điện thoại, ghi chú..." style={{ flex: 1, minWidth: 200, border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", background: "#f8fafc" }} />
        <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", background: "#f8fafc", cursor: "pointer" }}>
          <option value="all">Tất cả nền tảng</option>
          <option value="facebook">📘 Facebook</option>
          <option value="zalo">💬 Zalo</option>
          <option value="other">👤 Khác</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", background: "#f8fafc", cursor: "pointer" }}>
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(STATUS_META).map(([v, m]) => (
            <option key={v} value={v}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: "#f8fafc", borderRadius: 16, border: "2px dashed #e2e8f0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#334155", marginBottom: 6 }}>Chưa có liên hệ nào</div>
          <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>Thêm các link Facebook/Zalo của đối thủ hoặc CTV để quản lý</div>
          <button onClick={openAdd} style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "white", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>➕ Thêm Liên hệ đầu tiên</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
          {filtered.map(p => {
            const meta = PLATFORM_META[p.platform] || PLATFORM_META.other;
            const status = STATUS_META[p.status] || STATUS_META.new;
            return (
              <div key={p.id} style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>{meta.icon} {meta.label}</span>
                  <span style={{ background: status.bg, color: status.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{status.label}</span>
                </div>

                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{p.name}</h3>
                  {p.phone && <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>📞 {p.phone}</div>}
                  {p.notes && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.5, background: "#f8fafc", padding: "8px 10px", borderRadius: 8 }}>{p.notes}</p>}
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, color: "white", background: meta.color, textDecoration: "none", padding: "8px", borderRadius: 8, fontWeight: 600 }}>
                      🔗 Mở {meta.label}
                    </a>
                  )}
                  <button onClick={() => openEdit(p)} style={{ flex: 1, background: "#f1f5f9", border: "none", borderRadius: 8, padding: "8px", fontSize: 13, cursor: "pointer", fontWeight: 600, color: "#334155" }}>✏️ Sửa</button>
                  <button onClick={() => remove(p.id)} style={{ background: "#fef2f2", border: "none", borderRadius: 8, padding: "8px", fontSize: 13, cursor: "pointer", color: "#dc2626" }}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
              {editingProspect ? "✏️ Chỉnh sửa Data" : "➕ Thêm Data Khách Hàng"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Nền tảng *</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["facebook", "zalo", "other"].map(p => {
                    const m = PLATFORM_META[p];
                    return (
                      <button key={p} onClick={() => setForm(f => ({ ...f, platform: p }))} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: `2px solid ${form.platform === p ? m.color : "#e2e8f0"}`, background: form.platform === p ? m.bg : "white", cursor: "pointer", fontSize: 13, fontWeight: 600, color: form.platform === p ? m.color : "#64748b" }}>
                        {m.icon} {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Tên / Nickname *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Nguyễn Văn A (Đối thủ HN)" style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Số điện thoại</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="09xx..." style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Trạng thái</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", background: "white" }}>
                    {Object.entries(STATUS_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Link Facebook / Zalo</label>
                <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://www.facebook.com/..." style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Ghi chú</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Thông tin về người này, mặt hàng họ bán, khu vực hoạt động..." rows={3} style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, background: "#f1f5f9", border: "none", borderRadius: 10, padding: 12, fontSize: 14, cursor: "pointer", fontWeight: 600, color: "#334155" }}>Hủy</button>
              <button onClick={save} disabled={!form.name || saving} style={{ flex: 2, background: form.name && !saving ? "linear-gradient(135deg,#10b981,#059669)" : "#e2e8f0", color: form.name && !saving ? "white" : "#94a3b8", border: "none", borderRadius: 10, padding: 12, fontSize: 14, cursor: form.name && !saving ? "pointer" : "not-allowed", fontWeight: 700, boxShadow: form.name ? "0 4px 12px rgba(16,185,129,0.3)" : "none" }}>
                {saving ? "Đang lưu..." : editingProspect ? "💾 Cập nhật" : "✅ Thêm Liên hệ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
