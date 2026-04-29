"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Group {
  id: number;
  name: string;
  platform: string;
  url?: string;
  membersCount?: number;
  description?: string;
  status: string;
  createdAt: string;
}

const PLATFORM_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  facebook: { label: "Facebook", color: "#1877F2", bg: "#E7F0FF", icon: "📘" },
  zalo:     { label: "Zalo",     color: "#0068FF", bg: "#E0EEFF", icon: "💬" },
  other:    { label: "Khác",     color: "#64748b", bg: "#f1f5f9", icon: "🔗" },
};

export default function MarketingGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [form, setForm] = useState({ name: "", platform: "facebook", url: "", membersCount: "", description: "", status: "active" });
  const [saving, setSaving] = useState(false);

  const fetchGroups = async () => {
    const r = await fetch("/api/marketing-groups");
    setGroups(await r.json());
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, []);

  const openAdd = () => {
    setEditingGroup(null);
    setForm({ name: "", platform: "facebook", url: "", membersCount: "", description: "", status: "active" });
    setShowForm(true);
  };

  const openEdit = (g: Group) => {
    setEditingGroup(g);
    setForm({ name: g.name, platform: g.platform, url: g.url || "", membersCount: String(g.membersCount || ""), description: g.description || "", status: g.status });
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    const body = { ...form, membersCount: form.membersCount ? parseInt(form.membersCount) : null };
    if (editingGroup) {
      await fetch(`/api/marketing-groups/${editingGroup.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await fetch("/api/marketing-groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    await fetchGroups();
    setShowForm(false);
    setSaving(false);
  };

  const remove = async (id: number) => {
    if (!confirm("Xóa group này?")) return;
    await fetch(`/api/marketing-groups/${id}`, { method: "DELETE" });
    setGroups(prev => prev.filter(g => g.id !== id));
  };

  const filtered = groups.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) || (g.description || "").toLowerCase().includes(search.toLowerCase());
    const matchPlatform = filterPlatform === "all" || g.platform === filterPlatform;
    return matchSearch && matchPlatform;
  });

  const stats = {
    total: groups.length,
    facebook: groups.filter(g => g.platform === "facebook").length,
    zalo: groups.filter(g => g.platform === "zalo").length,
    active: groups.filter(g => g.status === "active").length,
  };

  return (
    <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: "#64748b" }}>
        <Link href="/admin" style={{ color: "#64748b", textDecoration: "none" }}>Tổng quan</Link>
        <span>/</span>
        <span style={{ color: "#64748b" }}>Marketing</span>
        <span>/</span>
        <span style={{ color: "#0f172a", fontWeight: 600 }}>Group Facebook / Zalo</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>📣 Group Marketing</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Quản lý các Group Facebook, Zalo về NLMT để tiếp cận khách hàng</p>
        </div>
        <button onClick={openAdd} style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>
          ➕ Thêm Group
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Tổng cộng", value: stats.total, color: "#0f172a", bg: "#f8fafc", icon: "🗂️" },
          { label: "Facebook", value: stats.facebook, color: "#1877F2", bg: "#E7F0FF", icon: "📘" },
          { label: "Zalo", value: stats.zalo, color: "#0068FF", bg: "#E0EEFF", icon: "💬" },
          { label: "Đang hoạt động", value: stats.active, color: "#059669", bg: "#ecfdf5", icon: "✅" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "14px 16px", border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Tìm kiếm group..." style={{ flex: 1, minWidth: 200, border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", background: "#f8fafc" }} />
        <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", background: "#f8fafc", cursor: "pointer" }}>
          <option value="all">Tất cả nền tảng</option>
          <option value="facebook">📘 Facebook</option>
          <option value="zalo">💬 Zalo</option>
          <option value="other">🔗 Khác</option>
        </select>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: "#f8fafc", borderRadius: 16, border: "2px dashed #e2e8f0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📣</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#334155", marginBottom: 6 }}>Chưa có group nào</div>
          <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>Thêm Group Facebook hoặc Zalo để bắt đầu quản lý marketing</div>
          <button onClick={openAdd} style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "white", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>➕ Thêm Group đầu tiên</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
          {filtered.map(g => {
            const meta = PLATFORM_META[g.platform] || PLATFORM_META.other;
            return (
              <div key={g.id} style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", transition: "box-shadow 0.2s", display: "flex", flexDirection: "column", gap: 12 }} onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"}>
                {/* Platform badge + status */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ background: meta.bg, color: meta.color, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>{meta.icon} {meta.label}</span>
                  <span style={{ background: g.status === "active" ? "#ecfdf5" : "#fef2f2", color: g.status === "active" ? "#059669" : "#dc2626", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20 }}>{g.status === "active" ? "✅ Hoạt động" : "⏸️ Tạm dừng"}</span>
                </div>

                {/* Name */}
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{g.name}</h3>
                  {g.description && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{g.description}</p>}
                </div>

                {/* Stats */}
                {g.membersCount && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569" }}>
                    <span>👥</span> <strong>{g.membersCount.toLocaleString("vi")}</strong> thành viên
                  </div>
                )}

                {/* URL */}
                {g.url && (
                  <a href={g.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: meta.color, textDecoration: "none", background: meta.bg, padding: "6px 10px", borderRadius: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    🔗 Mở {meta.label}
                  </a>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                  <button onClick={() => openEdit(g)} style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px", fontSize: 12, cursor: "pointer", fontWeight: 600, color: "#334155" }}>✏️ Sửa</button>
                  <button onClick={() => {
                    const newStatus = g.status === "active" ? "inactive" : "active";
                    fetch(`/api/marketing-groups/${g.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) }).then(() => fetchGroups());
                  }} style={{ flex: 1, background: g.status === "active" ? "#fef2f2" : "#ecfdf5", border: "none", borderRadius: 8, padding: "7px", fontSize: 12, cursor: "pointer", fontWeight: 600, color: g.status === "active" ? "#dc2626" : "#059669" }}>
                    {g.status === "active" ? "⏸️ Tạm dừng" : "▶️ Kích hoạt"}
                  </button>
                  <button onClick={() => remove(g.id)} style={{ background: "#fef2f2", border: "none", borderRadius: 8, padding: "7px 10px", fontSize: 12, cursor: "pointer", color: "#dc2626" }}>🗑️</button>
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
              {editingGroup ? "✏️ Chỉnh sửa Group" : "➕ Thêm Group Marketing"}
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
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Tên Group *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Group NLMT Miền Nam - Kaido Solar" style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Link Group</label>
                <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://www.facebook.com/groups/..." style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Số thành viên</label>
                <input type="number" value={form.membersCount} onChange={e => setForm(f => ({ ...f, membersCount: e.target.value }))} placeholder="VD: 15000" style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Mô tả</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ghi chú về group này, nội dung chào hàng, đối tượng khách hàng..." rows={3} style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, background: "#f1f5f9", border: "none", borderRadius: 10, padding: 12, fontSize: 14, cursor: "pointer", fontWeight: 600, color: "#334155" }}>Hủy</button>
              <button onClick={save} disabled={!form.name || saving} style={{ flex: 2, background: form.name && !saving ? "linear-gradient(135deg,#10b981,#059669)" : "#e2e8f0", color: form.name && !saving ? "white" : "#94a3b8", border: "none", borderRadius: 10, padding: 12, fontSize: 14, cursor: form.name && !saving ? "pointer" : "not-allowed", fontWeight: 700, boxShadow: form.name ? "0 4px 12px rgba(16,185,129,0.3)" : "none" }}>
                {saving ? "Đang lưu..." : editingGroup ? "💾 Cập nhật" : "✅ Thêm Group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
