"use client";

import { useState } from "react";
import { updateCustomerProfile, changeCustomerPassword } from "@/app/actions/customer-account";

export default function SettingsClient({ customer, accountId }: { customer: any, accountId: number }) {
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error", text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error", text: string } | null>(null);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);

  async function handleUpdateProfile(formData: FormData) {
    setIsSubmittingProfile(true);
    setProfileMsg(null);
    const res = await updateCustomerProfile(customer.id, formData);
    setProfileMsg({ type: res.success ? "success" : "error", text: res.message });
    setIsSubmittingProfile(false);
    if (res.success) {
      setIsEditingProfile(false);
    }
  }

  async function handleChangePassword(formData: FormData) {
    setIsSubmittingPassword(true);
    setPasswordMsg(null);
    const res = await changeCustomerPassword(accountId, formData);
    setPasswordMsg({ type: res.success ? "success" : "error", text: res.message });
    if (res.success) {
      // Clear password form
      const form = document.getElementById("passwordForm") as HTMLFormElement;
      if (form) form.reset();
    }
    setIsSubmittingPassword(false);
  }

  const [shippingMsg, setShippingMsg] = useState<{ type: "success" | "error", text: string } | null>(null);
  const [isSubmittingShipping, setIsSubmittingShipping] = useState(false);
  const [isEditingShipping, setIsEditingShipping] = useState(false);

  async function handleUpdateShipping(formData: FormData) {
    setIsSubmittingShipping(true);
    setShippingMsg(null);
    // Import updateCustomerShipping from actions (need to ensure it's imported at top)
    const { updateCustomerShipping } = await import("@/app/actions/customer-account");
    const res = await updateCustomerShipping(customer.id, formData);
    setShippingMsg({ type: res.success ? "success" : "error", text: res.message });
    setIsSubmittingShipping(false);
    if (res.success) {
      setIsEditingShipping(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      
      {/* 1. Profile Update Form */}
      <div style={{ background: "white", padding: "32px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "1.25rem", margin: 0, color: "var(--text)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ background: "var(--primary-light)", color: "white", width: "28px", height: "28px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>👤</span>
            Thông tin cá nhân (Chủ tài khoản)
          </h3>
          {!isEditingProfile && (
            <button type="button" onClick={() => setIsEditingProfile(true)} style={{ background: "transparent", border: "1px solid var(--border)", padding: "8px 16px", borderRadius: "8px", color: "var(--text)", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", transition: "all 0.2s" }}>
              Thay đổi thông tin
            </button>
          )}
        </div>
        
        {profileMsg && (
          <div style={{ padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.95rem", background: profileMsg.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: profileMsg.type === "success" ? "var(--primary)" : "#ef4444" }}>
            {profileMsg.type === "success" ? "✓ " : "⚠️ "}{profileMsg.text}
          </div>
        )}

        <form action={handleUpdateProfile}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "24px", maxWidth: "400px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>Họ và tên</label>
              <input type="text" name="name" defaultValue={customer.name} required readOnly={!isEditingProfile} style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border)", outline: "none", fontSize: "1rem", background: isEditingProfile ? "white" : "rgba(0,0,0,0.02)", color: isEditingProfile ? "var(--text)" : "var(--text-muted)", cursor: isEditingProfile ? "text" : "not-allowed" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>Số điện thoại đăng ký</label>
              <input type="text" name="phone" defaultValue={customer.phone} required readOnly={!isEditingProfile} style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border)", outline: "none", fontSize: "1rem", background: isEditingProfile ? "white" : "rgba(0,0,0,0.02)", color: isEditingProfile ? "var(--text)" : "var(--text-muted)", cursor: isEditingProfile ? "text" : "not-allowed" }} />
            </div>
          </div>
          
          {isEditingProfile && (
            <div style={{ marginBottom: "24px", maxWidth: "400px" }}>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>Nhập mật khẩu hiện tại để xác nhận</label>
              <input type="password" name="password" required style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border)", outline: "none", fontSize: "1rem" }} />
            </div>
          )}
          
          {isEditingProfile && (
            <div style={{ display: "flex", gap: "12px" }}>
              <button type="submit" disabled={isSubmittingProfile} style={{ padding: "12px 24px", background: "var(--primary)", color: "white", border: "none", borderRadius: "10px", fontWeight: 600, fontSize: "0.95rem", cursor: isSubmittingProfile ? "not-allowed" : "pointer", opacity: isSubmittingProfile ? 0.7 : 1, transition: "all 0.2s" }}>
                {isSubmittingProfile ? "Đang lưu..." : "Lưu thông tin cá nhân"}
              </button>
              <button type="button" onClick={() => setIsEditingProfile(false)} disabled={isSubmittingProfile} style={{ padding: "12px 24px", background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "10px", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", transition: "all 0.2s" }}>
                Hủy
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 2. Shipping Address Form */}
      <div style={{ background: "white", padding: "32px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "1.25rem", margin: 0, color: "var(--text)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ background: "#f59e0b", color: "white", width: "28px", height: "28px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>🏠</span>
            Sổ địa chỉ giao hàng / Lắp đặt
          </h3>
          {!isEditingShipping && (
            <button type="button" onClick={() => setIsEditingShipping(true)} style={{ background: "transparent", border: "1px solid var(--border)", padding: "8px 16px", borderRadius: "8px", color: "var(--text)", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", transition: "all 0.2s" }}>
              Thay đổi địa chỉ
            </button>
          )}
        </div>
        
        {shippingMsg && (
          <div style={{ padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.95rem", background: shippingMsg.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: shippingMsg.type === "success" ? "var(--primary)" : "#ef4444" }}>
            {shippingMsg.type === "success" ? "✓ " : "⚠️ "}{shippingMsg.text}
          </div>
        )}

        <form action={handleUpdateShipping}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "20px", maxWidth: "400px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>Tên người nhận</label>
              <input type="text" name="shippingName" defaultValue={customer.shippingName || ""} placeholder="VD: Nguyễn Văn B" required readOnly={!isEditingShipping} style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border)", outline: "none", fontSize: "1rem", background: isEditingShipping ? "white" : "rgba(0,0,0,0.02)", color: isEditingShipping ? "var(--text)" : "var(--text-muted)", cursor: isEditingShipping ? "text" : "not-allowed" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>SĐT người nhận</label>
              <input type="text" name="shippingPhone" defaultValue={customer.shippingPhone || ""} placeholder="VD: 0987654321" required readOnly={!isEditingShipping} style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border)", outline: "none", fontSize: "1rem", background: isEditingShipping ? "white" : "rgba(0,0,0,0.02)", color: isEditingShipping ? "var(--text)" : "var(--text-muted)", cursor: isEditingShipping ? "text" : "not-allowed" }} />
            </div>
          </div>
          <div style={{ marginBottom: "24px", maxWidth: "820px" }}>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>Địa chỉ giao hàng</label>
            <input type="text" name="shippingAddress" defaultValue={customer.shippingAddress || ""} placeholder="VD: Số nhà, Tên đường, Quận, Thành phố" required readOnly={!isEditingShipping} style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border)", outline: "none", fontSize: "1rem", background: isEditingShipping ? "white" : "rgba(0,0,0,0.02)", color: isEditingShipping ? "var(--text)" : "var(--text-muted)", cursor: isEditingShipping ? "text" : "not-allowed" }} />
          </div>
          
          {isEditingShipping && (
            <div style={{ display: "flex", gap: "12px" }}>
              <button type="submit" disabled={isSubmittingShipping} style={{ padding: "12px 24px", background: "#f59e0b", color: "white", border: "none", borderRadius: "10px", fontWeight: 600, fontSize: "0.95rem", cursor: isSubmittingShipping ? "not-allowed" : "pointer", opacity: isSubmittingShipping ? 0.7 : 1, transition: "all 0.2s" }}>
                {isSubmittingShipping ? "Đang lưu..." : "Cập nhật địa chỉ"}
              </button>
              <button type="button" onClick={() => setIsEditingShipping(false)} disabled={isSubmittingShipping} style={{ padding: "12px 24px", background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "10px", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", transition: "all 0.2s" }}>
                Hủy
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 2. Change Password Form */}
      <div style={{ background: "white", padding: "32px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid var(--border)" }}>
        <h3 style={{ fontSize: "1.25rem", marginBottom: "24px", color: "var(--text)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ background: "#3b82f6", color: "white", width: "28px", height: "28px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>🔒</span>
          Đổi mật khẩu
        </h3>

        {passwordMsg && (
          <div style={{ padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.95rem", background: passwordMsg.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: passwordMsg.type === "success" ? "var(--primary)" : "#ef4444" }}>
            {passwordMsg.type === "success" ? "✓ " : "⚠️ "}{passwordMsg.text}
          </div>
        )}

        <form id="passwordForm" action={handleChangePassword}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>Mật khẩu hiện tại</label>
            <input type="password" name="currentPassword" required style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border)", outline: "none", fontSize: "1rem", maxWidth: "400px" }} />
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px", maxWidth: "820px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>Mật khẩu mới</label>
              <input type="password" name="newPassword" required minLength={6} style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border)", outline: "none", fontSize: "1rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>Xác nhận mật khẩu mới</label>
              <input type="password" name="confirmPassword" required minLength={6} style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border)", outline: "none", fontSize: "1rem" }} />
            </div>
          </div>
          
          <button type="submit" disabled={isSubmittingPassword} style={{ padding: "12px 24px", background: "#3b82f6", color: "white", border: "none", borderRadius: "10px", fontWeight: 600, fontSize: "0.95rem", cursor: isSubmittingPassword ? "not-allowed" : "pointer", opacity: isSubmittingPassword ? 0.7 : 1, transition: "all 0.2s" }}>
            {isSubmittingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}
          </button>
        </form>
      </div>

    </div>
  );
}
