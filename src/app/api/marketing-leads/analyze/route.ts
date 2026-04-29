import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Chưa cấu hình GEMINI_API_KEY" }, { status: 400 });
    }

    const { postContent, platform, groupName } = await req.json();

    if (!postContent?.trim()) {
      return NextResponse.json({ error: "Không có nội dung để phân tích" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `Bạn là chuyên gia phân tích khách hàng tiềm năng ngành Điện Mặt Trời (Solar) tại Việt Nam.

Phân tích bài viết dưới đây từ ${platform === "facebook" ? "Facebook" : "Zalo"}${groupName ? ` (Group: ${groupName})` : ""}.

BÀI VIẾT:
---
${postContent}
---

Hãy trả lời theo đúng định dạng JSON sau (KHÔNG thêm bất kỳ text nào ngoài JSON):
{
  "score": <số từ 1-10, 10 là tiềm năng cao nhất>,
  "isLead": <true hoặc false>,
  "authorName": "<tên người đăng nếu tìm thấy trong bài, nếu không có để null>",
  "analysis": "<phân tích ngắn gọn 2-3 câu: tại sao đây là/không là khách hàng tiềm năng>",
  "signals": ["<dấu hiệu 1>", "<dấu hiệu 2>"],
  "suggest": "<gợi ý cụ thể cho nhân viên sale cách tiếp cận người này, nên nói gì, hỏi gì>",
  "urgency": "high|medium|low"
}

Tiêu chí chấm điểm:
- 8-10: Hỏi thẳng về điện mặt trời, xin báo giá, đang cân nhắc lắp đặt
- 5-7: Phàn nàn hóa đơn điện cao, hỏi về tiết kiệm điện, quan tâm năng lượng sạch
- 3-4: Đăng về bất động sản/nhà mới, doanh nghiệp có nhu cầu điện lớn
- 1-2: Không liên quan hoặc chỉ hỏi thông tin chung`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.1, thinkingConfig: { thinkingBudget: 3000 } }
    });

    const raw = response.text || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI không trả về JSON hợp lệ");

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
