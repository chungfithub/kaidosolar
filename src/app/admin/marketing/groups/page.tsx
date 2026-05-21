"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Category {
  id: number;
  name: string;
}

interface GroupHistory {
  id: number;
  membersCount: number;
  recordedAt: string;
}

interface Group {
  id: number;
  name: string;
  platform: string;
  url?: string;
  categories: Category[];
  membersCount?: number;
  description?: string;
  privacy: string;
  status: string;
  syncFrequency: string;
  lastSyncAt?: string;
  history?: GroupHistory[];
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
  const [filterCategory, setFilterCategory] = useState("all");
  const [form, setForm] = useState({ name: "", platform: "facebook", url: "", membersCount: "", description: "", privacy: "public", status: "active", categoryIds: [] as number[], syncFrequency: "manual" });
  const [saving, setSaving] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });

  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [bulkProgress, setBulkProgress] = useState<{ url: string; status: "pending" | "processing" | "success" | "error"; msg?: string }[]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [reloadingIds, setReloadingIds] = useState<number[]>([]);
  const [showReloadBulk, setShowReloadBulk] = useState(false);
  const [reloadScope, setReloadScope] = useState<"all" | "due" | number>("all");
  const [reloadProgress, setReloadProgress] = useState<{ id: number; name: string; url: string; status: "pending" | "processing" | "success" | "error"; msg?: string }[]>([]);
  const [isProcessingReload, setIsProcessingReload] = useState(false);

  // Visited Groups Tracking
  const [visitedGroups, setVisitedGroups] = useState<Set<number>>(new Set());

  const fetchGroups = async () => {
    const r = await fetch("/api/marketing-groups");
    setGroups(await r.json());
    setLoading(false);
  };

  const fetchCategories = async () => {
    const r = await fetch("/api/marketing-categories");
    setCategories(await r.json());
  };

  useEffect(() => { 
    fetchGroups(); 
    fetchCategories(); 
    const saved = localStorage.getItem('growth_visited_groups');
    if (saved) {
      try { setVisitedGroups(new Set(JSON.parse(saved))); } catch (e) {}
    }
  }, []);

  const markGroupAsVisited = (id: number) => {
    const newVisited = new Set(visitedGroups);
    newVisited.add(id);
    setVisitedGroups(newVisited);
    localStorage.setItem('growth_visited_groups', JSON.stringify(Array.from(newVisited)));
  };

  const resetVisitedGroups = () => {
    if (!confirm("Bạn muốn xóa toàn bộ lịch sử 'Đã check' của các nhóm?")) return;
    setVisitedGroups(new Set());
    localStorage.removeItem('growth_visited_groups');
  };

  const openAdd = () => {
    setEditingGroup(null);
    setForm({ name: "", platform: "facebook", url: "", membersCount: "", description: "", privacy: "public", status: "active", categoryIds: [], syncFrequency: "manual" });
    setShowForm(true);
  };

  const openEdit = (g: Group) => {
    setEditingGroup(g);
    setForm({ name: g.name, platform: g.platform, url: g.url || "", membersCount: String(g.membersCount || ""), description: g.description || "", privacy: g.privacy || "public", status: g.status, categoryIds: g.categories ? g.categories.map(c => c.id) : [], syncFrequency: g.syncFrequency || "manual" });
    setShowForm(true);
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    await fetch("/api/marketing-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCategoryName }) });
    setNewCategoryName("");
    fetchCategories();
  };

  const removeCategory = async (id: number) => {
    const password = prompt("Vui lòng nhập mật khẩu xác thực để xóa danh mục này:");
    if (password === null) return; // Hủy bỏ
    if (password !== "admin") {
      alert("Sai mật khẩu xác thực! Không thể xóa danh mục.");
      return;
    }
    await fetch(`/api/marketing-categories/${id}`, { method: "DELETE" });
    fetchCategories();
    fetchGroups();
  };

  const save = async () => {
    setSaving(true);
    const body = { 
      ...form, 
      membersCount: form.membersCount ? parseInt(form.membersCount) : null,
      categoryIds: form.categoryIds
    };
    if (editingGroup) {
      await fetch(`/api/marketing-groups/${editingGroup.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await fetch("/api/marketing-groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    await fetchGroups();
    setShowForm(false);
    setSaving(false);
  };

  const handleUrlBlur = async () => {
    if (!form.url || (!form.url.includes("facebook.com") && !form.url.includes("zalo.me"))) return;
    if (form.name && form.membersCount) return; // Không ghi đè nếu đã nhập tay

    setFetchingMeta(true);
    try {
      const res = await fetch(`/api/fetch-meta?url=${encodeURIComponent(form.url)}`);
      if (res.ok) {
        const data = await res.json();
        const parsedTitle = (data.title || "").trim();
        const isInvalidTitle = !parsedTitle || 
          ["facebook", "error", "log in", "đăng nhập", "sign up", "đăng ký", "lỗi"].some(kw => parsedTitle.toLowerCase().includes(kw));

        setForm(prev => ({
          ...prev,
          name: prev.name || (isInvalidTitle ? "" : parsedTitle),
          membersCount: prev.membersCount || (data.membersCount ? String(data.membersCount) : ""),
          privacy: data.privacy || prev.privacy
        }));
      }
    } catch (e) {
      console.error("Failed to fetch meta", e);
    } finally {
      setFetchingMeta(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Xóa group này?")) return;
    await fetch(`/api/marketing-groups/${id}`, { method: "DELETE" });
    setGroups(prev => prev.filter(g => g.id !== id));
  };

  const reloadSingleGroup = async (g: Group) => {
    if (!g.url) return alert("Group này không có link!");
    setReloadingIds(prev => [...prev, g.id]);
    try {
      const res = await fetch(`/api/fetch-meta?url=${encodeURIComponent(g.url)}`);
      if (!res.ok) throw new Error();
      const meta = await res.json();
      const body = {
        name: meta.title || g.name,
        membersCount: meta.membersCount || g.membersCount,
        description: meta.description || g.description,
        privacy: meta.privacy || g.privacy
      };
      await fetch(`/api/marketing-groups/${g.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      await fetchGroups();
    } catch (e) {
      alert("Không thể cập nhật group này!");
    } finally {
      setReloadingIds(prev => prev.filter(id => id !== g.id));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) setBulkText(prev => prev + (prev ? "\n" : "") + text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const startBulkAdd = async () => {
    const urls = bulkText.split('\n').map(l => l.trim()).filter(l => l.startsWith("http"));
    if (urls.length === 0) return alert("Không tìm thấy link hợp lệ nào!");
    
    const queue = urls.map(url => ({ url, status: "pending" as const }));
    setBulkProgress(queue);
    setIsProcessingBulk(true);

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      setBulkProgress(prev => {
        const n = [...prev];
        n[i].status = "processing";
        return n;
      });

      try {
        const res = await fetch(`/api/fetch-meta?url=${encodeURIComponent(item.url)}`);
        const meta = res.ok ? await res.json() : {};
        
        let platform = "other";
        if (item.url.includes("facebook.com")) platform = "facebook";
        else if (item.url.includes("zalo.me")) platform = "zalo";

        const body = {
          name: meta.title || "Group Mới " + Math.floor(Math.random() * 10000),
          platform,
          url: item.url,
          membersCount: meta.membersCount || null,
          description: meta.description || "",
          privacy: meta.privacy || "public",
          status: "active",
          categoryId: bulkCategoryId ? parseInt(bulkCategoryId) : null
        };

        const postRes = await fetch("/api/marketing-groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!postRes.ok) throw new Error("Lỗi lưu DB");

        setBulkProgress(prev => {
          const n = [...prev];
          n[i].status = "success";
          n[i].msg = meta.title ? "Thành công" : "Đã lưu (Thiếu tên)";
          return n;
        });

      } catch (e: any) {
        setBulkProgress(prev => {
          const n = [...prev];
          n[i].status = "error";
          n[i].msg = e.message || "Lỗi không xác định";
          return n;
        });
      }
      
      // Delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000));
    }

    setIsProcessingBulk(false);
    fetchGroups();
  };

  const startBulkReload = async () => {
    let targetGroups = groups.filter(g => g.url && g.status === "active");
    if (reloadScope === "due") {
      targetGroups = targetGroups.filter(g => {
        if (g.syncFrequency === "manual") return false;
        if (!g.lastSyncAt) return true;
        const daysSince = (new Date().getTime() - new Date(g.lastSyncAt).getTime()) / (1000 * 3600 * 24);
        if (g.syncFrequency === "daily" && daysSince >= 1) return true;
        if (g.syncFrequency === "weekly" && daysSince >= 7) return true;
        if (g.syncFrequency === "monthly" && daysSince >= 30) return true;
        return false;
      });
    } else if (reloadScope !== "all") {
      targetGroups = targetGroups.filter(g => g.categories && g.categories.some(c => c.id === reloadScope));
    }
    if (targetGroups.length === 0) return alert("Không tìm thấy group nào có link hợp lệ trong phạm vi này!");

    const queue = targetGroups.map(g => ({ id: g.id, name: g.name, url: g.url!, status: "pending" as const, msg: "" }));
    setReloadProgress(queue);
    setIsProcessingReload(true);

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      setReloadProgress(prev => { const n = [...prev]; n[i].status = "processing"; return n; });

      try {
        const originalGroup = targetGroups[i];
        const res = await fetch(`/api/fetch-meta?url=${encodeURIComponent(item.url)}`);
        if (!res.ok) throw new Error();
        const meta = await res.json();
        
        const body = {
          name: meta.title || originalGroup.name,
          membersCount: meta.membersCount || originalGroup.membersCount,
          description: meta.description || originalGroup.description || "",
          privacy: meta.privacy || originalGroup.privacy
        };
        
        await fetch(`/api/marketing-groups/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        
        setReloadProgress(prev => { const n = [...prev]; n[i].status = "success"; n[i].msg = "Thành công"; return n; });
      } catch (e: any) {
        setReloadProgress(prev => { const n = [...prev]; n[i].status = "error"; n[i].msg = "Lỗi / Bị chặn"; return n; });
      }
      await new Promise(r => setTimeout(r, 1500));
    }

    setIsProcessingReload(false);
    fetchGroups();
  };

  const handleSort = (key: string) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4, color: "#10b981" }}>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>;
  };

  const filtered = groups
    .filter(g => {
      const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) || (g.description || "").toLowerCase().includes(search.toLowerCase());
      const matchPlatform = filterPlatform === "all" || g.platform === filterPlatform;
      const matchCategory = filterCategory === "all" || (g.categories && g.categories.some(c => c.id === parseInt(filterCategory)));
      return matchSearch && matchPlatform && matchCategory;
    })
    .sort((a: any, b: any) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (aVal === null || aVal === undefined) aVal = sortConfig.key === "membersCount" ? 0 : "";
      if (bVal === null || bVal === undefined) bVal = sortConfig.key === "membersCount" ? 0 : "";

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  const calculateGrowth = (history: GroupHistory[] = []) => {
    if (history.length < 2) return null;
    const oldest = history[0].membersCount;
    const newest = history[history.length - 1].membersCount;
    const diff = newest - oldest;
    return diff;
  };

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
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/admin/marketing/groups/growth" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(245,158,11,0.3)", textDecoration: "none" }}>
            📈 Báo Cáo Tăng Trưởng
          </Link>
          <button onClick={() => setShowReloadBulk(true)} style={{ background: "white", color: "#3b82f6", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            🔄 Cập Nhật Data
          </button>
          <button onClick={() => setShowCategoryModal(true)} style={{ background: "white", color: "#334155", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            🗂️ Quản Lý Danh Mục
          </button>
          <button onClick={() => setShowBulk(true)} style={{ background: "white", color: "#0f172a", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            ⚡ Thêm Hàng Loạt
          </button>
          <button onClick={openAdd} style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>
            ➕ Thêm Group
          </button>
        </div>
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
        
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", background: "#f8fafc", cursor: "pointer" }}>
          <option value="all">Tất cả danh mục</option>
          {categories.map(c => <option key={c.id} value={c.id}>📁 {c.name}</option>)}
        </select>

        <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", background: "#f8fafc", cursor: "pointer" }}>
          <option value="all">Tất cả nền tảng</option>
          <option value="facebook">📘 Facebook</option>
          <option value="zalo">💬 Zalo</option>
          <option value="other">🔗 Khác</option>
        </select>

        <div style={{ flex: 1 }}></div>
        <button onClick={resetVisitedGroups} style={{ background: "white", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", height: 36 }}>
          🔄 Làm mới trạng thái Check
        </button>
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
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th onClick={() => handleSort("name")} style={{ cursor: "pointer", padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, userSelect: "none", whiteSpace: "nowrap" }}>
                    Tên Group {getSortIcon("name")}
                  </th>
                  <th onClick={() => handleSort("category")} style={{ cursor: "pointer", padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, userSelect: "none", whiteSpace: "nowrap" }}>
                    Danh Mục {getSortIcon("category")}
                  </th>
                  <th onClick={() => handleSort("platform")} style={{ cursor: "pointer", padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, userSelect: "none", whiteSpace: "nowrap" }}>
                    Nền Tảng {getSortIcon("platform")}
                  </th>
                  <th onClick={() => handleSort("membersCount")} style={{ cursor: "pointer", padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, userSelect: "none", whiteSpace: "nowrap" }}>
                    Số Thành Viên {getSortIcon("membersCount")}
                  </th>
                  <th onClick={() => handleSort("privacy")} style={{ cursor: "pointer", padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, userSelect: "none", whiteSpace: "nowrap" }}>
                    Quyền Riêng Tư {getSortIcon("privacy")}
                  </th>
                  <th onClick={() => handleSort("status")} style={{ cursor: "pointer", padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, userSelect: "none", whiteSpace: "nowrap" }}>
                    Trạng Thái {getSortIcon("status")}
                  </th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                    Đã Check
                  </th>
                  <th style={{ padding: "16px 20px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(g => {
                  const meta = PLATFORM_META[g.platform] || PLATFORM_META.other;
                  const isVisited = visitedGroups.has(g.id);
                  return (
                    <tr key={g.id} style={{ borderBottom: "1px solid #f1f5f9", background: isVisited ? "#f8fafc" : "transparent", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = isVisited ? "#f1f5f9" : "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = isVisited ? "#f8fafc" : "transparent"}>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 14, maxWidth: "260px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={g.name}>{g.name}</div>
                        {g.url && <a href={g.url} target="_blank" rel="noopener noreferrer" onClick={() => markGroupAsVisited(g.id)} style={{ fontSize: 12, color: meta.color, textDecoration: "none", display: "inline-block", marginTop: 4 }}>🔗 Mở link</a>}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        {g.categories && g.categories.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {g.categories.map(c => (
                              <span key={c.id} style={{ background: "#f1f5f9", color: "#475569", fontSize: 12, fontWeight: 600, padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                                📁 {c.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "#cbd5e1" }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ background: meta.bg, color: meta.color, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 4 }}>{meta.icon} {meta.label}</span>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569", fontWeight: 500 }}>
                          {g.membersCount ? `👥 ${g.membersCount.toLocaleString("vi")}` : <span style={{ color: "#94a3b8" }}>-</span>}
                          {g.url && (
                            <button onClick={() => reloadSingleGroup(g)} disabled={reloadingIds.includes(g.id)} style={{ background: "transparent", border: "none", cursor: reloadingIds.includes(g.id) ? "not-allowed" : "pointer", padding: "2px 4px", borderRadius: 4, opacity: reloadingIds.includes(g.id) ? 0.5 : 1 }} title="Cập nhật lại số lượng">
                              {reloadingIds.includes(g.id) ? "⏳" : "🔄"}
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ background: g.privacy === "private" ? "#f1f5f9" : "#e0f2fe", color: g.privacy === "private" ? "#64748b" : "#0284c7", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          {g.privacy === "private" ? "🔒 Nhóm kín" : "🌍 Công khai"}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ background: g.status === "active" ? "#ecfdf5" : "#fef2f2", color: g.status === "active" ? "#059669" : "#dc2626", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
                          {g.status === "active" ? "✅ Hoạt động" : "⏸️ Tạm dừng"}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        {isVisited ? (
                          <span style={{ color: "#10b981", fontWeight: 800, fontSize: 12, background: "#ecfdf5", padding: "4px 8px", borderRadius: 6, border: "1px solid #10b98140" }}>✅ Đã Check</span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: 12, background: "#f1f5f9", padding: "4px 8px", borderRadius: 6 }}>➖ Chưa vào</span>
                        )}
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button onClick={() => openEdit(g)} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600, color: "#334155", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>✏️ Sửa</button>
                          <button onClick={() => {
                            const newStatus = g.status === "active" ? "inactive" : "active";
                            fetch(`/api/marketing-groups/${g.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) }).then(() => fetchGroups());
                          }} style={{ background: g.status === "active" ? "#fef2f2" : "#ecfdf5", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600, color: g.status === "active" ? "#dc2626" : "#059669" }}>
                            {g.status === "active" ? "⏸️ Dừng" : "▶️ Bật"}
                          </button>
                          <button onClick={() => remove(g.id)} style={{ background: "#fef2f2", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer", color: "#dc2626" }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 8 }}>Danh mục (Chọn nhiều)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 120, overflowY: "auto", padding: "8px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc" }}>
                  {categories.length === 0 ? (
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>Chưa có danh mục nào. Hãy tạo danh mục trước.</span>
                  ) : (
                    categories.map(c => {
                      const isSelected = form.categoryIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            const newIds = isSelected 
                              ? form.categoryIds.filter(id => id !== c.id)
                              : [...form.categoryIds, c.id];
                            setForm(f => ({ ...f, categoryIds: newIds }));
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            border: `1px solid ${isSelected ? "#3b82f6" : "#e2e8f0"}`,
                            background: isSelected ? "#eff6ff" : "white",
                            color: isSelected ? "#3b82f6" : "#475569",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4
                          }}
                        >
                          {isSelected ? "✅" : "📁"} {c.name}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Tên Group *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Group NLMT Miền Nam - Kaido Solar" style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span>Link Group</span>
                  {fetchingMeta && <span style={{ color: "#10b981", fontSize: 11 }}>Đang tự động tải...</span>}
                </label>
                <input 
                  value={form.url} 
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))} 
                  onBlur={handleUrlBlur}
                  placeholder="https://www.facebook.com/groups/..." 
                  style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} 
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Số thành viên</label>
                <input type="number" value={form.membersCount} onChange={e => setForm(f => ({ ...f, membersCount: e.target.value }))} placeholder="VD: 15000" style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Mô tả</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ghi chú về group này, nội dung chào hàng, đối tượng khách hàng..." rows={3} style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Lịch Quét Thành Viên Tự Động</label>
                <select value={form.syncFrequency} onChange={e => setForm(f => ({ ...f, syncFrequency: e.target.value }))} style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box", background: "white", cursor: "pointer" }}>
                  <option value="manual">Chỉ quét thủ công</option>
                  <option value="daily">Mỗi ngày</option>
                  <option value="weekly">Mỗi 7 ngày</option>
                  <option value="monthly">Mỗi 30 ngày</option>
                </select>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748b" }}>Cần chạy tính năng "Quét nhóm đến hạn" để tự động cập nhật và tính toán tăng trưởng.</p>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Quyền Riêng Tư</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button 
                    onClick={() => setForm(f => ({ ...f, privacy: "public" }))} 
                    style={{ flex: 1, padding: "10px 4px", borderRadius: 8, border: `2px solid ${form.privacy === "public" ? "#0284c7" : "#e2e8f0"}`, background: form.privacy === "public" ? "#e0f2fe" : "white", cursor: "pointer", fontSize: 13, fontWeight: 600, color: form.privacy === "public" ? "#0284c7" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s" }}
                  >
                    🌍 Nhóm Công Khai
                  </button>
                  <button 
                    onClick={() => setForm(f => ({ ...f, privacy: "private" }))} 
                    style={{ flex: 1, padding: "10px 4px", borderRadius: 8, border: `2px solid ${form.privacy === "private" ? "#64748b" : "#e2e8f0"}`, background: form.privacy === "private" ? "#f1f5f9" : "white", cursor: "pointer", fontSize: 13, fontWeight: 600, color: form.privacy === "private" ? "#475569" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s" }}
                  >
                    🔒 Nhóm Kín
                  </button>
                </div>
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
      {/* Modal Bulk Add */}
      {showBulk && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => { if (e.target === e.currentTarget && !isProcessingBulk) setShowBulk(false); }}>
          <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 600, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>⚡ Thêm Hàng Loạt Group</h2>

            {!isProcessingBulk && bulkProgress.length === 0 && (
              <>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Dán danh sách link (mỗi link 1 dòng) hoặc tải lên file .txt.</p>
                <textarea 
                  value={bulkText} 
                  onChange={e => setBulkText(e.target.value)} 
                  placeholder="https://facebook.com/groups/abc&#10;https://zalo.me/g/xyz" 
                  rows={8} 
                  style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "monospace" }} 
                />
                
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <label style={{ cursor: "pointer", display: "inline-block", background: "#f1f5f9", color: "#475569", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                    📁 Tải file .txt lên
                    <input type="file" accept=".txt" onChange={handleFileUpload} style={{ display: "none" }} />
                  </label>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>Hệ thống tự động nối dữ liệu vào ô trên.</span>
                </div>

                <div style={{ marginTop: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Gán Danh Mục Chung (Không bắt buộc)</label>
                  <select value={bulkCategoryId} onChange={e => setBulkCategoryId(e.target.value)} style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box", background: "white", cursor: "pointer" }}>
                    <option value="">-- Chưa phân loại --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                  <button onClick={() => setShowBulk(false)} style={{ flex: 1, background: "#f1f5f9", border: "none", borderRadius: 10, padding: 12, fontSize: 14, cursor: "pointer", fontWeight: 600, color: "#334155" }}>Hủy</button>
                  <button onClick={startBulkAdd} disabled={!bulkText.trim()} style={{ flex: 2, background: bulkText.trim() ? "linear-gradient(135deg,#3b82f6,#2563eb)" : "#e2e8f0", color: bulkText.trim() ? "white" : "#94a3b8", border: "none", borderRadius: 10, padding: 12, fontSize: 14, cursor: bulkText.trim() ? "pointer" : "not-allowed", fontWeight: 700 }}>
                    ▶️ Bắt đầu xử lý
                  </button>
                </div>
              </>
            )}

            {(isProcessingBulk || bulkProgress.length > 0) && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, margin: 0, color: "#0f172a" }}>⏳ Tiến độ xử lý</h3>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isProcessingBulk ? "#eab308" : "#10b981" }}>
                    {bulkProgress.filter(p => p.status === "success" || p.status === "error").length} / {bulkProgress.length}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto", paddingRight: 4 }}>
                  {bulkProgress.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 13, color: "#334155", maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.url}>{item.url}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, display: "flex", gap: 6, alignItems: "center" }}>
                        {item.status === "pending" && <span style={{ color: "#94a3b8" }}>Chờ...</span>}
                        {item.status === "processing" && <span style={{ color: "#eab308" }}>Đang quét...</span>}
                        {item.status === "success" && <span style={{ color: "#10b981" }}>✅ {item.msg}</span>}
                        {item.status === "error" && <span style={{ color: "#ef4444" }}>❌ {item.msg}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {!isProcessingBulk && (
                  <div style={{ marginTop: 24, textAlign: "right" }}>
                    <button onClick={() => { setShowBulk(false); setBulkProgress([]); setBulkText(""); }} style={{ background: "#f1f5f9", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 600, color: "#334155" }}>
                      Đóng
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal Category Management */}
      {showCategoryModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setShowCategoryModal(false); }}>
          <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>🗂️ Quản Lý Danh Mục Group</h2>
            
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Tên danh mục mới..." style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none" }} />
              <button onClick={addCategory} disabled={!newCategoryName.trim()} style={{ background: "#3b82f6", color: "white", border: "none", borderRadius: 8, padding: "0 16px", cursor: "pointer", fontWeight: 600 }}>Thêm</button>
            </div>

            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {categories.length === 0 ? <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: 20 }}>Chưa có danh mục nào.</div> : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {categories.map(c => (
                      <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 0", fontSize: 14, color: "#334155", fontWeight: 600 }}>📁 {c.name}</td>
                        <td style={{ padding: "12px 0", textAlign: "right" }}>
                          <button onClick={() => removeCategory(c.id)} style={{ background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>Xóa</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ marginTop: 20, textAlign: "right" }}>
              <button onClick={() => setShowCategoryModal(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600, color: "#334155" }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bulk Reload */}
      {showReloadBulk && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => { if (e.target === e.currentTarget && !isProcessingReload) setShowReloadBulk(false); }}>
          <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 600, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>🔄 Cập Nhật Số Lượng Thành Viên</h2>

            {!isProcessingReload && reloadProgress.length === 0 && (
              <>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Hệ thống sẽ quét lại toàn bộ các link trong phạm vi được chọn. Nhóm nào bị lỗi link sẽ được tự động bỏ qua.</p>
                
                <div style={{ marginTop: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Phạm vi cập nhật</label>
                  <select value={reloadScope} onChange={e => setReloadScope(e.target.value === "all" || e.target.value === "due" ? e.target.value : parseInt(e.target.value))} style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box", background: "white", cursor: "pointer" }}>
                    <option value="due">🚀 Chỉ quét những nhóm ĐẾN HẠN (Khuyên dùng)</option>
                    <option value="all">Toàn bộ nhóm đang hoạt động</option>
                    {categories.map(c => <option key={c.id} value={c.id}>Chỉ danh mục: {c.name}</option>)}
                  </select>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                  <button onClick={() => setShowReloadBulk(false)} style={{ flex: 1, background: "#f1f5f9", border: "none", borderRadius: 10, padding: 12, fontSize: 14, cursor: "pointer", fontWeight: 600, color: "#334155" }}>Hủy</button>
                  <button onClick={startBulkReload} style={{ flex: 2, background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "white", border: "none", borderRadius: 10, padding: 12, fontSize: 14, cursor: "pointer", fontWeight: 700 }}>
                    ▶️ Bắt đầu Cập Nhật
                  </button>
                </div>
              </>
            )}

            {(isProcessingReload || reloadProgress.length > 0) && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, margin: 0, color: "#0f172a" }}>⏳ Tiến độ Cập Nhật</h3>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isProcessingReload ? "#eab308" : "#10b981" }}>
                    {reloadProgress.filter(p => p.status === "success" || p.status === "error").length} / {reloadProgress.length}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto", paddingRight: 4 }}>
                  {reloadProgress.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 13, color: "#334155", maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.name}>{item.name}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, display: "flex", gap: 6, alignItems: "center" }}>
                        {item.status === "pending" && <span style={{ color: "#94a3b8" }}>Chờ...</span>}
                        {item.status === "processing" && <span style={{ color: "#eab308" }}>Đang lấy dữ liệu...</span>}
                        {item.status === "success" && <span style={{ color: "#10b981" }}>✅ {item.msg}</span>}
                        {item.status === "error" && <span style={{ color: "#ef4444" }}>❌ {item.msg}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {!isProcessingReload && (
                  <div style={{ marginTop: 24, textAlign: "right" }}>
                    <button onClick={() => { setShowReloadBulk(false); setReloadProgress([]); }} style={{ background: "#f1f5f9", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 600, color: "#334155" }}>
                      Đóng
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
