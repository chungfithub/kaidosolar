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
  
  // Return first word capitalized as brand if no match
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
          padding: 20px;
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
          margin: 4px 0 12px 0;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 8px;
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
        .line-ac-n { stroke: #0f172a; stroke-dasharray: none; stroke-width: 2.2; fill: none; }
        .line-pe { stroke: #16a34a; stroke-width: 1.5; stroke-dasharray: 4,4; fill: none; }
        .line-comm { stroke: #2563eb; stroke-width: 1.5; stroke-dasharray: 3,3; fill: none; }
        .line-ct { stroke: #ea580c; stroke-width: 1.5; stroke-dasharray: 2,2; fill: none; }

        /* Tech table specs */
        .specs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
          font-family: inherit;
        }
        .specs-table th, .specs-table td {
          border: 1px solid #94a3b8;
          padding: 4px 6px;
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
          font-size: 10px;
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
          margin-top: 10px;
        }
        .footer-cell {
          border-right: 1px solid #cbd5e1;
          padding: 6px 8px;
          min-height: 36px;
        }
        .footer-cell:last-child {
          border-right: none;
        }
        .footer-title {
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          font-size: 8px;
          margin-bottom: 3px;
        }
        .footer-value {
          font-weight: 700;
          color: #0f172a;
        }
      `}} />

      <div className="diagram-container">
        {/* Title */}
        <div className="diagram-header-title">
          SƠ ĐỒ ĐIỆN MẶT TRỜI {systemType} {totalKWp.toFixed(2)}kWp {hasBattery ? `– LƯU TRỮ ${batteryCapacity}kWh` : ""}
        </div>

        {/* Dynamic Canvas SVG */}
        <div className="canvas-area">
          <svg viewBox="0 0 1120 540" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ background: '#ffffff' }}>
            
            {/* GRIDS & BUSBAR BACKGROUND SHAPES */}
            {/* Tủ điện AC Dashed Box */}
            <rect x="680" y="270" width="280" height="150" rx="6" fill="none" stroke="#2563eb" stroke-width="1.2" stroke-dasharray="3,3" />
            <text x="970" y="320" fill="#2563eb" font-size="10.5" font-weight="700">TỦ ĐIỆN AC:</text>
            <text x="970" y="335" fill="#475569" font-size="9" font-weight="600">{cleanProductName(cabinetName)}</text>

            {/* PE Ground Symbol */}
            <defs>
              <g id="ground-symbol">
                <line x1="0" y1="0" x2="0" y2="10" stroke="#16a34a" stroke-width="1.5" />
                <line x1="-8" y1="10" x2="8" y2="10" stroke="#16a34a" stroke-width="1.5" />
                <line x1="-5" y1="13" x2="5" y2="13" stroke="#16a34a" stroke-width="1.5" />
                <line x1="-2" y1="16" x2="2" y2="16" stroke="#16a34a" stroke-width="1.5" />
              </g>
              {/* Solar Panel Template */}
              <g id="panel-icon">
                <rect x="0" y="0" width="22" height="36" fill="#1e293b" stroke="#cbd5e1" stroke-width="0.8" />
                <line x1="11" y1="0" x2="11" y2="36" stroke="#475569" stroke-width="0.5" />
                <line x1="0" y1="12" x2="22" y2="12" stroke="#475569" stroke-width="0.5" />
                <line x1="0" y1="24" x2="22" y2="24" stroke="#475569" stroke-width="0.5" />
              </g>
            </defs>

            {/* 1. SOLAR ARRAY (TOP LEFT) */}
            <text x="40" y="25" fill="#0f172a" font-size="11" font-weight="700">TẤM PIN NĂNG LƯỢNG MẶT TRỜI</text>
            <text x="40" y="38" fill="#475569" font-size="9.5" font-weight="600">{panelQty} x {cleanProductName(panelName)} ({totalKWp.toFixed(2)}kWp)</text>

            {/* String 1 Box */}
            <rect x="30" y="55" width="200" height="85" rx="6" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3,3" />
            <text x="40" y="70" fill="#0f172a" font-size="9" font-weight="700">STRING 1 ({string1Qty} TẤM)</text>
            {/* Draw 7 panels in grid */}
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <use key={`s1-p-${i}`} href="#panel-icon" x={40 + i * 24} y={80} />
            ))}
            {/* Wire poles string 1 */}
            <circle cx="44" cy="122" r="2.5" fill="#dc2626" />
            <text x="40" y="132" fill="#dc2626" font-size="9" font-weight="700">+</text>
            <circle cx="196" cy="122" r="2.5" fill="#0f172a" />
            <text x="194" y="132" fill="#0f172a" font-size="9" font-weight="700">-</text>

            {/* String 2 Box */}
            <rect x="250" y="55" width="200" height="85" rx="6" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3,3" />
            <text x="260" y="70" fill="#0f172a" font-size="9" font-weight="700">STRING 2 ({string2Qty} TẤM)</text>
            {/* Draw 7 panels in grid */}
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <use key={`s2-p-${i}`} href="#panel-icon" x={260 + i * 24} y={80} />
            ))}
            {/* Wire poles string 2 */}
            <circle cx="264" cy="122" r="2.5" fill="#dc2626" />
            <text x="260" y="132" fill="#dc2626" font-size="9" font-weight="700">+</text>
            <circle cx="416" cy="122" r="2.5" fill="#0f172a" />
            <text x="414" y="132" fill="#0f172a" font-size="9" font-weight="700">-</text>

            {/* Ground line for panels */}
            <path d="M 120 116 L 120 148 L 330 148 L 330 120" className="line-pe" />
            <use href="#ground-symbol" x="225" y="148" />

            {/* 2. DC PROTECTION PANEL */}
            {/* DC Breaker Box (CB DC) */}
            <rect x="235" y="175" width="40" height="55" rx="4" fill="#f8fafc" stroke="#475569" stroke-width="1.2" />
            <line x1="245" y1="185" x2="245" y2="220" stroke="#0f172a" stroke-width="1.5" />
            <line x1="265" y1="185" x2="265" y2="220" stroke="#0f172a" stroke-width="1.5" />
            {/* Toggle switch visual */}
            <rect x="250" y="195" width="10" height="15" rx="1" fill="#dc2626" />
            <text x="282" y="195" fill="#0f172a" font-size="8.5" font-weight="700">CB DC</text>
            <text x="282" y="206" fill="#475569" font-size="7.5" font-weight="600">1000VDC</text>
            <text x="282" y="217" fill="#475569" font-size="7.5" font-weight="600">32A</text>

            {/* DC SPD Box */}
            <rect x="345" y="175" width="36" height="55" rx="4" fill="#ea580c" stroke="#c2410c" stroke-width="1" />
            <rect x="351" y="185" width="10" height="15" fill="#16a34a" />
            <rect x="361" y="185" width="10" height="15" fill="#16a34a" />
            <text x="387" y="195" fill="#0f172a" font-size="8.5" font-weight="700">SPD DC</text>
            <text x="387" y="206" fill="#475569" font-size="7.5" font-weight="600">1000VDC</text>
            <text x="387" y="217" fill="#475569" font-size="7.5" font-weight="600">Type 2</text>

            {/* Ground for DC SPD */}
            <path d="M 363 230 L 363 250 L 390 250" className="line-pe" />
            <use href="#ground-symbol" x="390" y="250" />

            {/* 3. INVERTER BLOCK (MIDDLE LEFT) */}
            <rect x="180" y="275" width="180" height="105" rx="8" fill="#f8fafc" stroke="#94a3b8" stroke-width="2" />
            <rect x="180" y="275" width="180" height="16" rx="2" fill="#e2e8f0" />
            <text x="188" y="287" fill="#475569" font-size="8" font-weight="800">INVERTER</text>
            
            {/* Screen */}
            <rect x="205" y="305" width="130" height="40" rx="3" fill="#0f172a" />
            <text x="270" y="322" fill="#38bdf8" font-size="8.5" font-weight="700" text-anchor="middle">
              {cleanProductName(inverterName)}
            </text>
            <text x="270" y="337" fill="#10b981" font-size="8" font-weight="600" text-anchor="middle">
              SYSTEM ONLINE
            </text>
            
            {/* Status indicators */}
            <circle cx="200" cy="360" r="3" fill="#10b981" /> {/* Run */}
            <circle cx="212" cy="360" r="3" fill="#f59e0b" /> {/* Comm */}
            <circle cx="224" cy="360" r="3" fill="#dc2626" opacity="0.2" /> {/* Fault */}

            {/* Inverter Label */}
            <text x="270" y="260" fill="#0f172a" font-size="11" font-weight="800" text-anchor="middle">
              BIẾN TẦN: {cleanProductName(inverterName).toUpperCase()}
            </text>

            {/* 4. BATTERY STORAGE (BOTTOM LEFT - HYBRID ONLY) */}
            {hasBattery ? (
              <>
                {/* Battery Breaker */}
                <rect x="90" y="390" width="40" height="55" rx="4" fill="#f8fafc" stroke="#475569" stroke-width="1.2" />
                <line x1="100" y1="400" x2="100" y2="435" stroke="#0f172a" stroke-width="1.5" />
                <line x1="120" y1="400" x2="120" y2="435" stroke="#0f172a" stroke-width="1.5" />
                <rect x="105" y="410" width="10" height="15" rx="1" fill="#0f172a" />
                <text x="42" y="415" fill="#0f172a" font-size="8.5" font-weight="700">CB DC PIN</text>
                <text x="58" y="426" fill="#475569" font-size="7.5" font-weight="600">125A</text>

                {/* Battery Cabinet */}
                <rect x="130" y="460" width="80" height="110" rx="6" fill="#e2e8f0" stroke="#475569" stroke-width="2" />
                <rect x="130" y="460" width="80" height="12" fill="#cbd5e1" />
                <rect x="145" y="482" width="50" height="15" rx="2" fill="#0f172a" />
                <text x="170" y="493" fill="#38bdf8" font-size="8.5" font-weight="700" text-anchor="middle">
                  {batteryCapacity} kWh
                </text>
                
                {/* Horizontal cabinet lines */}
                <line x1="140" y1="515" x2="200" y2="515" stroke="#94a3b8" stroke-width="1.5" />
                <line x1="140" y1="535" x2="200" y2="535" stroke="#94a3b8" stroke-width="1.5" />
                <line x1="140" y1="555" x2="200" y2="555" stroke="#94a3b8" stroke-width="1.5" />
                
                {/* Brand Logo */}
                <text x="170" y="565" fill="#16a34a" font-size="10" font-weight="800" text-anchor="middle">
                  {batteryBrand}
                </text>

                <text x="220" y="515" fill="#0f172a" font-size="10.5" font-weight="700">PIN LƯU TRỮ</text>
                <text x="220" y="528" fill="#475569" font-size="9" font-weight="600">{cleanProductName(batteryName)}</text>
              </>
            ) : (
              /* If no battery, we draw a blank block or placeholder note */
              <>
                <rect x="130" y="460" width="80" height="110" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,4" />
                <text x="170" y="515" fill="#94a3b8" font-size="10" font-weight="700" text-anchor="middle">KHÔNG CÓ</text>
                <text x="170" y="530" fill="#94a3b8" font-size="8.5" font-weight="700" text-anchor="middle">LƯU TRỮ</text>
              </>
            )}

            {/* 5. UTILITY GRID & NET METER (CENTER TOP) */}
            {/* Transmission Tower SVG */}
            <g transform="translate(560, 20) scale(0.95)">
              {/* Electric lattice tower */}
              <line x1="40" y1="70" x2="20" y2="120" stroke="#0f172a" stroke-width="2" />
              <line x1="40" y1="70" x2="60" y2="120" stroke="#0f172a" stroke-width="2" />
              <line x1="20" y1="120" x2="60" y2="120" stroke="#0f172a" stroke-width="2" />
              <line x1="20" y1="120" x2="10" y2="170" stroke="#0f172a" stroke-width="2.2" />
              <line x1="60" y1="120" x2="70" y2="170" stroke="#0f172a" stroke-width="2.2" />
              <line x1="10" y1="170" x2="70" y2="170" stroke="#0f172a" stroke-width="2.2" />
              
              {/* Crossarms */}
              <line x1="5" y1="100" x2="75" y2="100" stroke="#0f172a" stroke-width="2" />
              <line x1="0" y1="130" x2="80" y2="130" stroke="#0f172a" stroke-width="2" />
              
              {/* Diagonals */}
              <line x1="30" y1="100" x2="40" y2="120" stroke="#0f172a" stroke-width="1.2" />
              <line x1="50" y1="100" x2="40" y2="120" stroke="#0f172a" stroke-width="1.2" />
              <line x1="20" y1="120" x2="40" y2="170" stroke="#0f172a" stroke-width="1.2" />
              <line x1="60" y1="120" x2="40" y2="170" stroke="#0f172a" stroke-width="1.2" />
              
              <text x="90" y="115" fill="#0f172a" font-size="10.5" font-weight="700">LƯỚI ĐIỆN</text>
              <text x="90" y="128" fill="#0f172a" font-size="10.5" font-weight="700">EVN</text>
            </g>

            {/* 2-Way Smart Meter */}
            <rect x="580" y="215" width="40" height="60" rx="4" fill="#f8fafc" stroke="#475569" stroke-width="1.5" />
            <rect x="585" y="222" width="30" height="15" rx="1" fill="#0f172a" />
            {/* Screen values representation */}
            <text x="600" y="232" fill="#38bdf8" font-size="7" font-weight="700" text-anchor="middle">220.5 V</text>
            <circle cx="590" cy="245" r="1.5" fill="#f59e0b" />
            <circle cx="610" cy="245" r="1.5" fill="#dc2626" />
            <text x="630" y="240" fill="#0f172a" font-size="9" font-weight="700">CÔNG TƠ ĐIỆN</text>
            <text x="630" y="252" fill="#0f172a" font-size="9" font-weight="700">2 CHIỀU</text>

            {/* Grid AC Breaker */}
            <rect x="580" y="295" width="40" height="55" rx="4" fill="#f8fafc" stroke="#475569" stroke-width="1.2" />
            <line x1="590" y1="305" x2="590" y2="340" stroke="#0f172a" stroke-width="1.5" />
            <line x1="610" y1="305" x2="610" y2="340" stroke="#0f172a" stroke-width="1.5" />
            <rect x="595" y="315" width="10" height="15" rx="1" fill="#dc2626" />
            <text x="630" y="320" fill="#0f172a" font-size="8.5" font-weight="700">CB AC</text>
            <text x="630" y="331" fill="#475569" font-size="7.5" font-weight="600">2P 63A</text>

            {/* 6. AC COMBINER BOX DETAILS (INSIDE DASHED BOX) */}
            {/* Main AC Breaker */}
            <rect x="710" y="315" width="40" height="55" rx="4" fill="#f8fafc" stroke="#475569" stroke-width="1.2" />
            <line x1="720" y1="325" x2="720" y2="360" stroke="#0f172a" stroke-width="1.5" />
            <line x1="740" y1="325" x2="740" y2="360" stroke="#0f172a" stroke-width="1.5" />
            <rect x="725" y="335" width="10" height="15" rx="1" fill="#0f172a" />
            <text x="704" y="385" fill="#0f172a" font-size="8.5" font-weight="700" text-anchor="middle">MAIN CB</text>
            <text x="704" y="396" fill="#475569" font-size="7.5" font-weight="600" text-anchor="middle">2P 63A</text>

            {/* RCBO */}
            <rect x="780" y="315" width="40" height="55" rx="4" fill="#f8fafc" stroke="#475569" stroke-width="1.2" />
            <line x1="790" y1="325" x2="790" y2="360" stroke="#0f172a" stroke-width="1.5" />
            <line x1="810" y1="325" x2="810" y2="360" stroke="#0f172a" stroke-width="1.5" />
            <rect x="795" y="330" width="10" height="12" fill="#e2e8f0" stroke="#475569" />
            <circle cx="800" cy="350" r="2.5" fill="#2563eb" />
            <text x="800" y="385" fill="#0f172a" font-size="8.5" font-weight="700" text-anchor="middle">RCBO</text>
            <text x="800" y="396" fill="#475569" font-size="7.5" font-weight="600" text-anchor="middle">2P 63A 30mA</text>

            {/* AC SPD */}
            <rect x="850" y="315" width="36" height="55" rx="4" fill="#ea580c" stroke="#c2410c" stroke-width="1" />
            <rect x="856" y="325" width="10" height="15" fill="#16a34a" />
            <rect x="866" y="325" width="10" height="15" fill="#16a34a" />
            <text x="868" y="385" fill="#0f172a" font-size="8.5" font-weight="700" text-anchor="middle">SPD AC</text>
            <text x="868" y="396" fill="#475569" font-size="7.5" font-weight="600" text-anchor="middle">275VAC Type 2</text>

            {/* AC SPD Ground Line */}
            <path d="M 868 370 L 868 410 L 910 410" className="line-pe" />
            <use href="#ground-symbol" x="910" y="410" />

            {/* CT Sensor (Current Transformer) */}
            <circle cx="920" cy="342" r="10" fill="none" stroke="#ea580c" stroke-width="2.5" />
            <rect x="916" y="337" width="8" height="10" fill="#0f172a" />
            <text x="920" y="362" fill="#ea580c" font-size="8.5" font-weight="800" text-anchor="middle">CT</text>

            {/* 7. LOADS / FAMILY APPLIANCES (BOTTOM RIGHT) */}
            {/* Household loads AC Breaker */}
            <rect x="780" y="440" width="40" height="55" rx="4" fill="#f8fafc" stroke="#475569" stroke-width="1.2" />
            <line x1="790" y1="450" x2="790" y2="485" stroke="#0f172a" stroke-width="1.5" />
            <line x1="810" y1="450" x2="810" y2="485" stroke="#0f172a" stroke-width="1.5" />
            <rect x="795" y="460" width="10" height="15" rx="1" fill="#dc2626" />
            <text x="832" y="465" fill="#0f172a" font-size="8.5" font-weight="700">CB AC</text>
            <text x="832" y="476" fill="#475569" font-size="7.5" font-weight="600">2P 63A</text>

            {/* House Icon & appliances */}
            <g transform="translate(560, 485) scale(1)">
              {/* House Outer Outline */}
              <path d="M 0 35 L 50 0 L 100 35 L 100 95 L 0 95 Z" fill="none" stroke="#0f172a" stroke-width="2" />
              <path d="M -5 35 L 50 -3 L 105 35" fill="none" stroke="#0f172a" stroke-width="2.5" />
              {/* Door */}
              <rect x="38" y="60" width="24" height="35" fill="none" stroke="#475569" stroke-width="1.2" />
              {/* Window */}
              <rect x="10" y="48" width="16" height="16" fill="none" stroke="#475569" stroke-width="1" />
              <line x1="18" y1="48" x2="18" y2="64" stroke="#475569" stroke-width="0.8" />
              <line x1="10" y1="56" x2="26" y2="56" stroke="#475569" stroke-width="0.8" />
              
              <text x="115" y="45" fill="#0f172a" font-size="11" font-weight="700">PHỤ TẢI</text>
              <text x="115" y="58" fill="#0f172a" font-size="11" font-weight="700">GIA ĐÌNH</text>
            </g>

            {/* WIRING CONNECTIONS PATHS */}
            
            {/* A. SOLAR TO INVERTER (DC STRING 1) */}
            {/* String 1 pos (red) */}
            <path d="M 44 122 L 44 152 L 245 152 L 245 175" className="line-dc-pos" />
            {/* String 1 neg (black) */}
            <path d="M 196 122 L 196 160 L 255 160 L 255 175" className="line-dc-neg" />

            {/* B. SOLAR TO INVERTER (DC STRING 2) */}
            {/* String 2 pos (red) */}
            <path d="M 264 122 L 264 152 L 245 152" className="line-dc-pos" />
            {/* String 2 neg (black) */}
            <path d="M 416 122 L 416 160 L 255 160" className="line-dc-neg" />

            {/* C. DC PROTECTION TO INVERTER */}
            {/* Breaker output to SPD input */}
            <path d="M 245 230 L 245 264 L 233 264 L 233 275" className="line-dc-pos" />
            <path d="M 255 230 L 255 268 L 247 268 L 247 275" className="line-dc-neg" />
            {/* Connect to SPD in parallel */}
            <path d="M 245 240 L 353 240 L 353 230" className="line-dc-pos" />
            <path d="M 255 248 L 363 248 L 363 230" className="line-dc-neg" />

            {/* D. BATTERY TO INVERTER (DC LƯU TRỮ) */}
            {hasBattery && (
              <>
                {/* Battery to Breaker */}
                <path d="M 150 460 L 150 420 L 130 420" className="line-dc-pos" />
                <path d="M 170 460 L 170 428 L 110 428 L 110 445" className="line-dc-neg" /> {/* Negative loop */}
                {/* Breaker output to Inverter */}
                <path d="M 100 390 L 100 365 L 195 365" className="line-dc-pos" />
                <path d="M 120 390 L 120 372 L 207 372" className="line-dc-neg" />
                {/* Comm line (blue dashed) from Battery to Inverter */}
                <path d="M 185 460 L 185 435 L 250 435 L 250 380" className="line-comm" />
                <rect x="238" y="405" width="24" height="12" rx="2" fill="#2563eb" />
                <text x="250" y="414" fill="#ffffff" font-size="7" font-weight="700" text-anchor="middle">BMS</text>
              </>
            )}

            {/* E. GRID TRANSMISSION LINE TO METER & CB */}
            <path d="M 600 170 L 600 215" className="line-ac-l" />
            <path d="M 590 170 L 590 200 L 590 215" className="line-ac-n" /> {/* Parallel N */}

            {/* Meter out to AC Breaker */}
            <path d="M 600 275 L 600 295" className="line-ac-l" />
            <path d="M 590 275 L 590 295" className="line-ac-n" />

            {/* F. AC BREAKER TO AC COMBINER BOX */}
            <path d="M 600 350 L 600 390 L 710 390 L 710 370" className="line-ac-l" />
            <path d="M 590 350 L 590 398 L 730 398 L 730 370" className="line-ac-n" />

            {/* G. INVERTER OUTPUT TO AC COMBINER BOX */}
            <path d="M 360 350 L 550 350 L 550 405 L 720 405 L 720 370" className="line-ac-l" />
            <path d="M 360 360 L 542 360 L 542 413 L 740 413 L 740 370" className="line-ac-n" />

            {/* H. COMBINER BOX TO HOUSE LOAD */}
            {/* Busbar links inside AC panel */}
            <path d="M 720 315 L 720 290 L 800 290 L 800 315" className="line-ac-l" />
            <path d="M 740 315 L 740 282 L 810 282 L 810 315" className="line-ac-n" />
            {/* Connection to AC SPD in parallel */}
            <path d="M 800 290 L 860 290 L 860 315" className="line-ac-l" />
            <path d="M 810 282 L 870 282 L 870 315" className="line-ac-n" />

            {/* RCBO output to household CB */}
            <path d="M 800 370 L 800 440" className="line-ac-l" />
            <path d="M 810 370 L 810 440" className="line-ac-n" />
            
            {/* Household CB to House load */}
            <path d="M 800 495 L 800 520 C 800 530, 640 530, 610 530 L 610 520" className="line-ac-l" />
            <path d="M 810 495 L 810 526 C 810 536, 648 536, 610 536" className="line-ac-n" />

            {/* I. CT CLAMP AND COMMUNICATIONS */}
            {/* CT Sensor clamp to main feed */}
            <path d="M 920 332 L 920 300 C 920 300, 740 300, 740 315" className="line-ct" />
            {/* CT Comm line back to Inverter */}
            <path d="M 930 342 L 950 342 L 950 200 C 950 200, 310 200, 310 275" className="line-comm" />
            
            {/* Ground line PE connections (Green dashed) */}
            <path d="M 330 380 L 330 440" className="line-pe" />
            <use href="#ground-symbol" x="330" y="440" />

            {/* PE link inside AC box */}
            <use href="#ground-symbol" x="910" y="410" />

            {/* 8. GHI CHÚ / INSTRUCTIONS BOX (BOTTOM MIDDLE) */}
            <g transform="translate(290, 420)">
              <rect x="0" y="0" width="250" height="98" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
              <text x="10" y="16" fill="#0f172a" font-size="9" font-weight="700">GHI CHÚ KỸ THUẬT:</text>
              <text x="10" y="32" fill="#475569" font-size="7.5">- Hệ thống tự động sạc xả lưu trữ và bù lưới.</text>
              <text x="10" y="44" fill="#475569" font-size="7.5">- Cài đặt chống phát ngược lưới (Zero Export)</text>
              <text x="10" y="56" fill="#475569" font-size="7.5">  theo yêu cầu kỹ thuật của EVN.</text>
              <text x="10" y="68" fill="#475569" font-size="7.5">- Dây DC: {cleanProductName(dcCableName)}.</text>
              <text x="10" y="80" fill="#475569" font-size="7.5">- Dây AC: {cleanProductName(acCableName)}.</text>
            </g>

            {/* 9. LEGENDS BOX (TOP RIGHT) */}
            <g transform="translate(680, 50)">
              <rect x="0" y="0" width="130" height="150" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
              <text x="65" y="18" fill="#0f172a" font-size="9.5" font-weight="700" text-anchor="middle">CHÚ THÍCH</text>
              
              {/* Legend lines */}
              <line x1="15" y1="36" x2="45" y2="36" stroke="#dc2626" stroke-width="2.5" />
              <text x="55" y="39" fill="#0f172a" font-size="8.5">DC + (Đỏ)</text>

              <line x1="15" y1="56" x2="45" y2="56" stroke="#0f172a" stroke-width="2.5" />
              <text x="55" y="59" fill="#0f172a" font-size="8.5">DC - (Đen)</text>

              <line x1="15" y1="76" x2="45" y2="76" stroke="#dc2626" stroke-width="2" />
              <text x="55" y="79" fill="#0f172a" font-size="8.5">AC Pha L</text>

              <line x1="15" y1="96" x2="45" y2="96" stroke="#0f172a" stroke-width="2" />
              <text x="55" y="99" fill="#0f172a" font-size="8.5">AC Trung tính N</text>

              <line x1="15" y1="116" x2="45" y2="116" stroke="#16a34a" stroke-dasharray="3,3" stroke-width="1.5" />
              <text x="55" y="119" fill="#0f172a" font-size="8.5">Dây tiếp địa PE</text>

              <line x1="15" y1="136" x2="45" y2="136" stroke="#2563eb" stroke-dasharray="3,3" stroke-width="1.5" />
              <text x="55" y="139" fill="#0f172a" font-size="8.5">Truyền thông BMS</text>
            </g>

            {/* 10. SYSTEM SPECIFICATIONS TABLE (TOP RIGHT) */}
            <g transform="translate(820, 50)">
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
                      <td style={{ fontWeight: 600 }}>Điện áp lưới</td>
                      <td>220V - 1 pha - 50Hz</td>
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
