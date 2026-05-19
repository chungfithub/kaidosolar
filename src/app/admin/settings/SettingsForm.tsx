"use client";

import { useState, useTransition } from "react";
import { saveSetting } from "@/app/actions/settings";

export default function SettingsForm({ initialGeminiKey }: { initialGeminiKey: string }) {
  const [isPending, startTransition] = useTransition();
  const [apiKey, setApiKey] = useState(initialGeminiKey);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    startTransition(async () => {
      const result = await saveSetting("GEMINI_API_KEY", apiKey);
      if (result.success) {
        setMessage({ text: "Lưu cấu hình thành công! (Khóa đã được mã hóa an toàn)", type: "success" });
      } else {
        setMessage({ text: "Lỗi: " + result.error, type: "error" });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
          Google Gemini API Key
        </label>
        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "8px" }}>
          Khóa này sẽ được <strong>mã hóa tự động</strong> trước khi lưu vào cơ sở dữ liệu.
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              fontSize: "1rem",
              fontFamily: showKey ? "monospace" : "inherit"
            }}
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            style={{
              padding: "0 16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            {showKey ? "Ẩn" : "Hiện"}
          </button>
        </div>
      </div>

      {message.text && (
        <div style={{
          padding: "12px",
          borderRadius: "6px",
          backgroundColor: message.type === "success" ? "#d1fae5" : "#fee2e2",
          color: message.type === "success" ? "#065f46" : "#991b1b",
          fontSize: "0.95rem"
        }}>
          {message.text}
        </div>
      )}

      <div>
        <button 
          type="submit" 
          disabled={isPending}
          style={{ 
            background: "var(--primary)", 
            color: "white", 
            padding: "10px 20px", 
            border: "none", 
            borderRadius: "6px", 
            cursor: isPending ? "not-allowed" : "pointer",
            fontWeight: 500,
            opacity: isPending ? 0.7 : 1
          }}
        >
          {isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  );
}
