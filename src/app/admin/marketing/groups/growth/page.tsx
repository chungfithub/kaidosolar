"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface GroupHistory {
  id: number;
  membersCount: number;
  recordedAt: string;
}

interface Category {
  id: number;
  name: string;
}

interface Group {
  id: number;
  name: string;
  platform: string;
  url?: string;
  categories: Category[];
  membersCount?: number;
  history?: GroupHistory[];
}

interface Campaign {
  id: number;
  name: string;
  description: string;
  status: string;
  _count?: { groups: number };
  groups?: { groupId: number }[];
  createdAt: string;
}

type Period = "7" | "30" | "all";

const PLATFORM_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  facebook: { label: "Facebook", color: "#1877F2", bg: "#E7F0FF", icon: "📘" },
  zalo:     { label: "Zalo",     color: "#0068FF", bg: "#E0EEFF", icon: "💬" },
  other:    { label: "Khác",     color: "#64748b", bg: "#f1f5f9", icon: "🔗" },
};

export default function GrowthAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "campaigns">("leaderboard");
  
  // Leaderboard State
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [period, setPeriod] = useState<Period>("7");

  // Campaigns State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [campaignGroups, setCampaignGroups] = useState<Group[]>([]);
  const [campaignPeriod, setCampaignPeriod] = useState<Period>("7");
  const [campaignDetails, setCampaignDetails] = useState<Campaign | null>(null);

  // Modals
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ name: "", description: "" });
  
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryToAdd, setSelectedCategoryToAdd] = useState<string>("all");

  // Visited Groups Tracking
  const [visitedGroups, setVisitedGroups] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchGroups();
    fetchCategories();
    // Load visited groups from localStorage
    const saved = localStorage.getItem('growth_visited_groups');
    if (saved) {
      try {
        setVisitedGroups(new Set(JSON.parse(saved)));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (activeTab === "campaigns" && campaigns.length === 0) {
      fetchCampaigns();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedCampaignId !== null) {
      fetchCampaignDetails(selectedCampaignId);
    }
  }, [selectedCampaignId]);

  const fetchGroups = () => {
    setLoadingGroups(true);
    fetch("/api/marketing-groups")
      .then(r => r.json())
      .then(data => {
        setGroups(data);
        setLoadingGroups(false);
      });
  };

  const fetchCategories = () => {
    fetch("/api/marketing-categories").then(r => r.json()).then(setCategories);
  };

  const fetchCampaigns = () => {
    setLoadingCampaigns(true);
    fetch("/api/marketing-campaigns")
      .then(r => r.json())
      .then(data => {
        setCampaigns(data);
        setLoadingCampaigns(false);
      });
  };

  const fetchCampaignDetails = (id: number) => {
    fetch(`/api/marketing-campaigns/${id}`)
      .then(r => r.json())
      .then(data => {
        setCampaignDetails(data);
        setCampaignGroups(data.groups.map((cg: any) => cg.group));
      });
  };

  const createCampaign = async () => {
    if (!campaignForm.name) return alert("Vui lòng nhập tên chiến dịch");
    await fetch("/api/marketing-campaigns", {
      method: "POST",
      body: JSON.stringify(campaignForm)
    });
    setShowAddCampaign(false);
    setCampaignForm({ name: "", description: "" });
    fetchCampaigns();
  };

  const deleteCampaign = async (id: number) => {
    if (!confirm("Xóa chiến dịch này?")) return;
    await fetch(`/api/marketing-campaigns/${id}`, { method: "DELETE" });
    if (selectedCampaignId === id) setSelectedCampaignId(null);
    fetchCampaigns();
  };

  const addGroupsToCampaign = async () => {
    let targetIds: number[] = [];
    if (selectedCategoryToAdd === "all") {
      targetIds = groups.map(g => g.id);
    } else {
      targetIds = groups.filter(g => g.categories && g.categories.some(c => c.id === parseInt(selectedCategoryToAdd))).map(g => g.id);
    }

    if (targetIds.length === 0) return alert("Không tìm thấy group nào trong danh mục này");
    
    await fetch(`/api/marketing-campaigns/${selectedCampaignId}/groups`, {
      method: "POST",
      body: JSON.stringify({ groupIds: targetIds })
    });
    
    setShowAddGroup(false);
    fetchCampaignDetails(selectedCampaignId!);
    fetchCampaigns(); // update count
  };

  const removeGroupFromCampaign = async (groupId: number) => {
    if (!confirm("Bỏ group này khỏi chiến dịch?")) return;
    await fetch(`/api/marketing-campaigns/${selectedCampaignId}/groups?groupId=${groupId}`, {
      method: "DELETE"
    });
    fetchCampaignDetails(selectedCampaignId!);
    fetchCampaigns();
  };

  const getGrowth = (g: Group, days: Period) => {
    if (!g.history || g.history.length < 2) return null;
    const latest = g.history[g.history.length - 1];
    let baseline = g.history[0];

    if (days !== "all") {
      const ms = parseInt(days) * 24 * 3600 * 1000;
      const targetTime = Date.now() - ms;
      const pastRecords = g.history.filter(h => new Date(h.recordedAt).getTime() <= targetTime);
      if (pastRecords.length > 0) {
        baseline = pastRecords[pastRecords.length - 1];
      } else {
        baseline = g.history[0]; 
      }
    }
    
    if (latest.id === baseline.id) return null;
    
    const absolute = latest.membersCount - baseline.membersCount;
    const percent = baseline.membersCount === 0 ? 0 : (absolute / baseline.membersCount) * 100;
    
    return { absolute, percent, baseline: baseline.membersCount };
  };

  const getCampaignGrowth = (campaign: Campaign, period: Period) => {
    if (!campaign.groups || campaign.groups.length === 0) return null;
    
    let totalAbsolute = 0;
    let totalBaseline = 0;
    let hasData = false;

    campaign.groups.forEach(cg => {
      const g = groups.find(x => x.id === cg.groupId);
      if (g) {
        const growth = getGrowth(g, period);
        if (growth !== null) {
          totalAbsolute += growth.absolute;
          totalBaseline += growth.baseline;
          hasData = true;
        }
      }
    });

    if (!hasData) return null;
    const percent = totalBaseline === 0 ? 0 : (totalAbsolute / totalBaseline) * 100;
    return { absolute: totalAbsolute, percent };
  };

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

  const renderLeaderboard = (sourceGroups: Group[], currentPeriod: Period, setPeriodFunc: (p: Period) => void, isLoading: boolean) => {
    const rankedGroups = sourceGroups
      .map(g => ({ ...g, growth: getGrowth(g, currentPeriod) }))
      .sort((a, b) => {
        if (a.growth === null && b.growth === null) return 0;
        if (a.growth === null) return 1;
        if (b.growth === null) return -1;
        return b.growth.absolute - a.growth.absolute;
      });

    const topGrowing = rankedGroups.filter(g => g.growth !== null && g.growth.absolute > 0).slice(0, 3);
    const decliners = rankedGroups.filter(g => g.growth !== null && g.growth.absolute < 0).reverse().slice(0, 3);

    return (
      <>
        {/* Filters */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 8, background: "white", padding: 6, borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <button onClick={() => setPeriodFunc("7")} style={{ background: currentPeriod === "7" ? "#f1f5f9" : "transparent", color: currentPeriod === "7" ? "#0f172a" : "#64748b", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>7 Ngày Qua</button>
            <button onClick={() => setPeriodFunc("30")} style={{ background: currentPeriod === "30" ? "#f1f5f9" : "transparent", color: currentPeriod === "30" ? "#0f172a" : "#64748b", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>30 Ngày Qua</button>
            <button onClick={() => setPeriodFunc("all")} style={{ background: currentPeriod === "all" ? "#f1f5f9" : "transparent", color: currentPeriod === "all" ? "#0f172a" : "#64748b", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>Toàn Bộ Thời Gian</button>
          </div>
          <button onClick={resetVisitedGroups} style={{ background: "white", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            🔄 Làm mới trạng thái Check
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Đang tải dữ liệu báo cáo...</div>
        ) : rankedGroups.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 16, border: "2px dashed #e2e8f0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#334155", marginBottom: 6 }}>Chưa đủ dữ liệu</div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>Hãy đợi hệ thống lưu lịch sử quét từ 2 lần trở lên để có thể tính toán mức tăng trưởng.</div>
          </div>
        ) : (
          <>
            {/* Top Highlights */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginBottom: 32 }}>
              <div style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", borderRadius: 16, padding: 24, border: "1px solid #10b98122" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, color: "#065f46", display: "flex", alignItems: "center", gap: 8 }}>🏆 Top Tăng Trưởng Mạnh Nhất</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {topGrowing.length === 0 ? <div style={{ fontSize: 13, color: "#047857" }}>Chưa có nhóm nào tăng trưởng.</div> : topGrowing.map((g, i) => (
                    <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "12px 16px", borderRadius: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: i === 0 ? "#f59e0b" : "#94a3b8" }}>#{i + 1}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}</span>
                      </div>
                      <span style={{ fontWeight: 800, color: "#10b981", fontSize: 14, background: "#ecfdf5", padding: "4px 8px", borderRadius: 6 }}>
                        +{g.growth?.absolute.toLocaleString("vi")} ({g.growth?.percent.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "linear-gradient(135deg, #fef2f2, #fee2e2)", borderRadius: 16, padding: 24, border: "1px solid #ef444422" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, color: "#991b1b", display: "flex", alignItems: "center", gap: 8 }}>⚠️ Đang Bị Giảm Thành Viên</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {decliners.length === 0 ? <div style={{ fontSize: 13, color: "#b91c1c" }}>Tuyệt vời! Không có nhóm nào bị giảm.</div> : decliners.map((g, i) => (
                    <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "12px 16px", borderRadius: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: "#ef4444" }}>🔻</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}</span>
                      </div>
                      <span style={{ fontWeight: 800, color: "#ef4444", fontSize: 14, background: "#fef2f2", padding: "4px 8px", borderRadius: 6 }}>
                        {g.growth?.absolute.toLocaleString("vi")} ({g.growth?.percent.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, width: 60 }}>Hạng</th>
                      <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Tên Group</th>
                      <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Danh Mục</th>
                      <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Thành Viên Hiện Tại</th>
                      <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Số lượng</th>
                      <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Tỷ lệ (%)</th>
                      <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Trạng thái</th>
                      <th style={{ padding: "16px 20px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedGroups.map((g, index) => {
                      const isPositive = g.growth !== null && g.growth.absolute >= 0;
                      const isVisited = visitedGroups.has(g.id);
                      return (
                        <tr key={g.id} style={{ borderBottom: "1px solid #f1f5f9", background: isVisited ? "#f8fafc" : "transparent", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = isVisited ? "#f1f5f9" : "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = isVisited ? "#f8fafc" : "transparent"}>
                          <td style={{ padding: "16px 20px", fontWeight: 800, color: index < 3 && !isVisited ? "#f59e0b" : "#94a3b8", fontSize: 16 }}>
                            #{index + 1}
                          </td>
                          <td style={{ padding: "16px 20px", fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                            <div style={{ maxWidth: "260px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={g.name}>
                              {g.name}
                            </div>
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
                          <td style={{ padding: "16px 20px", fontSize: 13, color: "#475569", fontWeight: 600 }}>
                            👥 {g.membersCount?.toLocaleString("vi")}
                          </td>
                          <td style={{ padding: "16px 20px" }}>
                            {g.growth === null ? (
                              <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: 13 }}>Chưa đủ dữ liệu</span>
                            ) : (
                              <span style={{ color: isPositive ? "#059669" : "#dc2626", fontWeight: 800, fontSize: 14, background: isPositive ? "#d1fae5" : "#fee2e2", padding: "6px 10px", borderRadius: 8, display: "inline-block" }}>
                                {isPositive ? "+" : ""}{g.growth.absolute.toLocaleString("vi")} {isPositive ? "📈" : "📉"}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "16px 20px" }}>
                            {g.growth === null ? (
                              <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: 13 }}>-</span>
                            ) : (
                              <span style={{ color: isPositive ? "#059669" : "#dc2626", fontWeight: 800, fontSize: 14 }}>
                                {isPositive ? "+" : ""}{g.growth.percent.toFixed(2)}%
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "16px 20px" }}>
                            {isVisited ? (
                              <span style={{ color: "#10b981", fontWeight: 800, fontSize: 12, background: "#ecfdf5", padding: "4px 8px", borderRadius: 6, border: "1px solid #10b98140" }}>✅ Đã Check</span>
                            ) : (
                              <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: 12, background: "#f1f5f9", padding: "4px 8px", borderRadius: 6 }}>➖ Chưa vào</span>
                            )}
                          </td>
                          <td style={{ padding: "16px 20px", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                              {g.url && (
                                <a href={g.url} target="_blank" rel="noopener noreferrer" onClick={() => markGroupAsVisited(g.id)} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 700, color: "#3b82f6", textDecoration: "none", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                  Mở ↗
                                </a>
                              )}
                              {activeTab === "campaigns" && selectedCampaignId !== null && (
                                <button onClick={() => removeGroupFromCampaign(g.id)} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 700, color: "#ef4444", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                  Loại bỏ
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: "#64748b" }}>
        <Link href="/admin" style={{ color: "#64748b", textDecoration: "none" }}>Tổng quan</Link>
        <span>/</span>
        <span style={{ color: "#64748b" }}>Marketing</span>
        <span>/</span>
        <Link href="/admin/marketing/groups" style={{ color: "#64748b", textDecoration: "none" }}>Group Facebook / Zalo</Link>
        <span>/</span>
        <span style={{ color: "#0f172a", fontWeight: 600 }}>Báo Cáo Tăng Trưởng</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>📈 Phân Tích & Chiến Dịch</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Theo dõi sự phát triển của các Group hoặc theo từng chiến dịch bán hàng.</p>
        </div>
        <Link href="/admin/marketing/groups" style={{ background: "white", color: "#334155", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textDecoration: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          ⬅️ Quay Lại Quản Lý
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 24, borderBottom: "2px solid #e2e8f0", marginBottom: 32 }}>
        <button 
          onClick={() => { setActiveTab("leaderboard"); setSelectedCampaignId(null); }} 
          style={{ background: "none", border: "none", padding: "0 0 12px", fontSize: 15, fontWeight: 700, color: activeTab === "leaderboard" ? "#3b82f6" : "#64748b", borderBottom: activeTab === "leaderboard" ? "2px solid #3b82f6" : "2px solid transparent", cursor: "pointer", marginBottom: -2, transition: "all 0.2s" }}
        >
          🏆 Xếp Hạng Toàn Hệ Thống
        </button>
        <button 
          onClick={() => setActiveTab("campaigns")} 
          style={{ background: "none", border: "none", padding: "0 0 12px", fontSize: 15, fontWeight: 700, color: activeTab === "campaigns" ? "#f59e0b" : "#64748b", borderBottom: activeTab === "campaigns" ? "2px solid #f59e0b" : "2px solid transparent", cursor: "pointer", marginBottom: -2, transition: "all 0.2s" }}
        >
          🎯 Chiến Dịch Theo Dõi
        </button>
      </div>

      {/* Content */}
      {activeTab === "leaderboard" && renderLeaderboard(groups, period, setPeriod, loadingGroups)}

      {activeTab === "campaigns" && (
        <div>
          {selectedCampaignId === null ? (
            // Campaign List
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <h2 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>Danh Sách Chiến Dịch</h2>
                  <div style={{ display: "flex", gap: 4, background: "#f1f5f9", padding: 4, borderRadius: 8 }}>
                    <button onClick={() => setCampaignPeriod("7")} style={{ background: campaignPeriod === "7" ? "white" : "transparent", color: campaignPeriod === "7" ? "#0f172a" : "#64748b", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: campaignPeriod === "7" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}>7 Ngày</button>
                    <button onClick={() => setCampaignPeriod("30")} style={{ background: campaignPeriod === "30" ? "white" : "transparent", color: campaignPeriod === "30" ? "#0f172a" : "#64748b", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: campaignPeriod === "30" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}>30 Ngày</button>
                    <button onClick={() => setCampaignPeriod("all")} style={{ background: campaignPeriod === "all" ? "white" : "transparent", color: campaignPeriod === "all" ? "#0f172a" : "#64748b", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: campaignPeriod === "all" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}>Toàn bộ</button>
                  </div>
                </div>
                <button onClick={() => setShowAddCampaign(true)} style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>
                  ➕ Tạo Chiến Dịch Mới
                </button>
              </div>

              {loadingCampaigns ? (
                <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Đang tải...</div>
              ) : campaigns.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 16, border: "2px dashed #e2e8f0" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#334155", marginBottom: 6 }}>Chưa có chiến dịch nào</div>
                  <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>Tạo chiến dịch để gom nhóm các Group cần theo dõi vào một chỗ.</div>
                  <button onClick={() => setShowAddCampaign(true)} style={{ background: "#f1f5f9", color: "#334155", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>Tạo chiến dịch đầu tiên</button>
                </div>
              ) : (
                <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                          <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, width: 60 }}>#</th>
                          <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Tên Chiến Dịch</th>
                          <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Mô Tả</th>
                          <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Số Nhóm</th>
                          <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Tăng Trưởng</th>
                          <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Ngày Tạo</th>
                          <th style={{ padding: "16px 20px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map((c, index) => {
                          const growth = getCampaignGrowth(c, campaignPeriod);
                          const isPositive = growth !== null && growth.absolute >= 0;
                          return (
                            <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <td style={{ padding: "16px 20px", fontWeight: 700, color: "#94a3b8", fontSize: 14 }}>
                                {index + 1}
                              </td>
                              <td style={{ padding: "16px 20px", fontWeight: 700, color: "#0f172a", fontSize: 15 }}>
                                {c.name}
                              </td>
                              <td style={{ padding: "16px 20px", fontSize: 13, color: "#64748b", maxWidth: 300, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {c.description || <span style={{ color: "#cbd5e1" }}>Không có mô tả</span>}
                              </td>
                              <td style={{ padding: "16px 20px" }}>
                                <span style={{ background: "#fef3c7", color: "#d97706", fontSize: 12, fontWeight: 800, padding: "4px 8px", borderRadius: 6 }}>
                                  {c._count?.groups || 0} Nhóm
                                </span>
                              </td>
                              <td style={{ padding: "16px 20px" }}>
                                {growth === null ? (
                                  <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: 13 }}>-</span>
                                ) : (
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ color: isPositive ? "#059669" : "#dc2626", fontWeight: 800, fontSize: 13, background: isPositive ? "#d1fae5" : "#fee2e2", padding: "4px 8px", borderRadius: 6 }}>
                                      {isPositive ? "+" : ""}{growth.absolute.toLocaleString("vi")}
                                    </span>
                                    <span style={{ color: isPositive ? "#059669" : "#dc2626", fontWeight: 800, fontSize: 12 }}>
                                      {isPositive ? "+" : ""}{growth.percent.toFixed(2)}%
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: "16px 20px", fontSize: 13, color: "#475569", fontWeight: 500 }}>
                                {new Date(c.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </td>
                              <td style={{ padding: "16px 20px", textAlign: "right" }}>
                                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                  <button onClick={() => setSelectedCampaignId(c.id)} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 700, color: "#3b82f6", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                    Xem Chi Tiết ↗
                                  </button>
                                  <button onClick={() => deleteCampaign(c.id)} style={{ background: "#fef2f2", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 700, color: "#ef4444" }}>
                                    Xóa
                                  </button>
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
            </>
          ) : (
            // Campaign Details
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button onClick={() => setSelectedCampaignId(null)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer" }}>🔙</button>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>{campaignDetails?.name}</h2>
                    <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>{campaignDetails?.description}</p>
                  </div>
                </div>
                <button onClick={() => setShowAddGroup(true)} style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(59,130,246,0.3)" }}>
                  ➕ Thêm Group Vào Chiến Dịch
                </button>
              </div>

              {campaignGroups.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 16, border: "2px dashed #e2e8f0" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#334155", marginBottom: 6 }}>Chiến dịch đang trống</div>
                  <div style={{ color: "#94a3b8", fontSize: 13 }}>Thêm Group vào để bắt đầu theo dõi tăng trưởng riêng cho chiến dịch này.</div>
                </div>
              ) : (
                renderLeaderboard(campaignGroups, campaignPeriod, setCampaignPeriod, false)
              )}
            </>
          )}
        </div>
      )}

      {/* Modal Add Campaign */}
      {showAddCampaign && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 20, color: "#0f172a" }}>Tạo Chiến Dịch Mới</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Tên chiến dịch *</label>
                <input value={campaignForm.name} onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })} placeholder="VD: Chiến dịch Sale Miền Nam" style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Mô tả ngắn</label>
                <textarea value={campaignForm.description} onChange={e => setCampaignForm({ ...campaignForm, description: e.target.value })} placeholder="Mục đích của chiến dịch này..." style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box", minHeight: 80 }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowAddCampaign(false)} style={{ background: "white", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Hủy</button>
              <button onClick={createCampaign} style={{ background: "#10b981", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Lưu Chiến Dịch</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Group to Campaign */}
      {showAddGroup && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 20, color: "#0f172a" }}>Thêm Nhóm Vào Chiến Dịch</h2>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>Chọn danh mục bạn muốn thêm vào chiến dịch này. Hệ thống sẽ tự động lọc và gom vào nhóm theo dõi.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Chọn Danh Mục Nguồn</label>
                <select value={selectedCategoryToAdd} onChange={e => setSelectedCategoryToAdd(e.target.value)} style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}>
                  <option value="all">Tất Cả Nhóm Trên Hệ Thống</option>
                  {categories.map(c => <option key={c.id} value={c.id}>Danh mục: {c.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowAddGroup(false)} style={{ background: "white", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Hủy</button>
              <button onClick={addGroupsToCampaign} style={{ background: "#3b82f6", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Thêm Vào Chiến Dịch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
