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
  category?: Category;
  membersCount?: number;
  history?: GroupHistory[];
}

type Period = "7" | "30" | "all";

const PLATFORM_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  facebook: { label: "Facebook", color: "#1877F2", bg: "#E7F0FF", icon: "📘" },
  zalo:     { label: "Zalo",     color: "#0068FF", bg: "#E0EEFF", icon: "💬" },
  other:    { label: "Khác",     color: "#64748b", bg: "#f1f5f9", icon: "🔗" },
};

export default function GrowthAnalyticsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("7");

  useEffect(() => {
    fetch("/api/marketing-groups")
      .then(r => r.json())
      .then(data => {
        setGroups(data);
        setLoading(false);
      });
  }, []);

  const getGrowth = (g: Group, days: Period) => {
    if (!g.history || g.history.length < 2) return null;
    const latest = g.history[g.history.length - 1];
    let baseline = g.history[0];

    if (days !== "all") {
      const ms = parseInt(days) * 24 * 3600 * 1000;
      const targetTime = Date.now() - ms;
      const pastRecords = g.history.filter(h => new Date(h.recordedAt).getTime() <= targetTime);
      if (pastRecords.length > 0) {
        baseline = pastRecords[pastRecords.length - 1]; // record closest to, but before target
      } else {
        baseline = g.history[0]; 
      }
    }
    
    if (latest.id === baseline.id) return null; // Need at least two different points
    return latest.membersCount - baseline.membersCount;
  };

  const rankedGroups = groups
    .map(g => ({ ...g, growth: getGrowth(g, period) }))
    .filter(g => g.growth !== null)
    .sort((a, b) => (b.growth as number) - (a.growth as number));

  const topGrowing = rankedGroups.filter(g => (g.growth as number) > 0).slice(0, 3);
  const decliners = rankedGroups.filter(g => (g.growth as number) < 0).reverse().slice(0, 3);

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
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>📈 Bảng Xếp Hạng Tăng Trưởng</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Phân tích sự phát triển của các Group để tìm ra mỏ vàng bán hàng.</p>
        </div>
        <Link href="/admin/marketing/groups" style={{ background: "white", color: "#334155", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textDecoration: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          ⬅️ Quay Lại
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, background: "white", padding: 6, borderRadius: 12, border: "1px solid #e2e8f0", width: "fit-content" }}>
        <button onClick={() => setPeriod("7")} style={{ background: period === "7" ? "#f1f5f9" : "transparent", color: period === "7" ? "#0f172a" : "#64748b", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>7 Ngày Qua</button>
        <button onClick={() => setPeriod("30")} style={{ background: period === "30" ? "#f1f5f9" : "transparent", color: period === "30" ? "#0f172a" : "#64748b", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>30 Ngày Qua</button>
        <button onClick={() => setPeriod("all")} style={{ background: period === "all" ? "#f1f5f9" : "transparent", color: period === "all" ? "#0f172a" : "#64748b", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>Toàn Bộ Thời Gian</button>
      </div>

      {loading ? (
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
                    <span style={{ fontWeight: 800, color: "#10b981", fontSize: 14, background: "#ecfdf5", padding: "4px 8px", borderRadius: 6 }}>+{g.growth?.toLocaleString("vi")}</span>
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
                    <span style={{ fontWeight: 800, color: "#ef4444", fontSize: 14, background: "#fef2f2", padding: "4px 8px", borderRadius: 6 }}>{g.growth?.toLocaleString("vi")}</span>
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
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Mức Tăng Trưởng</th>
                    <th style={{ padding: "16px 20px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Link</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedGroups.map((g, index) => {
                    const isPositive = (g.growth as number) >= 0;
                    return (
                      <tr key={g.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "16px 20px", fontWeight: 800, color: index < 3 ? "#f59e0b" : "#94a3b8", fontSize: 16 }}>
                          #{index + 1}
                        </td>
                        <td style={{ padding: "16px 20px", fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                          {g.name}
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          {g.category ? <span style={{ background: "#f1f5f9", color: "#475569", fontSize: 12, fontWeight: 600, padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0" }}>📁 {g.category.name}</span> : <span style={{ color: "#cbd5e1" }}>-</span>}
                        </td>
                        <td style={{ padding: "16px 20px", fontSize: 13, color: "#475569", fontWeight: 600 }}>
                          👥 {g.membersCount?.toLocaleString("vi")}
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <span style={{ color: isPositive ? "#059669" : "#dc2626", fontWeight: 800, fontSize: 14, background: isPositive ? "#d1fae5" : "#fee2e2", padding: "6px 10px", borderRadius: 8, display: "inline-block" }}>
                            {isPositive ? "+" : ""}{g.growth?.toLocaleString("vi")} {isPositive ? "📈" : "📉"}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px", textAlign: "right" }}>
                          {g.url ? (
                            <a href={g.url} target="_blank" rel="noopener noreferrer" style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 700, color: "#3b82f6", textDecoration: "none", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                              Mở Nhóm ↗
                            </a>
                          ) : <span style={{ color: "#cbd5e1" }}>-</span>}
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
    </div>
  );
}
