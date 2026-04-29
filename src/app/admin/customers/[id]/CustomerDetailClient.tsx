"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createAccountForCustomer,
  toggleAccountStatus,
  unlinkAccount,
  updateCustomerInfo,
  deleteCustomerById,
} from "@/app/actions/customer-admin";
import { Shield, ShieldOff, Link2Off, Trash2, Save, KeyRound } from "lucide-react";

interface Account {
  id: number;
  email: string;
  status: string;
  createdAt: Date;
}

interface CustomerDetailClientProps {
  customerId: number;
  initialName: string;
  initialPhone: string;
  initialEmail: string;
  initialAddress: string;
  account: Account | null;
}

export default function CustomerDetailClient({
  customerId,
  initialName,
  initialPhone,
  initialEmail,
  initialAddress,
  account,
}: CustomerDetailClientProps) {
  const router = useRouter();

  // Edit info state
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [address, setAddress] = useState(initialAddress ?? "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Create account state
  const [tempPass, setTempPass] = useState("");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  // Account actions state
  const [toggling, setToggling] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaveMsg("");
    const res = await updateCustomerInfo(customerId, { name, phone, email, address });
    setSaving(false);
    setSaveMsg(res.success ? "✅ Đã lưu thay đổi" : `❌ ${res.error}`);
    setTimeout(() => setSaveMsg(""), 3000);
  }

  async function handleCreateAccount() {
    setCreating(true);
    setCreateMsg("");
    const res = await createAccountForCustomer(customerId, tempPass);
    setCreating(false);
    if (res.success) {
      setCreateMsg("✅ Đã tạo tài khoản thành công!");
      router.refresh();
    } else {
      setCreateMsg(`❌ ${res.error}`);
    }
  }

  async function handleToggle() {
    if (!account) return;
    setToggling(true);
    await toggleAccountStatus(account.id);
    setToggling(false);
    router.refresh();
  }

  async function handleUnlink() {
    if (!account) return;
    if (!confirm("Gỡ liên kết tài khoản web khỏi khách hàng này?")) return;
    setUnlinking(true);
    await unlinkAccount(account.id, customerId);
    setUnlinking(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Xóa vĩnh viễn khách hàng này? Tất cả đơn hàng, dự án và tài khoản sẽ bị xóa.")) return;
    setDeleting(true);
    await deleteCustomerById(customerId);
    router.push("/admin/customers");
  }

  const isActive = account?.status === "active";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* ── Thông tin cơ bản ── */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>📋 Thông tin khách hàng</h2>
        <div className="customer-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <label style={labelStyle}>
            Họ tên
            <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Số điện thoại
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="Chưa có email" />
          </label>
          <label style={labelStyle}>
            Địa chỉ
            <input value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} placeholder="Chưa có địa chỉ" />
          </label>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ ...btnStyle, background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid #10b98140" }}
          >
            <Save size={15} />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          {saveMsg && <span style={{ fontSize: "0.88rem", color: saveMsg.startsWith("✅") ? "#10b981" : "#ef4444" }}>{saveMsg}</span>}
        </div>
      </section>

      {/* ── Tài khoản web ── */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>🌐 Tài khoản web</h2>

        {account ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Status banner */}
            <div style={{
              display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px",
              borderRadius: "12px",
              background: isActive ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${isActive ? "#10b98130" : "#ef444430"}`,
            }}>
              <div style={{ fontSize: "1.5rem" }}>{isActive ? "🟢" : "🔴"}</div>
              <div>
                <div style={{ fontWeight: 700, color: isActive ? "#10b981" : "#ef4444" }}>
                  {isActive ? "Tài khoản đang hoạt động" : "Tài khoản bị khóa"}
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Email: <strong>{account.email}</strong> · Tạo: {new Date(account.createdAt).toLocaleDateString("vi-VN")}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={handleToggle}
                disabled={toggling}
                style={{
                  ...btnStyle,
                  background: isActive ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                  color: isActive ? "#ef4444" : "#10b981",
                  border: `1px solid ${isActive ? "#ef444440" : "#10b98140"}`,
                }}
              >
                {isActive ? <ShieldOff size={15} /> : <Shield size={15} />}
                {toggling ? "Đang xử lý..." : isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
              </button>

              <button
                onClick={handleUnlink}
                disabled={unlinking}
                style={{ ...btnStyle, background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid #f59e0b40" }}
              >
                <Link2Off size={15} />
                {unlinking ? "Đang xử lý..." : "Gỡ liên kết"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{
              padding: "14px 18px", borderRadius: "12px",
              background: "rgba(107,114,128,0.08)", border: "1px solid #6b728030",
              color: "var(--text-muted)", fontSize: "0.9rem",
            }}>
              ⚫ Khách hàng này chưa có tài khoản web. Tạo tài khoản để họ có thể đăng nhập theo dõi đơn hàng.
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
              <label style={{ ...labelStyle, flex: 1 }}>
                <KeyRound size={14} style={{ display: "inline", marginRight: "4px" }} />
                Mật khẩu tạm thời
                <input
                  type="text"
                  value={tempPass}
                  onChange={(e) => setTempPass(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  style={inputStyle}
                />
              </label>
              <button
                onClick={handleCreateAccount}
                disabled={creating || !tempPass}
                style={{
                  ...btnStyle,
                  background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid #3b82f640",
                  marginBottom: "0",
                }}
              >
                {creating ? "Đang tạo..." : "Tạo tài khoản"}
              </button>
            </div>
            {createMsg && (
              <span style={{ fontSize: "0.88rem", color: createMsg.startsWith("✅") ? "#10b981" : "#ef4444" }}>
                {createMsg}
              </span>
            )}
            {email === "" && (
              <p style={{ fontSize: "0.8rem", color: "#f59e0b", margin: 0 }}>
                ⚠️ Khách hàng cần có email để tạo tài khoản.
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Xóa khách hàng ── */}
      <section style={{ ...sectionStyle, borderColor: "rgba(239,68,68,0.2)" }}>
        <h2 style={{ ...sectionTitle, color: "#ef4444" }}>⚠️ Vùng nguy hiểm</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "12px" }}>
          Xóa khách hàng sẽ xóa toàn bộ đơn hàng, dự án và tài khoản web liên quan. Hành động này không thể hoàn tác.
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ ...btnStyle, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid #ef444440" }}
        >
          <Trash2 size={15} />
          {deleting ? "Đang xóa..." : "Xóa khách hàng"}
        </button>
      </section>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const sectionStyle: React.CSSProperties = {
  background: "var(--dark-surface)",
  borderRadius: "16px",
  padding: "24px",
  border: "1px solid rgba(16,185,129,0.1)",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "1rem",
  fontWeight: 700,
  color: "var(--accent)",
  marginBottom: "4px",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  fontSize: "0.85rem",
  color: "var(--text-muted)",
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px",
  padding: "10px 14px",
  color: "var(--text)",
  fontSize: "0.95rem",
  outline: "none",
};

const btnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  padding: "9px 18px",
  borderRadius: "10px",
  fontWeight: 600,
  fontSize: "0.88rem",
  cursor: "pointer",
  border: "none",
  transition: "opacity 0.2s",
};
