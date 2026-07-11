import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import PrintTrigger from "@/app/admin/orders/[id]/print/PrintTrigger";

const prisma = new PrismaClient();

// Helper to clean up common prefixes for neat diagram text rendering
function cleanProductName(name: string): string {
  return name
    .replace(/tấm pin năng lượng mặt trời/gi, "")
    .replace(/tấm pin mặt trời/gi, "")
    .replace(/tấm pin/gi, "")
    .replace(/biến tần inverter hybrid/gi, "Hybrid")
    .replace(/biến tần inverter/gi, "Inverter")
    .replace(/biến tần/gi, "Inverter")
    .replace(/inverter hybrid/gi, "Hybrid")
    .replace(/pin lưu trữ lithium/gi, "Lithium")
    .replace(/pin lưu trữ/gi, "Lithium")
    .replace(/tủ điện bảo vệ/gi, "Tủ AC")
    .replace(/tủ điện ac/gi, "Tủ AC")
    .replace(/tủ điện/gi, "Tủ điện")
    .trim();
}

// Helper to extract numeric values from strings
function extractCapacityW(name: string): number {
  const match = name.match(/(\d+)\s*(W|Wp)/i);
  return match ? parseInt(match[1], 10) : 550; // Default to 550W if not specified
}

function extractCapacityKWh(name: string): number {
  const match = name.match(/(\d+)\s*kWh/i);
  return match ? parseInt(match[1], 10) : 15; // Default to 15kWh if not specified
}

function extractInverterPowerKW(name: string): number {
  const match = name.match(/(\d+)\s*(kW|kWp)/i);
  return match ? parseInt(match[1], 10) : 8; // Default to 8kW if not specified
}

function extractBrand(name: string, defaultBrand: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("longi")) return "LONGi";
  if (lower.includes("jinko")) return "Jinko Solar";
  if (lower.includes("trina")) return "Trina Solar";
  if (lower.includes("canadian")) return "Canadian Solar";
  if (lower.includes("ja solar") || lower.includes("jasolar")) return "JA Solar";
  if (lower.includes("goodwe")) return "GoodWe";
  if (lower.includes("growatt")) return "Growatt";
  if (lower.includes("deye")) return "Deye";
  if (lower.includes("huawei")) return "Huawei";
  if (lower.includes("sofar")) return "Sofar Solar";
  if (lower.includes("bss")) return "BSS";
  if (lower.includes("gigabox")) return "Gigabox";
  
  const parts = name.split(" ");
  return parts[0] ? parts[0] : defaultBrand;
}

