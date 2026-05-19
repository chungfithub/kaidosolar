import { getSetting } from "@/app/actions/settings";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const geminiApiKey = await getSetting("GEMINI_API_KEY");

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "24px" }}>Cài đặt Hệ thống</h1>
      
      <div style={{ 
        background: "white", 
        padding: "24px", 
        borderRadius: "12px", 
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" 
      }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
          🤖 Cấu hình Trí Tuệ Nhân Tạo (AI)
        </h2>
        
        <SettingsForm initialGeminiKey={geminiApiKey || ""} />
      </div>
    </div>
  );
}
