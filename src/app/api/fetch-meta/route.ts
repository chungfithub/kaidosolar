import { NextRequest, NextResponse } from "next/server";

function parseHtmlMeta(html: string) {
  // Dùng Regex tìm <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  let title = titleMatch ? titleMatch[1] : "";
  
  // Xóa chữ "| Facebook" hoặc "- Facebook" nếu có
  title = title.replace(/\s*[-|]\s*Facebook\s*$/i, "").trim();

  // Kiểm tra xem có bị chuyển hướng về trang đăng nhập hoặc bị block không
  const lowerTitle = title.toLowerCase();
  let isBlocked = false;
  if (
    lowerTitle === "facebook" || 
    lowerTitle.includes("log in") || 
    lowerTitle.includes("đăng nhập") || 
    lowerTitle.includes("sign up") ||
    lowerTitle.includes("đăng ký") ||
    lowerTitle.includes("unsupported browser") ||
    lowerTitle.includes("trình duyệt không hỗ trợ") ||
    lowerTitle.includes("không tìm thấy trang") ||
    lowerTitle.includes("page not found") ||
    lowerTitle === "error" ||
    lowerTitle === "lỗi" ||
    html.includes("checkpoint") ||
    html.includes("login_form") ||
    html.includes("mbasic_login_form")
  ) {
    isBlocked = true;
    title = "";
  }

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
  if (title.match(/nhóm kín|private group/i) || description.match(/nhóm kín|private group/i) || lowerTitle.includes("private")) {
    privacy = "private";
  }

  return { title, description, membersCount, privacy, isBlocked };
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
  }

  try {
    // Tự động chuyển đổi sang mbasic.facebook.com để giảm khả năng bị block trên VPS
    let fetchUrl = url;
    if (url.includes("facebook.com/groups/")) {
      fetchUrl = url.replace(/(?:www\.|m\.)?facebook\.com/i, "mbasic.facebook.com");
    }

    const headers: Record<string, string> = {
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
    };

    if (process.env.FACEBOOK_COOKIE) {
      headers["cookie"] = process.env.FACEBOOK_COOKIE;
    }

    let html = "";
    let directOk = false;

    // Lớp 1: Gọi trực tiếp mbasic
    try {
      const response = await fetch(fetchUrl, { headers });
      if (response.ok) {
        html = await response.text();
        directOk = true;
      }
    } catch (e) {
      console.error("Direct fetch failed, fallback to proxy", e);
    }

    let parsed = { title: "", description: "", membersCount: null as number | null, privacy: "public", isBlocked: false };
    if (directOk && html) {
      parsed = parseHtmlMeta(html);
    }

    // Lớp 2: Nếu trực tiếp thất bại hoặc trả về trang Đăng nhập (Title trống), gọi qua proxy allorigins làm fallback
    if (!parsed.title) {
      try {
        const proxyRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(fetchUrl)}`);
        if (proxyRes.ok) {
          const json = await proxyRes.json();
          if (json.contents) {
            const proxyParsed = parseHtmlMeta(json.contents);
            if (proxyParsed.title) {
              parsed = proxyParsed;
            } else if (proxyParsed.isBlocked) {
              parsed.isBlocked = true;
            }
          }
        }
      } catch (proxyErr) {
        console.error("Fallback allorigins proxy also failed:", proxyErr);
      }
    }

    // Nếu sau cả 2 lớp vẫn không có tiêu đề, mặc định coi là bị chặn/lỗi
    if (!parsed.title) {
      parsed.isBlocked = true;
    }

    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error("Fetch Meta Error:", error.message);
    return NextResponse.json({
      title: "",
      description: "",
      membersCount: null,
      privacy: "public",
      isBlocked: true,
      error: "Không thể lấy dữ liệu"
    });
  }
}
