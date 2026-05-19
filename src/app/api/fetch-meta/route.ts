import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
  }

  try {
    // Giả lập User-Agent của một trình duyệt thông thường để tránh bị block quá dễ
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      next: { revalidate: 3600 }, // Cache response 1 giờ nếu cùng URL
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // Dùng Regex tìm <title>
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    let title = titleMatch ? titleMatch[1] : "";
    
    // Xóa chữ "| Facebook" hoặc "- Facebook" nếu có
    title = title.replace(/\s*[-|]\s*Facebook\s*$/i, "").trim();

    // Dùng Regex tìm meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) 
                   || html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const description = descMatch ? descMatch[1] : "";

    // Phân tích số thành viên từ description (VD: "có 10.5K thành viên" hoặc "has 10,500 members")
    let membersCount = null;
    const membersMatch = description.match(/(?:có|has)\s+([\d.,KkMm]+)\s*(?:thành viên|members)/i);
    
    if (membersMatch) {
      let countStr = membersMatch[1].toUpperCase();
      let multiplier = 1;
      
      if (countStr.includes("K")) {
        multiplier = 1000;
        countStr = countStr.replace("K", "");
      } else if (countStr.includes("M")) {
        multiplier = 1000000;
        countStr = countStr.replace("M", "");
      }

      // Xóa dấu phẩy phân cách hàng nghìn (VD: 10,500 -> 10500) nhưng giữ dấu chấm thập phân nếu có K/M
      // Tuy nhiên ở VN có thể dùng dấu chấm hoặc phẩy lộn xộn.
      // Cách đơn giản: Nếu có K, M thì dấu chấm/phẩy là thập phân.
      if (multiplier > 1) {
        countStr = countStr.replace(",", "."); // Đưa về chuẩn float
      } else {
        countStr = countStr.replace(/[,.]/g, ""); // Số nguyên bình thường (10.500 -> 10500)
      }

      const parsed = parseFloat(countStr) * multiplier;
      if (!isNaN(parsed)) {
        membersCount = Math.round(parsed);
      }
    }

    // Nhận diện quyền riêng tư
    let privacy = "public";
    if (title.match(/nhóm kín|private group/i) || description.match(/nhóm kín|private group/i)) {
      privacy = "private";
    }

    return NextResponse.json({
      title,
      description,
      membersCount,
      privacy
    });

  } catch (error: any) {
    console.error("Fetch Meta Error:", error.message);
    // Vẫn trả về 200 nhưng null data để client không sập, mà chỉ giữ trống ô nhập
    return NextResponse.json({
      title: "",
      description: "",
      membersCount: null,
      privacy: "public",
      error: "Không thể lấy dữ liệu"
    });
  }
}
