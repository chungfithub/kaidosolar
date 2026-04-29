"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Settings2, Loader2, UploadCloud } from "lucide-react";
import { createWorker } from "tesseract.js";

export default function AiProductUploader({ onParsedData }: { onParsedData?: (data: any) => void }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState("");
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");
  const router = useRouter();

  const handleAIUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsScanning(true);
    setScanProgress(0);

    const results: any[] = [];

    let worker: any = null;
    if (aiModel === "tesseract") {
      worker = await createWorker({
        logger: m => {
          if (m.status === 'recognizing text') {
            setScanProgress(Math.floor(m.progress * 100));
          }
        }
      });
      await worker.loadLanguage('eng+vie');
      await worker.initialize('eng+vie');
    }

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setScanStatus(`Đang xử lý ảnh ${i + 1}/${files.length}...`);

        if (aiModel === "tesseract") {
          const { data: { text } } = await worker.recognize(file);
          results.push({ specs: "\n\n--- Dữ liệu từ ảnh (Offline) ---\n" + text, name: "Sản phẩm " + (i + 1) });
        } else {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("modelName", aiModel);

          const res = await fetch("/api/parse-product", {
            method: "POST",
            body: formData
          });

          const data = await res.json();
          if (!data.error) {
            // New format: { products: [...], rawText: "..." }
            // Fallback: old format was array directly
            const items = Array.isArray(data) ? data : (Array.isArray(data.products) ? data.products : [data]);
            items.forEach((item: any) => {
              if (!item.name) item.name = "Sản phẩm mới";
              results.push(item);
            });
            // Save price table text to window for AI chat to use automatically
            if (data.rawText) {
              (window as any).__kaidoCatalogueCache = {
                text: data.rawText,
                label: file.name,
              };
            }
          } else {
            console.error("Lỗi AI cho file", file.name, data.error);
            results.push({ name: "Lỗi phân tích: " + file.name, specs: "Lỗi: " + data.error });
          }
        }
      }

      if (worker) {
        await worker.terminate();
      }

      if (onParsedData) {
        onParsedData(results);
      } else {
        sessionStorage.setItem("pendingAiProducts", JSON.stringify(results));
        router.push("/admin/products/new");
      }
    } catch (err) {
      console.error("AI Parse Failed", err);
      alert("Lỗi khi kết nối với hệ thống. Vui lòng thử lại.");
    } finally {
      setIsScanning(false);
      setScanStatus("");
    }
  };

  return (
    <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(to right, rgba(16,185,129,0.05), rgba(59,130,246,0.05))', border: '2px dashed var(--primary-light)' }}>
      <div className="card-header" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '18px', color: 'var(--primary)', marginRight: '8px' }}><Bot size={24} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
          <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Thêm nhanh Sản phẩm bằng AI</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings2 size={16} style={{ color: 'var(--text-muted)' }} />
          <select
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              background: 'white',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="gemini-2.5-flash">Gemini Flash (Miễn phí / Nhanh)</option>
            <option value="gemini-2.5-pro">Gemini Pro (Trả phí / Ổn định cao)</option>
            <option value="tesseract">Quét Offline (Chậm / Không bao giờ nghẽn)</option>
          </select>
        </div>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', padding: '0 24px' }}>Có thể tải lên nhiều hình ảnh hoặc file PDF catalogue (Bảng báo giá) cùng lúc. Hệ thống sẽ tự động quét và phân tách toàn bộ các sản phẩm có trong tài liệu.</p>

      <div style={{ padding: '0 24px 24px' }}>
        <label style={{
          width: '100%',
          minHeight: '120px',
          background: 'rgba(255,255,255,0.8)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isScanning ? 'not-allowed' : 'pointer',
          transition: '0.2s',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <input type="file" accept="image/*,application/pdf" multiple style={{ display: 'none' }} onChange={handleAIUpload} disabled={isScanning} />

          {isScanning ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 10 }}>
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
              <span style={{ fontWeight: 500, color: 'var(--primary)' }}>
                {scanStatus || "Đang phân tích dữ liệu..."}
                {aiModel === 'tesseract' ? ` (${scanProgress}%)` : ''}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <UploadCloud size={32} style={{ color: '#94a3b8' }} />
              <span style={{ fontWeight: 500, color: '#64748b' }}>Nhấn để chọn hoặc kéo thả Hình ảnh/PDF Catalogue vào đây</span>
            </div>
          )}

          {isScanning && aiModel === 'tesseract' && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, height: '4px', background: 'var(--primary)', width: `${scanProgress}%`, transition: 'width 0.2s ease-out' }}></div>
          )}
        </label>
      </div>
    </div>
  );
}
