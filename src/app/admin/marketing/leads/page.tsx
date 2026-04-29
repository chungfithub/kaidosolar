"use client";
import { useState, useEffect } from "react";

interface Lead {
  id: number; postContent: string; postUrl?: string; authorName?: string;
  platform: string; groupName?: string; aiScore?: number; aiAnalysis?: string;
  aiSuggest?: string; status: string; assignedTo?: string; saleNote?: string; createdAt: string;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  new:       { label: "Mới",         color: "#1d4ed8", bg: "#eff6ff" },
  assigned:  { label: "Đã giao",     color: "#b45309", bg: "#fffbeb" },
  contacted: { label: "Đã tiếp cận", color: "#7c3aed", bg: "#f5f3ff" },
  converted: { label: "Đã chốt",     color: "#059669", bg: "#ecfdf5" },
  rejected:  { label: "Bỏ qua",      color: "#94a3b8", bg: "#f8fafc" },
};

const SCORE_COLOR = (s: number) => s >= 8 ? "#059669" : s >= 5 ? "#b45309" : "#64748b";
const SCORE_BG    = (s: number) => s >= 8 ? "#ecfdf5" : s >= 5 ? "#fffbeb" : "#f8fafc";

export default function LeadScannerPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showScanner, setShowScanner] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Scanner form state
  const [postContent, setPostContent] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [platform, setPlatform] = useState("facebook");
  const [groupName, setGroupName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const fetch_ = async (status = filterStatus) => {
    const r = await fetch(`/api/marketing-leads?status=${status}`);
    setLeads(await r.json()); setLoading(false);
  };
  useEffect(() => { fetch_(); }, [filterStatus]);

  const analyze = async () => {
    if (!postContent.trim()) return;
    setAnalyzing(true); setAnalysisResult(null);
    try {
      const r = await fetch("/api/marketing-leads/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postContent, platform, groupName })
      });
      const d = await r.json();
      if (d.error) alert("Lỗi AI: " + d.error);
      else setAnalysisResult(d);
    } catch { alert("Lỗi kết nối"); }
    setAnalyzing(false);
  };

  const saveLead = async () => {
    if (!analysisResult) return;
    setSaving(true);
    await fetch("/api/marketing-leads", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postContent, postUrl: postUrl || null,
        authorName: analysisResult.authorName || null,
        platform, groupName: groupName || null,
        aiScore: analysisResult.score,
        aiAnalysis: analysisResult.analysis,
        aiSuggest: analysisResult.suggest,
        status: "new"
      })
    });
    await fetch_();
    setShowScanner(false); setPostContent(""); setPostUrl(""); setGroupName(""); setAnalysisResult(null);
    setSaving(false);
  };

  const updateLead = async (id: number, data: any) => {
    await fetch(`/api/marketing-leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    await fetch_();
    if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, ...data } : null);
  };

  const stats = { total: leads.length, hot: leads.filter(l => (l.aiScore || 0) >= 8).length, assigned: leads.filter(l => l.status === "assigned").length, converted: leads.filter(l => l.status === "converted").length };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>🎯 Lead Scanner AI</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Paste bài viết từ Facebook/Zalo → AI chấm điểm tiềm năng → Giao cho Sale tư vấn</p>
        </div>
        <button onClick={() => setShowScanner(true)} style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>
          🔍 Quét Lead mới
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Tổng leads", value: stats.total, icon: "📋", color: "#0f172a", bg: "#f8fafc" },
          { label: "Tiềm năng cao", value: stats.hot, icon: "🔥", color: "#dc2626", bg: "#fef2f2" },
          { label: "Đã giao sale", value: stats.assigned, icon: "👤", color: "#b45309", bg: "#fffbeb" },
          { label: "Đã chốt", value: stats.converted, icon: "✅", color: "#059669", bg: "#ecfdf5" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "14px 16px", border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[["all","Tất cả"],["new","Mới"],["assigned","Đã giao"],["contacted","Đã tiếp cận"],["converted","Đã chốt"],["rejected","Bỏ qua"]].map(([v,l]) => (
          <button key={v} onClick={() => setFilterStatus(v)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${filterStatus === v ? "#10b981" : "#e2e8f0"}`, background: filterStatus === v ? "#ecfdf5" : "white", color: filterStatus === v ? "#059669" : "#64748b", fontSize: 12, fontWeight: filterStatus === v ? 700 : 400, cursor: "pointer" }}>{l}</button>
        ))}
      </div>

      {/* Leads list */}
      {loading ? <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Đang tải...</div> :
        leads.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "#f8fafc", borderRadius: 16, border: "2px dashed #e2e8f0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#334155", marginBottom: 6 }}>Chưa có lead nào</div>
            <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>Vào Group Facebook/Zalo, thấy bài viết tiềm năng → bấm "Quét Lead mới" → paste nội dung → AI phân tích</div>
            <button onClick={() => setShowScanner(true)} style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "white", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>🔍 Quét Lead đầu tiên</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {leads.map(lead => {
              const st = STATUS_META[lead.status] || STATUS_META.new;
              const score = lead.aiScore || 0;
              return (
                <div key={lead.id} style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", cursor: "pointer" }} onClick={() => setSelectedLead(lead)}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    {/* Score */}
                    <div style={{ width: 52, height: 52, borderRadius: 12, background: SCORE_BG(score), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `2px solid ${SCORE_COLOR(score)}33` }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: SCORE_COLOR(score), lineHeight: 1 }}>{score}</span>
                      <span style={{ fontSize: 9, color: SCORE_COLOR(score) }}>/ 10</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                        {lead.authorName && <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>👤 {lead.authorName}</span>}
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: lead.platform === "facebook" ? "#e7f0ff" : "#e0eeff", color: lead.platform === "facebook" ? "#1877f2" : "#0068ff", fontWeight: 600 }}>{lead.platform === "facebook" ? "📘 Facebook" : "💬 Zalo"}</span>
                        {lead.groupName && <span style={{ fontSize: 11, color: "#64748b" }}>• {lead.groupName}</span>}
                        <span style={{ marginLeft: "auto", fontSize: 11, padding: "2px 10px", borderRadius: 10, background: st.bg, color: st.color, fontWeight: 700 }}>{st.label}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: "#334155", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5 }}>{lead.postContent}</p>
                      {lead.aiAnalysis && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748b", fontStyle: "italic" }}>💡 {lead.aiAnalysis}</p>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12, borderTop: "1px solid #f1f5f9", paddingTop: 10 }} onClick={e => e.stopPropagation()}>
                    <select value={lead.status} onChange={e => updateLead(lead.id, { status: e.target.value })} style={{ fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 7, padding: "5px 8px", background: "#f8fafc", cursor: "pointer", outline: "none" }}>
                      {Object.entries(STATUS_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
                    </select>
                    <input placeholder="Giao cho..." defaultValue={lead.assignedTo || ""} onBlur={e => { if (e.target.value !== lead.assignedTo) updateLead(lead.id, { assignedTo: e.target.value }); }} style={{ flex: 1, fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 7, padding: "5px 10px", outline: "none" }} />
                    {lead.postUrl && <a href={lead.postUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, padding: "5px 12px", background: "#eff6ff", color: "#1d4ed8", borderRadius: 7, textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}>🔗 Xem bài</a>}
                    <button onClick={() => { if (confirm("Xóa lead này?")) fetch(`/api/marketing-leads/${lead.id}`, { method: "DELETE" }).then(() => fetch_()); }} style={{ background: "#fef2f2", border: "none", borderRadius: 7, padding: "5px 10px", fontSize: 12, cursor: "pointer", color: "#dc2626" }}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setSelectedLead(null); }}>
          <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>📋 Chi tiết Lead</h2>
              <button onClick={() => setSelectedLead(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: SCORE_BG(selectedLead.aiScore || 0), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `2px solid ${SCORE_COLOR(selectedLead.aiScore || 0)}44` }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: SCORE_COLOR(selectedLead.aiScore || 0) }}>{selectedLead.aiScore}</span>
                <span style={{ fontSize: 9, color: SCORE_COLOR(selectedLead.aiScore || 0) }}>/ 10</span>
              </div>
              <div>
                {selectedLead.authorName && <div style={{ fontWeight: 700, fontSize: 15 }}>👤 {selectedLead.authorName}</div>}
                <div style={{ fontSize: 12, color: "#64748b" }}>{selectedLead.platform === "facebook" ? "📘 Facebook" : "💬 Zalo"} {selectedLead.groupName && `• ${selectedLead.groupName}`}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{new Date(selectedLead.createdAt).toLocaleString("vi")}</div>
              </div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 13, color: "#334155", lineHeight: 1.7, maxHeight: 160, overflowY: "auto" }}>{selectedLead.postContent}</div>
            {selectedLead.aiAnalysis && <div style={{ background: "#fffbeb", borderRadius: 10, padding: 14, marginBottom: 10, fontSize: 13 }}><strong>📊 Phân tích:</strong> {selectedLead.aiAnalysis}</div>}
            {selectedLead.aiSuggest && <div style={{ background: "#ecfdf5", borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 13 }}><strong>💬 Gợi ý tiếp cận:</strong> {selectedLead.aiSuggest}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>Trạng thái</label>
                <select defaultValue={selectedLead.status} onChange={e => updateLead(selectedLead.id, { status: e.target.value })} style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none" }}>
                  {Object.entries(STATUS_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>Giao cho nhân viên</label>
                <input defaultValue={selectedLead.assignedTo || ""} onBlur={e => updateLead(selectedLead.id, { assignedTo: e.target.value })} placeholder="Tên nhân viên sale..." style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>Ghi chú của Sale</label>
                <textarea defaultValue={selectedLead.saleNote || ""} onBlur={e => updateLead(selectedLead.id, { saleNote: e.target.value })} rows={3} placeholder="Kết quả tiếp cận, phản hồi của khách..." style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
            {selectedLead.postUrl && <a href={selectedLead.postUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", textAlign: "center", marginTop: 14, padding: 10, background: "#eff6ff", color: "#1d4ed8", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 13 }}>🔗 Mở bài viết gốc trên {selectedLead.platform === "facebook" ? "Facebook" : "Zalo"}</a>}
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {showScanner && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setShowScanner(false); }}>
          <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 560, maxHeight: "95vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800 }}>🔍 Quét Lead từ Group</h2>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b" }}>Vào Group Facebook/Zalo → Copy bài viết → Paste vào đây → AI sẽ phân tích tiềm năng</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Platform */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Nền tảng</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["facebook","📘 Facebook","#1877F2","#E7F0FF"],["zalo","💬 Zalo","#0068FF","#E0EEFF"]].map(([v,l,c,bg]) => (
                    <button key={v} onClick={() => setPlatform(v)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `2px solid ${platform === v ? c : "#e2e8f0"}`, background: platform === v ? bg : "white", cursor: "pointer", fontSize: 13, fontWeight: 600, color: platform === v ? c : "#64748b" }}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Tên Group (tùy chọn)</label>
                <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="VD: Hội NLMT Miền Nam" style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Link bài viết (tùy chọn)</label>
                <input value={postUrl} onChange={e => setPostUrl(e.target.value)} placeholder="https://www.facebook.com/groups/..." style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Nội dung bài viết * <span style={{ fontWeight: 400, color: "#94a3b8" }}>(copy từ Facebook/Zalo rồi paste vào đây)</span></label>
                <textarea value={postContent} onChange={e => setPostContent(e.target.value)} rows={6} placeholder={"Ví dụ:\n\nNguyễn Văn A: Nhà mình đang dùng điện 3 triệu/tháng, muốn lắp điện mặt trời mà không biết chi phí bao nhiêu, ai tư vấn giúp với..."} style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }} />
              </div>

              {/* AI Result */}
              {analysisResult && (
                <div style={{ borderRadius: 12, overflow: "hidden", border: `2px solid ${SCORE_COLOR(analysisResult.score)}44` }}>
                  <div style={{ background: SCORE_BG(analysisResult.score), padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: SCORE_COLOR(analysisResult.score) }}>{analysisResult.score}/10</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: analysisResult.score >= 8 ? "#059669" : analysisResult.score >= 5 ? "#b45309" : "#64748b" }}>
                        {analysisResult.score >= 8 ? "🔥 Tiềm năng CAO" : analysisResult.score >= 5 ? "⚡ Tiềm năng TRUNG BÌNH" : "❄️ Tiềm năng THẤP"}
                      </div>
                      {analysisResult.urgency && <div style={{ fontSize: 11, color: "#64748b" }}>Mức độ khẩn: {analysisResult.urgency === "high" ? "🔴 Cao" : analysisResult.urgency === "medium" ? "🟡 Vừa" : "🟢 Thấp"}</div>}
                    </div>
                  </div>
                  <div style={{ padding: "12px 16px", background: "white", display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                    {analysisResult.authorName && <div>👤 <strong>Tác giả:</strong> {analysisResult.authorName}</div>}
                    <div>📊 <strong>Phân tích:</strong> {analysisResult.analysis}</div>
                    {analysisResult.signals?.length > 0 && <div>🎯 <strong>Tín hiệu:</strong> {analysisResult.signals.join(" • ")}</div>}
                    <div style={{ background: "#ecfdf5", borderRadius: 8, padding: "8px 12px" }}>💬 <strong>Gợi ý cho Sale:</strong> {analysisResult.suggest}</div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowScanner(false)} style={{ flex: 1, background: "#f1f5f9", border: "none", borderRadius: 10, padding: 12, fontSize: 14, cursor: "pointer", fontWeight: 600, color: "#334155" }}>Hủy</button>
              {!analysisResult ? (
                <button onClick={analyze} disabled={!postContent.trim() || analyzing} style={{ flex: 2, background: postContent.trim() && !analyzing ? "linear-gradient(135deg,#3b82f6,#1d4ed8)" : "#e2e8f0", color: postContent.trim() && !analyzing ? "white" : "#94a3b8", border: "none", borderRadius: 10, padding: 12, fontSize: 14, cursor: postContent.trim() && !analyzing ? "pointer" : "not-allowed", fontWeight: 700 }}>
                  {analyzing ? "🤖 AI đang phân tích..." : "🤖 Phân tích với AI"}
                </button>
              ) : (
                <button onClick={saveLead} disabled={saving} style={{ flex: 2, background: saving ? "#e2e8f0" : "linear-gradient(135deg,#10b981,#059669)", color: saving ? "#94a3b8" : "white", border: "none", borderRadius: 10, padding: 12, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>
                  {saving ? "Đang lưu..." : "✅ Lưu Lead & Giao Sale"}
                </button>
              )}
            </div>
            {analysisResult && <button onClick={() => setAnalysisResult(null)} style={{ width: "100%", marginTop: 8, background: "none", border: "none", fontSize: 12, color: "#94a3b8", cursor: "pointer" }}>← Phân tích lại</button>}
          </div>
        </div>
      )}
    </div>
  );
}
