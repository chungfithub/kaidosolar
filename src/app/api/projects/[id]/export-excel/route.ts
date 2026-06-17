import ExcelJS from "exceljs";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyCustomerToken, verifyToken } from "@/lib/auth";
import path from "path";
import { promises as fs } from "fs";

const prisma = new PrismaClient();

// Helper to detect correct unit
function getUnit(category: string | null, name: string): string {
  const cat = category || "";
  const lower = name.toLowerCase();
  if (cat === "panels" || lower.includes("tấm pin") || lower.includes("tam pin")) {
    return "Tấm";
  }
  if (cat === "batteries" || lower.includes("pin lưu trữ") || lower.includes("lithium")) {
    return "Bộ";
  }
  if (cat === "inverters" || lower.includes("biến tần") || lower.includes("inverter")) {
    return "Bộ";
  }
  if (lower.includes("dây") || lower.includes("day") || lower.includes("dây điện")) {
    return "Mét";
  }
  if (lower.includes("tủ") || lower.includes("tu dien") || lower.includes("tủ điện")) {
    return "Tủ";
  }
  if (lower.includes("nhân công") || lower.includes("lắp đặt") || lower.includes("thi công")) {
    return "Gói";
  }
  return "Cái";
}

// Clean markdown bold symbols and format technical specs for plain excel cells
function cleanSpecsForExcel(text: string | null): string {
  if (!text) return "";
  
  let processed = text;
  // If the text has few newlines but contains colons, let's break it down into lines
  if (!text.includes("\n") || text.split("\n").length < 3) {
    // Regex matches space + Capitalized label + colon (e.g., " Dung lượng:", " Điện áp:")
    processed = text.replace(/\s+([A-Z\u00C0-\u017FĐ][A-Za-z0-9\u00C0-\u01BFĐ\s/_-]{1,30}):/g, "\n$1:");
    
    // Also split specific words onto separate lines
    processed = processed.replace(/\s+(trọng lượng)\s+/gi, "\nTrọng lượng: ");
    processed = processed.replace(/\s+(IP\d+)\s+/g, "\nCấp bảo vệ: $1\n");
  }

  return processed
    .split("\n")
    .map(line => {
      let cleaned = line.trim();
      // Remove leading bullet marks
      if (cleaned.startsWith("-") || cleaned.startsWith("•") || cleaned.startsWith("*")) {
        cleaned = cleaned.replace(/^[•\-*]\s*/, "");
      }
      // Remove markdown bolds
      cleaned = cleaned.replace(/\*\*/g, "");
      return cleaned;
    })
    .filter(Boolean)
    .join("\r\n"); // Excel uses CRLF for inline line breaks
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const projectIdStr = resolvedParams.id;
    if (!projectIdStr) {
      return NextResponse.json({ error: "Missing project ID" }, { status: 400 });
    }
    const projectId = parseInt(projectIdStr, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    // --- Hybrid Authorization Check ---
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;
    const adminToken = cookieStore.get("admin_token")?.value;

    let isAuthorized = false;
    let customerSession = null;
    let adminSession = null;

    if (adminToken) {
      adminSession = await verifyToken(adminToken);
      if (adminSession) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized && token) {
      customerSession = await verifyCustomerToken(token);
      if (customerSession && customerSession.customerId) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Fetch Project Details ---
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          },
          orderBy: [
            { sortOrder: 'asc' },
            { id: 'asc' }
          ]
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // --- IDOR Protection ---
    if (!adminSession && customerSession) {
      if (project.customerId !== customerSession.customerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // --- Group items into Main Materials and Construction Materials ---
    const mainItems = project.items.filter(item => 
      item.product.category === "panels" || 
      item.product.category === "inverters" || 
      item.product.category === "batteries"
    );
    const accessoryItems = project.items.filter(item => 
      item.product.category !== "panels" && 
      item.product.category !== "inverters" && 
      item.product.category !== "batteries"
    );

    // --- Create Workbook & Sheet ---
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Báo giá kỹ thuật");

    // Enable gridlines
    worksheet.views = [{ showGridLines: true }];

    // Set Column Widths
    worksheet.columns = [
      { key: "stt", width: 6 },
      { key: "name", width: 28 },
      { key: "specs", width: 38 },
      { key: "brand", width: 14 },
      { key: "image", width: 14 },
      { key: "quantity", width: 10 },
      { key: "unit", width: 8 },
      { key: "price", width: 15 },
      { key: "total", width: 18 },
      { key: "notes", width: 16 }
    ];

    // Styles & Border Definition
    const thinBorder: ExcelJS.Borders = {
      top: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } }
    };

    // 1. Merged Title Row A1:J1
    worksheet.mergeCells("A1:J1");
    const titleRow = worksheet.getRow(1);
    titleRow.height = 36;
    const titleCell = worksheet.getCell("A1");
    titleCell.value = project.name.toUpperCase();
    titleCell.font = { name: "Times New Roman", size: 14, bold: true, color: { argb: "000000" } };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFC000" } // Golden yellow fill
    };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    titleCell.border = thinBorder;

    // Apply borders to all title merged cells
    for (let c = 1; c <= 10; c++) {
      titleRow.getCell(c).border = thinBorder;
    }

    // 2. Table Header Row (Row 2)
    const headerRow = worksheet.getRow(2);
    headerRow.height = 28;
    const headers = [
      "Stt",
      "Tên vật tư hàng hóa",
      "Thông tin kỹ thuật",
      "Thương hiệu",
      "Hình ảnh",
      "Số lượng",
      "Đvt",
      "Đơn giá",
      "Thành tiền (VNĐ)",
      "Ghi chú"
    ];

    headers.forEach((h, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = h;
      cell.font = { name: "Times New Roman", size: 11, bold: true, color: { argb: "000000" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF9bc2e6" } // Premium light blue-gray
      };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = thinBorder;
    });

    let currentExcelRowIndex = 3;

    // Helper to render an item row
    async function writeItemRow(item: typeof project.items[0], stt: number) {
      const row = worksheet.getRow(currentExcelRowIndex);
      row.height = 72; // Generous height for image fit

      // STT
      const cellStt = row.getCell(1);
      cellStt.value = stt;
      cellStt.alignment = { vertical: "middle", horizontal: "center" };

      // Name
      const cellName = row.getCell(2);
      cellName.value = item.product.name;
      cellName.alignment = { vertical: "middle", horizontal: "left", wrapText: true };

      // Specs
      const cellSpecs = row.getCell(3);
      cellSpecs.value = cleanSpecsForExcel(item.product.specs);
      cellSpecs.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
      cellSpecs.font = { name: "Times New Roman", size: 10 };

      // Brand
      const cellBrand = row.getCell(4);
      cellBrand.value = item.product.brand || "-";
      cellBrand.alignment = { vertical: "middle", horizontal: "center" };

      // Image (drawn dynamically inside cell E)
      let firstImage = null;
      if (item.product.images) {
        try {
          const parsed = JSON.parse(item.product.images);
          if (Array.isArray(parsed) && parsed.length > 0) {
            firstImage = parsed[0];
          }
        } catch (e) {}
      }

      if (firstImage && firstImage.startsWith("/uploads/")) {
        const filePath = path.join(process.cwd(), "public", firstImage);
        try {
          await fs.access(filePath);
          const imageBuffer = await fs.readFile(filePath);
          const extension = firstImage.split(".").pop()?.toLowerCase();
          const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension: (extension === "png" ? "png" : "jpeg") as any
          });
          // Anchor image inside the current cell E (column 4, 0-based)
          worksheet.addImage(imageId, {
            tl: { col: 4.15, row: currentExcelRowIndex - 1 + 0.15 },
            ext: { width: 62, height: 62 }
          });
        } catch (e) {
          console.error(`Excel export: Failed to add image from path ${filePath}`, e);
        }
      }
      row.getCell(5).alignment = { vertical: "middle", horizontal: "center" };

      // Quantity
      const cellQty = row.getCell(6);
      cellQty.value = item.quantity;
      cellQty.alignment = { vertical: "middle", horizontal: "center" };
      cellQty.numFmt = "#,##0";

      // Unit
      const cellUnit = row.getCell(7);
      cellUnit.value = getUnit(item.product.category, item.product.name);
      cellUnit.alignment = { vertical: "middle", horizontal: "center" };

      // Price
      const cellPrice = row.getCell(8);
      cellPrice.value = item.price;
      cellPrice.alignment = { vertical: "middle", horizontal: "right" };
      cellPrice.numFmt = "#,##0";

      // Total
      const cellTotal = row.getCell(9);
      cellTotal.value = item.price * item.quantity;
      cellTotal.alignment = { vertical: "middle", horizontal: "right" };
      cellTotal.font = { name: "Times New Roman", bold: true };
      cellTotal.numFmt = "#,##0";

      // Notes (Warranty)
      const cellNotes = row.getCell(10);
      cellNotes.value = item.product.warranty ? `BH ${item.product.warranty}` : "-";
      cellNotes.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

      // Apply borders & font to all cells in the row
      for (let c = 1; c <= 10; c++) {
        const cell = row.getCell(c);
        cell.border = thinBorder;
        if (c !== 3 && c !== 9) {
          cell.font = { name: "Times New Roman", size: 10.5 };
        }
      }

      currentExcelRowIndex++;
    }

    // Helper to write category header row
    function writeCategoryHeader(label: string) {
      worksheet.mergeCells(`A${currentExcelRowIndex}:J${currentExcelRowIndex}`);
      const row = worksheet.getRow(currentExcelRowIndex);
      row.height = 24;
      const cell = row.getCell(1);
      cell.value = label;
      cell.font = { name: "Times New Roman", size: 11, bold: true, color: { argb: "000000" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFd9e1f2" } // Soft light blue highlight
      };
      cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
      
      for (let c = 1; c <= 10; c++) {
        row.getCell(c).border = thinBorder;
      }
      currentExcelRowIndex++;
    }

    // --- Write Main Materials ---
    if (mainItems.length > 0) {
      writeCategoryHeader("I. Vật tư chính");
      for (let i = 0; i < mainItems.length; i++) {
        await writeItemRow(mainItems[i], i + 1);
      }
    }

    // --- Write Construction Materials / Accessories ---
    if (accessoryItems.length > 0) {
      writeCategoryHeader("II. Vật Tư Thi Công");
      for (let i = 0; i < accessoryItems.length; i++) {
        await writeItemRow(accessoryItems[i], i + 1);
      }
    }

    // --- Write Totals Summary Rows ---
    const calculatedTotal = project.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Dòng 1: Tổng cộng
    worksheet.mergeCells(`A${currentExcelRowIndex}:H${currentExcelRowIndex}`);
    const totalRow = worksheet.getRow(currentExcelRowIndex);
    totalRow.height = 25;
    const cellTotalLabel = totalRow.getCell(1);
    cellTotalLabel.value = "TỔNG CỘNG";
    cellTotalLabel.font = { name: "Times New Roman", size: 11, bold: true };
    cellTotalLabel.alignment = { vertical: "middle", horizontal: "right", rightToLeft: false };
    
    const cellTotalVal = totalRow.getCell(9);
    cellTotalVal.value = calculatedTotal;
    cellTotalVal.font = { name: "Times New Roman", size: 12, bold: true };
    cellTotalVal.alignment = { vertical: "middle", horizontal: "right" };
    cellTotalVal.numFmt = "#,##0";

    for (let c = 1; c <= 10; c++) {
      totalRow.getCell(c).border = thinBorder;
    }
    currentExcelRowIndex++;

    // Dòng 2: Tổng cộng tiền thanh toán
    worksheet.mergeCells(`A${currentExcelRowIndex}:H${currentExcelRowIndex}`);
    const payRow = worksheet.getRow(currentExcelRowIndex);
    payRow.height = 30;
    const cellPayLabel = payRow.getCell(1);
    cellPayLabel.value = "TỔNG CỘNG TIỀN CẦN THANH TOÁN";
    cellPayLabel.font = { name: "Times New Roman", size: 11, bold: true, color: { argb: "FFC00000" } }; // Dark red
    cellPayLabel.alignment = { vertical: "middle", horizontal: "center" };
    cellPayLabel.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF2CC" } // Light yellow highlight
    };

    const cellPayVal = payRow.getCell(9);
    cellPayVal.value = calculatedTotal;
    cellPayVal.font = { name: "Times New Roman", size: 13, bold: true, color: { argb: "FFC00000" } };
    cellPayVal.alignment = { vertical: "middle", horizontal: "right" };
    cellPayVal.numFmt = "#,##0";
    cellPayVal.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF2CC" }
    };

    // Keep warranty cell empty but add fill
    payRow.getCell(10).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF2CC" }
    };

    for (let c = 1; c <= 10; c++) {
      payRow.getCell(c).border = thinBorder;
    }

    // --- Generate Response ---
    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Bao_gia_specs_du_an_${project.id}.xlsx"`,
      },
    });

  } catch (error) {
    console.error("Excel generation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