export default async function ProjectDiagramPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const projectIdStr = resolvedParams.id;

  if (!projectIdStr) notFound();
  const projectId = parseInt(projectIdStr, 10);
  if (isNaN(projectId)) notFound();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      customer: true,
      items: {
        include: { product: true }
      }
    }
  });

  if (!project) notFound();

  // Find components from BOM
  const panelItem = project.items.find(i => 
    i.product.category === "panels" || 
    i.product.name.toLowerCase().includes("tấm pin") || 
    i.product.name.toLowerCase().includes("pin mặt trời")
  );

  const inverterItem = project.items.find(i => 
    i.product.category === "inverters" || 
    i.product.name.toLowerCase().includes("biến tần") || 
    i.product.name.toLowerCase().includes("inverter")
  );

  const batteryItem = project.items.find(i => 
    i.product.category === "batteries" || 
    i.product.name.toLowerCase().includes("lithium") || 
    i.product.name.toLowerCase().includes("pin lưu trữ") || 
    i.product.name.toLowerCase().includes("battery")
  );

  const cabinetItem = project.items.find(i => 
    i.product.name.toLowerCase().includes("tủ điện") || 
    i.product.name.toLowerCase().includes("tủ ac") || 
    i.product.name.toLowerCase().includes("tủ bảo vệ") || 
    i.product.name.toLowerCase().includes("tủ combiner")
  );

  const dcCableItem = project.items.find(i => 
    (i.product.name.toLowerCase().includes("dây") || i.product.name.toLowerCase().includes("cáp")) && 
    i.product.name.toLowerCase().includes("dc")
  );

  const acCableItem = project.items.find(i => 
    (i.product.name.toLowerCase().includes("dây") || i.product.name.toLowerCase().includes("cáp")) && 
    (i.product.name.toLowerCase().includes("ac") || i.product.name.toLowerCase().includes("điện lưới"))
  );

  // Technical Calculations
  const hasPanels = !!panelItem;
  const panelQty = panelItem?.quantity || 16;
  const panelName = panelItem?.product.name || "LONGi Hi-MO7 615W";
  const panelUnitCapacity = extractCapacityW(panelName);
  const panelBrand = extractBrand(panelName, "LONGi");
  const totalWp = panelQty * panelUnitCapacity;
  const totalKWp = totalWp / 1000;
  
  // Strings division
  const string1Qty = Math.ceil(panelQty / 2);
  const string2Qty = panelQty - string1Qty;

  const hasInverter = !!inverterItem;
  const inverterName = inverterItem?.product.name || "GoodWe Hybrid 8kW";
  const inverterBrand = extractBrand(inverterName, "GoodWe");
  const inverterPower = extractInverterPowerKW(inverterName);

  const hasBattery = !!batteryItem;
  const batteryName = batteryItem?.product.name || "BSS Lithium 16kWh";
  const batteryBrand = extractBrand(batteryName, "BSS");
  const batteryCapacity = extractCapacityKWh(batteryName);

  const cabinetName = cabinetItem?.product.name || "Tủ điện AC bảo vệ 1 pha";
  const dcCableName = dcCableItem ? dcCableItem.product.name : "Dây cáp DC solar 4mm2 chuyên dụng";
  const acCableName = acCableItem ? acCableItem.product.name : "Dây cáp điện AC Cadivi 2x10mm2";

  const systemType = hasBattery ? "HYBRID" : "HÒA LƯỚI BÁM TẢI";
  const systemMode = hasBattery ? "Hybrid - Có lưu trữ" : "Hòa lưới bám tải";

  return (
    <>
      <PrintTrigger label="🖨️ In Sơ Đồ Điện Dự Án" />

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4 landscape;
            margin: 5mm;
          }
          .no-print {
            display: none !important;
          }
          .diagram-container {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            transform: scale(0.97);
            transform-origin: top left;
          }
        }

        body {
          background: #f1f5f9;
          margin: 0;
          padding: 15px;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Inter', sans-serif;
        }

        .diagram-container {
          width: 297mm;
          height: 200mm;
          background: #ffffff;
          padding: 10px 15px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid #cbd5e1;
        }

        .diagram-header-title {
          text-align: center;
          color: #0f172a;
          font-size: 20px;
          font-weight: 800;
          text-transform: uppercase;
          margin: 2px 0 10px 0;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 6px;
        }

        .canvas-area {
          flex: 1;
          position: relative;
          width: 100%;
        }

        /* SVG styles */
        .line-dc-pos { stroke: #dc2626; stroke-width: 2.2; fill: none; }
        .line-dc-neg { stroke: #0f172a; stroke-width: 2.2; fill: none; }
        .line-ac-l { stroke: #dc2626; stroke-dasharray: none; stroke-width: 2.2; fill: none; }
        .line-ac-n { stroke: #2563eb; stroke-dasharray: none; stroke-width: 2.2; fill: none; }
        .line-pe { stroke: #16a34a; stroke-width: 1.5; stroke-dasharray: 4,4; fill: none; }
        .line-comm { stroke: #2563eb; stroke-width: 1.5; stroke-dasharray: 3,3; fill: none; }
        .line-ct { stroke: #ea580c; stroke-width: 1.5; stroke-dasharray: 2,2; fill: none; }

        /* Tech table specs */
        .specs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9.5px;
          font-family: inherit;
        }
        .specs-table th, .specs-table td {
          border: 1px solid #94a3b8;
          padding: 3.5px 5px;
          text-align: left;
        }
        .specs-table th {
          background: #f8fafc;
          font-weight: bold;
          text-transform: uppercase;
          text-align: center;
        }

        /* Legend box */
        .legend-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9.5px;
        }
        .legend-table td {
          padding: 2.5px 4px;
          border: none;
        }

        /* Footer block */
        .footer-block {
          display: grid;
          grid-template-columns: 1.2fr 1.5fr 1.5fr 1fr 1fr;
          border-top: 2px solid #0f172a;
          font-size: 9.5px;
          margin-top: 5px;
        }
        .footer-cell {
          border-right: 1px solid #cbd5e1;
          padding: 5px 8px;
          min-height: 32px;
        }
        .footer-cell:last-child {
          border-right: none;
        }
        .footer-title {
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          font-size: 8px;
          margin-bottom: 2px;
        }
        .footer-value {
          font-weight: 700;
          color: #0f172a;
        }
      `}} />

      <div className="diagram-container">
        {/* Title */}
        <div className="diagram-header-title">
          SƠ ĐỒ HỆ THỐNG ĐIỆN MẶT TRỜI {systemType} {totalKWp.toFixed(2)}kWp {hasBattery ? `– LƯU TRỮ ${batteryCapacity}kWh` : ""}
        </div>

        {/* Dynamic Canvas SVG */}
        <div className="canvas-area">
          <svg viewBox="0 0 1120 620" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ background: '#ffffff' }}>
            
            {/* PE Ground Symbol Template */}
            <defs>
              <g id="ground-symbol">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#16a34a" stroke-width="1.5" />
                <line x1="-8" y1="8" x2="8" y2="8" stroke="#16a34a" stroke-width="1.5" />
                <line x1="-5" y1="11" x2="5" y2="11" stroke="#16a34a" stroke-width="1.5" />
                <line x1="-2" y1="14" x2="2" y2="14" stroke="#16a34a" stroke-width="1.5" />
              </g>
              {/* Solar Panel Template */}
              <g id="panel-icon">
                <rect x="0" y="0" width="22" height="34" fill="#1e293b" stroke="#cbd5e1" stroke-width="0.8" />
                <line x1="11" y1="0" x2="11" y2="34" stroke="#475569" stroke-width="0.5" />
                <line x1="0" y1="11" x2="22" y2="11" stroke="#475569" stroke-width="0.5" />
                <line x1="0" y1="22" x2="22" y2="22" stroke="#475569" stroke-width="0.5" />
              </g>
            </defs>

            {/* ==================== COLUMN 1: SOLAR & BATTERY & INVERTER (LEFT) ==================== */}

            {/* 1. SOLAR PANELS */}
            <g transform="translate(30, 40)">
              <rect x="0" y="0" width="370" height="120" rx="6" fill="#f8fafc" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3,3" />
              <text x="15" y="-12" fill="#0f172a" font-size="10.5" font-weight="700">TẤM PIN NĂNG LƯỢNG MẶT TRỜI</text>
              <text x="15" y="18" fill="#475569" font-size="8.5" font-weight="600">{panelQty} x {cleanProductName(panelName)} ({totalKWp.toFixed(2)}kWp)</text>
              
              {/* Ground inside solar */}
              <use href="#ground-symbol" x="180" y="65" />
              <line x1="120" y1="50" x2="180" y2="50" stroke="#16a34a" stroke-width="1.2" stroke-dasharray="3,3" />
              
              {/* Panel visual representations */}
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <use key={`p-${i}`} href="#panel-icon" x={20 + i * 26} y={35} />
              ))}
              
              {/* String labels */}
              <text x="32" y="85" fill="#dc2626" font-size="9" font-weight="800">+</text>
              <circle cx="35" cy="95" r="2.5" fill="#dc2626" />
              
              <text x="187" y="85" fill="#0f172a" font-size="9" font-weight="800">-</text>
              <circle cx="190" cy="95" r="2.5" fill="#0f172a" />

              <text x="212" y="85" fill="#dc2626" font-size="9" font-weight="800">+</text>
              <circle cx="215" cy="95" r="2.5" fill="#dc2626" />
              
              <circle cx="350" cy="95" r="2.5" fill="#0f172a" />
              <text x="347" y="85" fill="#0f172a" font-size="9" font-weight="800">-</text>
            </g>

            {/* 2. DC PROTECTION (CB DC & SPD DC) */}
            <g transform="translate(70, 190)">
              {/* CB DC */}
              <rect x="0" y="0" width="36" height="50" rx="3" fill="#cbd5e1" stroke="#475569" stroke-width="1.2" />
              <line x1="10" y1="8" x2="10" y2="42" stroke="#0f172a" stroke-width="1.2" />
              <line x1="26" y1="8" x2="26" y2="42" stroke="#0f172a" stroke-width="1.2" />
              <rect x="13" y="15" width="10" height="15" rx="1" fill="#ea580c" />
              <rect x="-5" y="8" width="46" height="12" rx="2" fill="#e2e8f0" stroke="#475569" stroke-width="0.8" />
              <text x="18" y="17" fill="#0f172a" font-size="7.5" font-weight="800" text-anchor="middle">CB DC</text>
              <text x="44" y="28" fill="#475569" font-size="8" font-weight="700">CB DC</text>

              {/* SPD DC */}
              <rect x="75" y="0" width="36" height="50" rx="3" fill="#dc2626" stroke="#b91c1c" stroke-width="1" />
              <rect x="80" y="10" width="10" height="12" fill="#16a34a" />
              <rect x="91" y="10" width="10" height="12" fill="#16a34a" />
              <rect x="70" y="8" width="46" height="12" rx="2" fill="#fca5a5" stroke="#b91c1c" stroke-width="0.8" />
              <text x="93" y="17" fill="#ffffff" font-size="7.5" font-weight="800" text-anchor="middle">SPD DC</text>
              <text x="120" y="28" fill="#475569" font-size="8" font-weight="700">SPD DC</text>
              <use href="#ground-symbol" x="93" y="70" />
            </g>

            {/* 3. INVERTER HYBRID */}
            <g transform="translate(60, 275)">
              <rect x="0" y="0" width="180" height="120" rx="8" fill="#f1f5f9" stroke="#94a3b8" stroke-width="2" />
              <rect x="0" y="0" width="180" height="20" rx="2" fill="#cbd5e1" />
              <text x="90" y="14" fill="#0f172a" font-size="9" font-weight="800" text-anchor="middle">INVERTER HYBRID</text>
              
              {/* Screen Display */}
              <rect x="35" y="32" width="110" height="42" rx="3" fill="#0f172a" />
              <text x="90" y="47" fill="#38bdf8" font-size="8" font-weight="700" text-anchor="middle">
                {cleanProductName(inverterName)}
              </text>
              <text x="90" y="62" fill="#4ade80" font-size="7.5" font-weight="600" text-anchor="middle">
                ONLINE - HYBRID
              </text>
              
              {/* LEDs */}
              <circle cx="35" cy="90" r="3" fill="#16a34a" />
              <text x="35" y="102" fill="#475569" font-size="6.5" text-anchor="middle">RUN</text>
              <circle cx="90" cy="90" r="3" fill="#2563eb" />
              <text x="90" y="102" fill="#475569" font-size="6.5" text-anchor="middle">BMS</text>
              <circle cx="145" cy="90" r="3" fill="#ea580c" />
              <text x="145" y="102" fill="#475569" font-size="6.5" text-anchor="middle">GRID</text>

              {/* Ports */}
              <rect x="15" y="117" width="14" height="6" fill="#334155" />
              <text x="22" y="113" fill="#475569" font-size="6.5" text-anchor="middle">DC</text>
              
              <rect x="75" y="117" width="14" height="6" fill="#334155" />
              <text x="82" y="113" fill="#475569" font-size="6.5" text-anchor="middle">BAT</text>

              <rect x="110" y="117" width="16" height="6" fill="#334155" />
              <text x="118" y="113" fill="#475569" font-size="6.5" text-anchor="middle">GRID</text>

              {/* Backup Port highlight */}
              <rect x="145" y="117" width="20" height="6" fill="#2563eb" />
              <text x="155" y="113" fill="#2563eb" font-size="7" font-weight="700" text-anchor="middle">BACK UP</text>
            </g>

            {/* 4. CB DC BATTERY */}
            {hasBattery && (
              <g transform="translate(80, 420)">
                <rect x="0" y="0" width="36" height="50" rx="3" fill="#cbd5e1" stroke="#475569" stroke-width="1.2" />
                <line x1="10" y1="8" x2="10" y2="42" stroke="#0f172a" stroke-width="1.2" />
                <line x1="26" y1="8" x2="26" y2="42" stroke="#0f172a" stroke-width="1.2" />
                <rect x="13" y="15" width="10" height="15" rx="1" fill="#0f172a" />
                <rect x="-5" y="8" width="46" height="12" rx="2" fill="#cbd5e1" stroke="#475569" stroke-width="0.8" />
                <text x="18" y="17" fill="#0f172a" font-size="7.5" font-weight="800" text-anchor="middle">CB DC</text>
                <text x="-40" y="28" fill="#475569" font-size="8" font-weight="700">CB DC PIN</text>
                <text x="-40" y="38" fill="#64748b" font-size="7" font-weight="600">125A</text>
              </g>
            )}

            {/* 5. BATTERY CABINET */}
            <g transform="translate(50, 490)">
              {hasBattery ? (
                <>
                  <rect x="0" y="0" width="100" height="110" rx="6" fill="#e2e8f0" stroke="#475569" stroke-width="2" />
                  <rect x="0" y="0" width="100" height="14" fill="#94a3b8" />
                  <text x="50" y="10" fill="#0f172a" font-size="8" font-weight="800" text-anchor="middle">BATTERY</text>
                  
                  <rect x="15" y="22" width="70" height="16" rx="2" fill="#0f172a" />
                  <text x="50" y="33" fill="#38bdf8" font-size="9" font-weight="700" text-anchor="middle">
                    {batteryCapacity} kWh
                  </text>
                  
                  <line x1="15" y1="50" x2="85" y2="50" stroke="#94a3b8" stroke-width="1" />
                  <line x1="15" y1="70" x2="85" y2="70" stroke="#94a3b8" stroke-width="1" />
                  <line x1="15" y1="90" x2="85" y2="90" stroke="#94a3b8" stroke-width="1" />
                  
                  <text x="50" y="102" fill="#16a34a" font-size="9.5" font-weight="800" text-anchor="middle">
                    {batteryBrand}
                  </text>
                  <text x="110" y="55" fill="#2563eb" font-size="9.5" font-weight="700">Pin lưu trữ</text>
                  <text x="110" y="68" fill="#475569" font-size="8.5" font-weight="600">{cleanProductName(batteryName)}</text>
                </>
              ) : (
                <>
                  <rect x="0" y="0" width="100" height="110" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3,3" />
                  <text x="50" y="50" fill="#94a3b8" font-size="9.5" font-weight="700" text-anchor="middle">KHÔNG CÓ</text>
                  <text x="50" y="64" fill="#94a3b8" font-size="8.5" font-weight="700" text-anchor="middle">PIN LƯU TRỮ</text>
                </>
              )}
            </g>


            {/* ==================== COLUMN 2: UTILITY GRID & ATS & LOADS (CENTER-RIGHT) ==================== */}

            {/* 1. TRANSMISSION TOWER (EVN GRID) */}
            <g transform="translate(560, 20) scale(1)">
              <line x1="40" y1="10" x2="20" y2="60" stroke="#0f172a" stroke-width="2" />
              <line x1="40" y1="10" x2="60" y2="60" stroke="#0f172a" stroke-width="2" />
              <line x1="20" y1="60" x2="60" y2="60" stroke="#0f172a" stroke-width="2" />
              <line x1="20" y1="60" x2="10" y2="110" stroke="#0f172a" stroke-width="2.2" />
              <line x1="60" y1="60" x2="70" y2="110" stroke="#0f172a" stroke-width="2.2" />
              <line x1="10" y1="110" x2="70" y2="110" stroke="#0f172a" stroke-width="2.2" />
              <line x1="5" y1="40" x2="75" y2="40" stroke="#0f172a" stroke-width="2" />
              <line x1="0" y1="75" x2="80" y2="75" stroke="#0f172a" stroke-width="2" />
              
              <rect x="85" y="45" width="46" height="18" rx="9" fill="#0369a1" />
              <text x="108" y="57" fill="#ffffff" font-size="9" font-weight="700" text-anchor="middle">Lưới</text>
            </g>

            {/* 2. NET METER */}
            <g transform="translate(580, 150)">
              <rect x="0" y="0" width="40" height="60" rx="4" fill="#f8fafc" stroke="#475569" stroke-width="1.5" />
              <rect x="5" y="8" width="30" height="18" rx="1" fill="#0f172a" />
              <text x="20" y="20" fill="#38bdf8" font-size="7" font-weight="700" text-anchor="middle">0984.8 kWh</text>
              <circle cx="10" cy="36" r="1.5" fill="#f59e0b" />
              <circle cx="30" cy="36" r="1.5" fill="#dc2626" />
              
              <rect x="50" y="15" width="65" height="18" rx="3" fill="#0369a1" />
              <text x="82" y="27" fill="#ffffff" font-size="8.5" font-weight="700" text-anchor="middle">NET METER</text>
            </g>

            {/* 3. CB AC (GRID SIDE) */}
            <g transform="translate(580, 245)">
              <rect x="0" y="0" width="36" height="50" rx="3" fill="#cbd5e1" stroke="#475569" stroke-width="1.2" />
              <line x1="10" y1="8" x2="10" y2="42" stroke="#0f172a" stroke-width="1.2" />
              <line x1="26" y1="8" x2="26" y2="42" stroke="#0f172a" stroke-width="1.2" />
              <rect x="13" y="15" width="10" height="15" rx="1" fill="#dc2626" />
              <rect x="-5" y="8" width="46" height="12" rx="2" fill="#cbd5e1" stroke="#475569" stroke-width="0.8" />
              <text x="18" y="17" fill="#0f172a" font-size="7.5" font-weight="800" text-anchor="middle">CB AC</text>
              
              <rect x="-55" y="18" width="45" height="14" rx="2" fill="#fef08a" />
              <text x="-32" y="28" fill="#854d0e" font-size="8" font-weight="800" text-anchor="middle">CB AC</text>
            </g>

            {/* 4. ATS (AUTOMATIC TRANSFER SWITCH) */}
            <g transform="translate(560, 335)">
              <rect x="0" y="0" width="80" height="60" rx="5" fill="#f8fafc" stroke="#475569" stroke-width="1.5" />
              <rect x="0" y="0" width="80" height="14" fill="#cbd5e1" />
              <text x="40" y="10" fill="#0f172a" font-size="8.5" font-weight="800" text-anchor="middle">TRANSFER SWITCH</text>
              
              {/* ATS switch graphics */}
              <circle cx="25" cy="35" r="5" fill="#64748b" />
              <circle cx="55" cy="35" r="5" fill="#64748b" />
              <line x1="25" y1="35" x2="40" y2="28" stroke="#dc2626" stroke-width="2.5" /> {/* Switch lever */}
              
              {/* Label labels */}
              <rect x="90" y="20" width="30" height="16" rx="3" fill="#0369a1" />
              <text x="105" y="31" fill="#ffffff" font-size="8.5" font-weight="700" text-anchor="middle">ATS</text>

              {/* Nguồn pin terminal label */}
              <rect x="-62" y="20" width="54" height="16" rx="2" fill="#0284c7" />
              <text x="-35" y="31" fill="#ffffff" font-size="7.5" font-weight="700" text-anchor="middle">NGUỒN PIN</text>
            </g>

            {/* 5. CT CLAMP */}
            <g transform="translate(540, 305)">
              <circle cx="0" cy="0" r="8" fill="none" stroke="#ea580c" stroke-width="2" />
              <rect x="-4" y="-4" width="8" height="8" fill="#0f172a" />
              <rect x="-24" y="-8" width="16" height="14" rx="2" fill="#1e3a8a" />
              <text x="-16" y="2" fill="#ffffff" font-size="7" font-weight="800" text-anchor="middle">CT</text>
            </g>

            {/* 6. CB AC & SPD AC (LOAD SIDE PROTECTION) */}
            <g transform="translate(580, 430)">
              {/* CB AC */}
              <rect x="0" y="0" width="36" height="50" rx="3" fill="#cbd5e1" stroke="#475569" stroke-width="1.2" />
              <line x1="10" y1="8" x2="10" y2="42" stroke="#0f172a" stroke-width="1.2" />
              <line x1="26" y1="8" x2="26" y2="42" stroke="#0f172a" stroke-width="1.2" />
              <rect x="13" y="15" width="10" height="15" rx="1" fill="#dc2626" />
              <rect x="-5" y="8" width="46" height="12" rx="2" fill="#cbd5e1" stroke="#475569" stroke-width="0.8" />
              <text x="18" y="17" fill="#0f172a" font-size="7.5" font-weight="800" text-anchor="middle">CB AC</text>
              
              <rect x="-50" y="18" width="42" height="14" rx="2" fill="#fef08a" />
              <text x="-29" y="28" fill="#854d0e" font-size="8" font-weight="800" text-anchor="middle">CB AC</text>

              {/* SPD AC */}
              <rect x="75" y="0" width="36" height="50" rx="3" fill="#eab308" stroke="#a16207" stroke-width="1" />
              <rect x="80" y="10" width="10" height="12" fill="#16a34a" />
              <rect x="91" y="10" width="10" height="12" fill="#16a34a" />
              <rect x="70" y="8" width="46" height="12" rx="2" fill="#fef08a" stroke="#a16207" stroke-width="0.8" />
              <text x="93" y="17" fill="#854d0e" font-size="7.5" font-weight="800" text-anchor="middle">SPD AC</text>
              <text x="120" y="28" fill="#475569" font-size="8" font-weight="700">SPD AC</text>
              <use href="#ground-symbol" x="93" y="70" />
            </g>

            {/* 7. HOUSEHOLD LOAD (TẢI) */}
            <g transform="translate(530, 520)">
              {/* House roof */}
              <path d="M 0 35 L 70 0 L 140 35 L 140 90 L 0 90 Z" fill="none" stroke="#0f172a" stroke-width="2" />
              <path d="M -5 35 L 70 -3 L 145 35" fill="none" stroke="#0f172a" stroke-width="2.5" />
              
              {/* Air Conditioner */}
              <rect x="15" y="32" width="45" height="14" rx="1" fill="none" stroke="#64748b" stroke-width="1" />
              <line x1="20" y1="41" x2="55" y2="41" stroke="#94a3b8" stroke-width="0.8" />
              
              {/* Fridge */}
              <rect x="75" y="42" width="22" height="44" rx="2" fill="none" stroke="#64748b" stroke-width="1.2" />
              <line x1="75" y1="60" x2="97" y2="60" stroke="#64748b" stroke-width="1" />
              <circle cx="92" cy="54" r="1" fill="#64748b" />
              <circle cx="92" cy="66" r="1" fill="#64748b" />
              
              {/* Washer */}
              <rect x="105" y="55" width="24" height="30" rx="1" fill="none" stroke="#64748b" stroke-width="1.2" />
              <circle cx="117" cy="72" r="7" fill="none" stroke="#64748b" stroke-width="1" />
              
              {/* TV */}
              <rect x="15" y="55" width="45" height="26" rx="2" fill="none" stroke="#64748b" stroke-width="1.2" />
              <rect x="25" y="81" width="25" height="4" fill="#64748b" />

              {/* Tải Label */}
              <rect x="52" y="96" width="36" height="18" rx="3" fill="#0369a1" />
              <text x="70" y="108" fill="#ffffff" font-size="8.5" font-weight="700" text-anchor="middle">Tải</text>
            </g>


            {/* ==================== CENTER SYSTEM LABEL BOX ==================== */}
            <g transform="translate(325, 435)">
              <rect x="0" y="0" width="180" height="70" rx="12" fill="#fef08a" stroke="#ca8a04" stroke-width="2.5" />
              <text x="90" y="28" fill="#854d0e" font-size="11" font-weight="900" text-anchor="middle">SƠ ĐỒ ĐIỆN</text>
              <text x="90" y="43" fill="#854d0e" font-size="11" font-weight="900" text-anchor="middle">MẶT TRỜI HYBRID</text>
              <text x="90" y="58" fill="#ca8a04" font-size="9.5" font-weight="800" text-anchor="middle">KAIDO SOLAR</text>
            </g>


            {/* ==================== WIRING CONNECTIONS (LINES) ==================== */}

            {/* A. SOLAR TO INVERTER DC WIRING */}
            {/* Pos line String 1 (red) */}
            <path d="M 65 135 L 65 160 L 80 160 L 80 190" className="line-dc-pos" />
            {/* Neg line String 1 (black) */}
            <path d="M 220 135 L 220 168 L 90 168 L 90 190" className="line-dc-neg" />

            {/* Pos line String 2 (red) */}
            <path d="M 245 135 L 245 160 L 80 160" className="line-dc-pos" />
            {/* Neg line String 2 (black) */}
            <path d="M 380 135 L 380 168 L 90 168" className="line-dc-neg" />

            {/* DC Protection output to Inverter input */}
            <path d="M 80 240 L 80 262 L 75 262 L 75 275" className="line-dc-pos" />
            <path d="M 96 240 L 96 266 L 85 266 L 85 275" className="line-dc-neg" />

            {/* SPD DC branch connection */}
            <path d="M 80 160 L 145 160 L 145 190" className="line-dc-pos" />
            <path d="M 90 168 L 155 168 L 155 190" className="line-dc-neg" />

            {/* B. BATTERY WIRING (HYBRID) */}
            {hasBattery && (
              <>
                {/* Battery to CB DC PIN */}
                <path d="M 90 490 L 90 470" className="line-dc-pos" />
                <path d="M 106 490 L 106 470" className="line-dc-neg" />
                
                {/* CB DC PIN to Inverter BAT port */}
                <path d="M 90 420 L 90 405 L 135 405 L 135 395" className="line-dc-pos" />
                <path d="M 106 420 L 106 409 L 142 409 L 142 395" className="line-dc-neg" />

                {/* BMS Communication line (blue dashed) */}
                <path d="M 75 490 L 75 480 L 50 480 L 50 380 L 110 380 L 110 395" className="line-comm" />
              </>
            )}

            {/* C. GRID TRANSMISSION LINE WIRING */}
            {/* Tower out to Net Meter input */}
            <path d="M 600 130 L 600 150" className="line-ac-l" />
            <path d="M 590 130 L 590 150" className="line-ac-n" />

            {/* Net Meter out to Grid CB */}
            <path d="M 600 210 L 600 245" className="line-ac-l" />
            <path d="M 590 210 L 590 245" className="line-ac-n" />

            {/* D. GRID CB TO ATS & INVERTER GRID PORT */}
            {/* Main AC feed down */}
            <path d="M 600 295 L 600 335" className="line-ac-l" />
            <path d="M 590 295 L 590 335" className="line-ac-n" />
            
            {/* Grid branch tap off to Inverter GRID port */}
            <path d="M 600 310 L 178 310 L 178 395" className="line-ac-l" />
            <path d="M 590 316 L 170 316 L 170 395" className="line-ac-n" />

            {/* E. INVERTER BACKUP PORT TO ATS */}
            <path d="M 215 395 L 215 412 L 498 412 L 498 360 L 560 360" className="line-ac-l" /> {/* Red Backup L line */}
            <path d="M 223 395 L 223 406 L 490 406 L 490 354 L 560 354" className="line-ac-n" /> {/* Blue Backup N line */}

            {/* F. ATS OUTPUT TO LOAD SIDE CB */}
            <path d="M 600 395 L 600 430" className="line-ac-l" />
            <path d="M 590 395 L 590 430" className="line-ac-n" />

            {/* G. LOAD SIDE CB TO HOUSEHOLD LOAD */}
            <path d="M 600 480 L 600 555" className="line-ac-l" />
            <path d="M 590 480 L 590 555" className="line-ac-n" />

            {/* Load Side SPD AC parallel link */}
            <path d="M 600 495 L 666 495 L 666 480" className="line-ac-l" />
            <path d="M 590 502 L 676 502 L 676 480" className="line-ac-n" />

            {/* H. CT SENSOR WIRING */}
            {/* CT Communication cable back to Inverter comm port */}
            <path d="M 516 297 L 516 260 L 235 260 L 235 375" className="line-ct" />


            {/* ==================== 8. GHI CHÚ / INSTRUCTIONS BOX (BOTTOM MIDDLE) ==================== */}
            <g transform="translate(230, 520)">
              <rect x="0" y="0" width="280" height="90" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
              <text x="10" y="14" fill="#0f172a" font-size="9" font-weight="700">GHI CHÚ KỸ THUẬT:</text>
              <text x="10" y="27" fill="#475569" font-size="7.5">- Hệ thống tự động sạc xả lưu trữ và bù lưới bám tải.</text>
              <text x="10" y="38" fill="#475569" font-size="7.5">- Thiết bị ATS chuyển mạch tự động cấp nguồn Backup khi mất lưới.</text>
              <text x="10" y="49" fill="#475569" font-size="7.5">- Cài đặt chống phát ngược lưới (Zero Export) qua CT.</text>
              <text x="10" y="60" fill="#475569" font-size="7.5">- Dây DC: {cleanProductName(dcCableName)}.</text>
              <text x="10" y="71" fill="#475569" font-size="7.5">- Dây AC: {cleanProductName(acCableName)}.</text>
            </g>

            {/* ==================== 9. LEGENDS BOX (TOP RIGHT) ==================== */}
            <g transform="translate(820, 20)">
              <rect x="0" y="0" width="270" height="150" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
              <text x="135" y="16" fill="#0f172a" font-size="9.5" font-weight="700" text-anchor="middle">CHÚ THÍCH KỸ THUẬT</text>
              
              <line x1="15" y1="34" x2="45" y2="34" stroke="#dc2626" stroke-width="2.5" />
              <text x="55" y="37" fill="#0f172a" font-size="8.5">DC Cực dương + (Đỏ)</text>

              <line x1="15" y1="54" x2="45" y2="54" stroke="#0f172a" stroke-width="2.5" />
              <text x="55" y="57" fill="#0f172a" font-size="8.5">DC Cực âm - (Đen)</text>

              <line x1="15" y1="74" x2="45" y2="74" stroke="#dc2626" stroke-width="2" />
              <text x="55" y="77" fill="#0f172a" font-size="8.5">AC Dây Pha L (Đỏ)</text>

              <line x1="15" y1="94" x2="45" y2="94" stroke="#2563eb" stroke-width="2" />
              <text x="55" y="97" fill="#0f172a" font-size="8.5">AC Dây trung tính N (Xanh dương)</text>

              <line x1="15" y1="114" x2="45" y2="114" stroke="#16a34a" stroke-dasharray="3,3" stroke-width="1.5" />
              <text x="55" y="117" fill="#0f172a" font-size="8.5">Dây tiếp địa chống sét PE (Xanh lá)</text>

              <line x1="15" y1="134" x2="45" y2="134" stroke="#ea580c" stroke-dasharray="2,2" stroke-width="1.5" />
              <text x="55" y="137" fill="#0f172a" font-size="8.5">Dây tín hiệu CT / Sensor cảm biến dòng</text>
            </g>

            {/* ==================== 10. SYSTEM SPECIFICATIONS TABLE (TOP RIGHT) ==================== */}
            <g transform="translate(820, 185)">
              <foreignObject x="0" y="0" width="270" height="150">
                <table className="specs-table">
                  <thead>
                    <tr>
                      <th colSpan={2}>THÔNG SỐ HỆ THỐNG DỰ KIẾN</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600, width: '40%' }}>Công suất DC</td>
                      <td>{totalKWp.toFixed(2)} kWp</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Tấm pin</td>
                      <td>{panelQty} x {cleanProductName(panelName)}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Biến tần</td>
                      <td>{cleanProductName(inverterName)}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Pin lưu trữ</td>
                      <td>{hasBattery ? cleanProductName(batteryName) : "Không có"}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Thiết bị ATS</td>
                      <td>Tự động chuyển mạch 63A</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Chế độ hoạt động</td>
                      <td>{systemMode}</td>
                    </tr>
                  </tbody>
                </table>
              </foreignObject>
            </g>

          </svg>
        </div>

        {/* Footer Technical Block */}
        <div className="footer-block">
          <div className="footer-cell">
            <div className="footer-title">CHỦ ĐẦU TƯ:</div>
            <div className="footer-value">{project.customer?.name || "..........................................................."}</div>
          </div>
          <div className="footer-cell">
            <div className="footer-title">CÔNG TRÌNH:</div>
            <div className="footer-value">{project.name}</div>
          </div>
          <div className="footer-cell">
            <div className="footer-title">ĐỊA ĐIỂM:</div>
            <div className="footer-value">{project.customer?.address || "Hà Nội"}</div>
          </div>
          <div className="footer-cell">
            <div className="footer-title">ĐƠN VỊ THI CÔNG:</div>
            <div className="footer-value">CÔNG TY TNHH KAIDO SOLAR</div>
          </div>
          <div className="footer-cell" style={{ borderRight: 'none' }}>
            <div className="footer-title">NGÀY THIẾT KẾ:</div>
            <div className="footer-value">{new Date(project.updatedAt).toLocaleDateString('vi-VN')}</div>
          </div>
        </div>
      </div>
    </>
  );
}
