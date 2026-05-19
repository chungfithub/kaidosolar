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
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "max-age=0",
        "sec-ch-ua": "\"Not A(Brand\";v=\"99\", \"Google Chrome\";v=\"121\", \"Chromium\";v=\"121\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
      },
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
    let countStr = "";

    const fbJsonMatch = html.match(/"formatted_count_text":"([^"]+)"/i);
    if (fbJsonMatch) {
      // Decode unicode like "132,9K th\u00e0nh vi\u00ean"
      const decodedStr = fbJsonMatch[1].replace(/\\u[\dA-F]{4}/gi, (match) => {
        return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
      });
      const numMatch = decodedStr.match(/([\d\.,]+[KkMm]?)/);
      if (numMatch) countStr = numMatch[1].toUpperCase();
    } else {
      const membersMatch = description.match(/(?:có|has)\s+([\d.,KkMm]+)\s*(?:thành viên|members)/i) || 
                           html.match(/([\d\.,]+[KkMm]?)\s*(?:thành viên|members)/i);
      if (membersMatch) countStr = membersMatch[1].toUpperCase();
    }

    if (countStr) {
      let multiplier = 1;
      if (countStr.includes("K")) {
        multiplier = 1000;
        countStr = countStr.replace("K", "");
      } else if (countStr.includes("M")) {
        multiplier = 1000000;
        countStr = countStr.replace("M", "");
      }

      // Xóa dấu phẩy phân cách hàng nghìn nhưng giữ dấu thập phân
      if (multiplier > 1) {
        countStr = countStr.replace(",", "."); // 132,9K -> 132.9
      } else {
        countStr = countStr.replace(/[,.]/g, ""); // 13.500 -> 13500
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
