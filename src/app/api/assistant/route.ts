import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Chưa cấu hình GEMINI_API_KEY" }, { status: 400 });
    }

    const { message, history, image, imageMimeType, cachedPriceTable, currentProducts } = await req.json();

    // Fetch live stats from DB
    const [productCount, totalStock, supplierCount, allProducts] = await Promise.all([
      prisma.product.count(),
      prisma.product.aggregate({ _sum: { stock: true } }),
      prisma.supplier.count(),
      prisma.product.findMany({
        select: { name: true, price: true, category: true, brand: true, stock: true },
        orderBy: { name: "asc" },
        take: 50, // up to 50 products for context
      }),
    ]);

    const lowStockProducts = allProducts.filter(p => p.stock < 5);
    const recentProducts = allProducts.slice(0, 5);

    // Fetch relevant memories for few-shot injection
    const keywords = message.split(/\s+/).slice(0, 3).join(" ");
    let memories: any[] = [];
    try {
      const memRes = await fetch(`${req.nextUrl.origin}/api/ai-memory?topic=${encodeURIComponent(keywords)}&limit=4`);
      if (memRes.ok) memories = await memRes.json();
    } catch { /* skip if memory fetch fails */ }

    // Build product editor context
    const productListContext = currentProducts?.length > 0
      ? `\n## SẢN PHẨM ĐANG CÓ TRONG FORM CHỈNH SỬA (${currentProducts.length} sản phẩm):\n` +
        currentProducts.map((p: any, i: number) =>
          `${i + 1}. "${p.name}" | giá_bán=${p.price || 0} | giá_nhập=${p.importPrice || "chưa có"}`
        ).join('\n')
      : '\n## SẢN PHẨM TRONG FORM: (Chưa có sản phẩm nào)';

    const allProductsContext = allProducts.length > 0
      ? `\n## DANH SÁCH TẤT CẢ SẢN PHẨM TRONG HỆ THỐNG (${allProducts.length} SP):\n` +
        allProducts.map(p =>
          `- "${p.name}" | ${p.category} | ${p.brand || ''} | giá=${p.price.toLocaleString('vi')}đ | kho=${p.stock}`
        ).join('\n')
      : '';

    const memoriesContext = memories.length > 0
      ? `\n## VÍ DỤ THỰC TẾ ĐÃ XÁC NHẬN THÀNH CÔNG (học từ lịch sử):\n` +
        memories.map((m: any, i: number) =>
          `### Ví dụ ${i + 1}:\nNgười dùng: "${m.userInput}"\nAI đã làm: ${m.aiResponse.substring(0, 400)}`
        ).join('\n\n')
      : '';

    const priceTableContext = cachedPriceTable
      ? `\n## BẢNG GIÁ ĐÃ ĐƯỢC PHÂN TÍCH:\n${cachedPriceTable}\n`
      : '';

    const systemContext = `Bạn là Kaido AI — trợ lý thông minh của hệ thống quản trị Kaido Solar (công ty điện mặt trời Việt Nam).

## THÔNG TIN HỆ THỐNG:
- Tổng sản phẩm: ${productCount} | Tổng tồn kho: ${totalStock._sum.stock || 0} | Nhà cung cấp: ${supplierCount}
- Tồn kho thấp: ${lowStockProducts.length > 0 ? lowStockProducts.map(p => `${p.name}(${p.stock})`).join(', ') : 'Không có'}
${allProductsContext}
${productListContext}
${priceTableContext}
${memoriesContext}

## LUẬT BẮT BUỘC — PHẢI TUÂN THỦ TUYỆT ĐỐI:

**LUẬT 1: KHI NGƯỜI DÙNG YÊU CẦU ĐIỀN/SỬA DỮ LIỆU → PHẢI THỰC HIỆN NGAY bằng lệnh ACTION, KHÔNG được chỉ mô tả hay hỏi lại.**

**LUẬT 2: KHÔNG BAO GIỜ đặt lệnh ACTION vào trong code block (dấu \`\`\` hoặc \`).**

**LUẬT 3: Lệnh ACTION phải ở cuối câu trả lời, sau phần giải thích.**

**LUẬT 4: Khi có bảng giá trong BỘ NHỚ hoặc ảnh — PHẢI đọc và điền ngay, không hỏi lại.**

---

## CÁC LỆNH THAO TÁC (ACTION COMMANDS):

### A. Điền một giá trị cho TẤT CẢ sản phẩm:
\`\`\`
[[ACTION:tên_trường:giá_trị]]
\`\`\`
Ví dụ: [[ACTION:warranty:20 năm]]

### B. Điền bằng CÔNG THỨC (tính từ giá_bán hoặc tồn_kho của từng SP):
\`\`\`
[[ACTION:tên_trường:FORMULA:biểu_thức]]
\`\`\`
Ví dụ: [[ACTION:importPrice:FORMULA:price*0.7]]

### C. Điền TỪNG sản phẩm (dùng khi có bảng giá):
\`\`\`
[[ACTION_MAP:tên_trường:{"tên sp 1":giá1,"tên sp 2":giá2}]]
\`\`\`
Ví dụ: [[ACTION_MAP:importPrice:{"LONGI 540W":1200000,"JINKO 545W":1100000}]]

### D. Xóa toàn bộ danh sách: [[CLEAR_ALL]]
### E. Xóa một trường cho tất cả: [[CLEAR_FIELD:tên_trường]]

### Tên trường hợp lệ:
- **warranty** → Bảo hành (VD: "20 năm", "5 năm")
- **importPrice** → Giá nhập (số nguyên VNĐ)
- **price** → Giá bán (số nguyên VNĐ)
- **stock** → Tồn kho (số nguyên)
- **brand** → Thương hiệu
- **specs** → Thông số kỹ thuật
- **category** → panels / inverters / batteries / accessories

### Biến trong công thức (có thể dùng trong FORMULA):
- **price** = giá bán hiện tại của từng sản phẩm (số nguyên VNĐ)
- **importPrice** = giá nhập hiện tại của từng sản phẩm (số nguyên VNĐ)
- **stock** = số lượng tồn kho hiện tại

### Ví dụ công thức:
- Giá nhập = 70% giá bán: \`[[ACTION:importPrice:FORMULA:price*0.7]]\`
- Cộng thêm 30.000đ vào giá nhập: \`[[ACTION:importPrice:FORMULA:importPrice+30000]]\`
- Cộng thêm 30.000đ vào giá bán: \`[[ACTION:price:FORMULA:price+30000]]\`
- Giá bán = giá nhập × 1.3: \`[[ACTION:price:FORMULA:importPrice*1.3]]\`
- Giảm giá bán 5%: \`[[ACTION:price:FORMULA:price*0.95]]\`

---

## VÍ DỤ THỰC TẾ (FEW-SHOT):

**Ví dụ 1 — Điền bảo hành:**
Người dùng: "điền bảo hành 20 năm cho tất cả"
Trả lời đúng:
Đã điền bảo hành 20 năm cho tất cả ${currentProducts?.length || 0} sản phẩm.
[[ACTION:warranty:20 năm]]

---
**Ví dụ 2 — Giá nhập theo công thức:**
Người dùng: "giá nhập bằng 70% giá bán"
Trả lời đúng:
Đã tính giá nhập = 70% × giá bán cho từng sản phẩm.
[[ACTION:importPrice:FORMULA:price*0.7]]

---
**Ví dụ 2b — Cộng thêm vào giá hiện tại:**
Người dùng: "thêm 30.000đ vào giá nhập và giá bán"
Trả lời đúng:
Đã cộng thêm 30.000đ vào cả giá nhập và giá bán.
[[ACTION:importPrice:FORMULA:importPrice+30000]]
[[ACTION:price:FORMULA:price+30000]]

---
**Ví dụ 3 — Từ bảng giá (cột cụ thể):**
Người dùng: "điền giá nhập cột 10 pallet"
Trả lời đúng (đọc từ bảng giá trong BỘ NHỚ, map theo tên sản phẩm):
Đã đọc cột "10 Pallet" từ bảng giá và điền cho từng sản phẩm.
[[ACTION_MAP:importPrice:{"LONGI HIMO X10 NHE 540W":1300000,"JINKO TIGER NEO 545W":1400000}]]

---
**Ví dụ 4 — Sai (KHÔNG làm vậy):**
Người dùng: "giá nhập cột 10 pallet"
Trả lời SAI: "Tôi không thể truy cập bảng giá, bạn cần cung cấp thêm thông tin..."
→ SAI VÌ: Bảng giá đã có trong BỘ NHỚ, phải đọc và điền ngay.

---
**Ví dụ 5 — Xóa và sửa thông số:**
Người dùng: "xóa hết thông số kỹ thuật"
Trả lời đúng:
Đã xóa trắng thông số kỹ thuật cho tất cả sản phẩm.
[[CLEAR_FIELD:specs]]

---

## XỬ LÝ ẢNH BẢNG GIÁ:
Khi người dùng gửi ảnh:
1. Đọc TOÀN BỘ bảng giá — tên sản phẩm, tất cả cột giá
2. Xuất bảng tóm tắt để người dùng biết bạn đã đọc được gì
3. Nếu người dùng chỉ định cột → dùng [[ACTION_MAP:...]] điền ngay
4. Lưu bảng giá vào cache: [[PRICE_TABLE:\nSản phẩm | Cột1 | Cột2 | ...\nTên SP | giá | giá | ...\n]]

## ĐIỀU HƯỚNG:
- /admin → Tổng quan
- /admin/products → Danh sách sản phẩm
- /admin/products/new-ai → Thêm sản phẩm bằng AI
- /admin/inventory → Kho hàng
- /admin/orders → Đơn hàng
- /admin/customers → Khách hàng

## PHONG CÁCH TRẢ LỜI:
- Tiếng Việt, ngắn gọn, chuyên nghiệp
- Tối đa 200 từ (không tính lệnh ACTION)
- LUÔN thực hiện lệnh, không hỏi lại nếu đã có đủ thông tin`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Build user message parts
    const userParts: any[] = [];
    if (image && imageMimeType) {
      userParts.push({ inlineData: { mimeType: imageMimeType, data: image } });
    }
    userParts.push({ text: message });

    // Build conversation history (keep last 10 turns to save tokens)
    const recentHistory = (history || []).slice(-10);
    const contents = [
      ...recentHistory.map((h: { role: string; text: string }) => ({
        role: h.role,
        parts: [{ text: h.text }]
      })),
      { role: "user", parts: userParts }
    ];

    const useModel = "gemini-2.5-flash";

    const response = await ai.models.generateContent({
      model: useModel,
      contents,
      config: {
        systemInstruction: systemContext,
        temperature: 0.2,
        // Enable thinking for better reasoning on complex tasks
        thinkingConfig: {
          thinkingBudget: 5000,
        },
      }
    });

    return NextResponse.json({ reply: response.text });

  } catch (error: any) {
    console.error("Assistant error:", error);
    const msg = error.message || "";
    if (msg.includes("429") || msg.includes("quota")) {
      return NextResponse.json({ error: "Đã vượt giới hạn API. Vui lòng thử lại sau vài giây." }, { status: 429 });
    }
    return NextResponse.json({ error: "Lỗi kết nối AI: " + msg }, { status: 500 });
  }
}
