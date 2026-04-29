import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Chưa cấu hình GEMINI_API_KEY" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const modelName = (formData.get("modelName") as string) || "gemini-2.5-flash";

    if (!file) {
      return NextResponse.json({ error: "Không tìm thấy hình ảnh" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const imageBase64 = buffer.toString("base64");

    // Single comprehensive call — returns both structured JSON AND raw price table
    // Using thinking mode for better image reasoning (like Gemini.google.com)
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{
        role: "user",
        parts: [
          { inlineData: { data: imageBase64, mimeType: file.type } },
          {
            text: `Bạn là chuyên gia OCR và phân tích tài liệu thiết bị điện mặt trời.

Hãy đọc kỹ từng ô, từng hàng, từng cột trong tài liệu/hình ảnh này.

## NHIỆM VỤ 1: TRÍCH XUẤT BẢNG GIÁ ĐẦY ĐỦ
Đọc TOÀN BỘ bảng giá — tất cả hàng, tất cả cột giá. 
Xuất ra dưới dạng text theo format:
RAW_TABLE_START
Tên sản phẩm | Cột giá 1 | Cột giá 2 | Cột giá 3 | ...
[mỗi SP một dòng, giá là số nguyên VNĐ không có dấu phẩy, ví dụ 1200000]
RAW_TABLE_END

## NHIỆM VỤ 2: TRÍCH XUẤT SẢN PHẨM DẠNG JSON
Phân tách từng sản phẩm riêng biệt. Trả về JSON array:
JSON_START
[
  {
    "name": "Tên sản phẩm ngắn gọn (VD: LONGi HIMO X10 NHE 540W)",
    "brand": "Thương hiệu (VD: LONGi, Jinko, Huawei, Growatt)",
    "capacity": "Công suất (VD: 540W, 10kW, 16kWh)",
    "warrantyNum": "Số năm/tháng bảo hành (chỉ lấy số, VD: 12)",
    "warrantyUnit": "năm hoặc tháng",
    "category": "panels hoặc inverters hoặc batteries hoặc accessories",
    "price": "Giá bán lẻ (số nguyên VNĐ, lấy cột giá thấp nhất hoặc giá 1 đơn vị nếu có)",
    "specs": "Thông số kỹ thuật chi tiết, mỗi thông số xuống dòng bằng \\n"
  }
]
JSON_END

## LƯU Ý QUAN TRỌNG:
- Đọc CẨN THẬN từng số — không được bỏ sót hoặc nhầm lẫn
- Nếu có nhiều cột giá (1 pallet, 5 pallet, 10 pallet...) — ghi ĐẦY ĐỦ vào RAW_TABLE
- Giá trị số: bỏ dấu phẩy/chấm phân cách hàng nghìn, chỉ giữ số nguyên
- Nếu đơn vị là triệu đồng (tr), nhân với 1.000.000
- Nếu là USD, ghi nguyên USD và ghi chú "(USD)"
- Tên sản phẩm: giữ nguyên tên đầy đủ như trong tài liệu`
          }
        ]
      }],
      config: {
        temperature: 0,  // Maximum accuracy for OCR
        thinkingConfig: {
          thinkingBudget: 8000,  // Deep thinking for complex tables
        },
      }
    });

    const fullText = response.text || "";

    // Extract RAW_TABLE
    const rawTableMatch = fullText.match(/RAW_TABLE_START\n?([\s\S]*?)\nRAW_TABLE_END/);
    const rawText = rawTableMatch ? rawTableMatch[1].trim() : "";

    // Extract JSON
    const jsonMatch = fullText.match(/JSON_START\n?([\s\S]*?)\nJSON_END/);
    let products: any[] = [];
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        products = Array.isArray(parsed) ? parsed : [parsed];
        products = products.map(p => ({ ...p, name: p.name || "Sản phẩm mới" }));
      } catch {
        // Fallback: try to parse entire response as JSON
        const jsonFallback = fullText.match(/\[[\s\S]*\]/);
        if (jsonFallback) {
          try { products = JSON.parse(jsonFallback[0]); } catch { /* ignore */ }
        }
      }
    }

    if (products.length === 0 && !rawText) {
      return NextResponse.json({ error: "Không đọc được dữ liệu từ ảnh. Vui lòng thử lại hoặc dùng ảnh rõ hơn." }, { status: 422 });
    }

    return NextResponse.json({ products, rawText });

  } catch (error: any) {
    console.error("AI Parse Error:", error);
    const msg = error.message || "";
    if (msg.includes("503") || msg.includes("UNAVAILABLE")) {
      return NextResponse.json({ error: "Hệ thống AI đang quá tải. Vui lòng đợi vài giây và thử lại!" }, { status: 503 });
    }
    if (msg.includes("429") || msg.includes("quota") || msg.includes("limit: 0")) {
      return NextResponse.json({ error: "Vượt giới hạn miễn phí. Vui lòng chuyển sang 'Gemini Flash'." }, { status: 429 });
    }
    return NextResponse.json({ error: "Lỗi hệ thống: " + msg }, { status: 500 });
  }
}
