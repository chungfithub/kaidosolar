import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import PrintTrigger from "@/app/admin/orders/[id]/print/PrintTrigger";

const prisma = new PrismaClient();

// High-quality Vietnamese money number to words reader
function numberToVietnameseWords(num: number): string {
  if (num === 0) return "Không đồng";
  
  const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const places = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  
  const readThreeDigits = (n: number, showZero: boolean): string => {
    let hundred = Math.floor(n / 100);
    let ten = Math.floor((n % 100) / 10);
    let one = n % 10;
    let res = "";
    
    if (hundred > 0 || showZero) {
      res += units[hundred] + " trăm ";
    }
    
    if (ten > 0) {
      if (ten === 1) res += "mười ";
      else res += units[ten] + " mươi ";
    } else if (hundred > 0 && one > 0) {
      res += "lẻ ";
    }
    
    if (one > 0) {
      if (one === 1 && ten > 1) res += "mốt";
      else if (one === 5 && ten > 0) res += "lăm";
      else res += units[one];
    }
    
    return res.trim();
  };
  
  let strNum = Math.floor(num).toString();
  let groups: string[] = [];
  while (strNum.length > 0) {
    groups.push(strNum.substring(Math.max(0, strNum.length - 3)));
    strNum = strNum.substring(0, Math.max(0, strNum.length - 3));
  }
  
  let resWords = "";
  for (let i = groups.length - 1; i >= 0; i--) {
    let val = parseInt(groups[i], 10);
    if (val > 0) {
      let groupWords = readThreeDigits(val, i < groups.length - 1);
      resWords += groupWords + " " + places[i] + " ";
    }
  }
  
  resWords = resWords.trim();
  if (resWords.length > 0) {
    resWords = resWords.charAt(0).toUpperCase() + resWords.slice(1) + " đồng";
  }
  return resWords.replace(/\s+/g, ' ');
}

export const dynamic = "force-dynamic";

export default async function PrintProjectContractPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const projectIdStr = resolvedParams.id;
  
  if (!projectIdStr) {
    notFound();
  }
  
  const projectId = parseInt(projectIdStr, 10);
  if (isNaN(projectId)) {
    notFound();
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      customer: true
    }
  });

  if (!project) {
    notFound();
  }

  const currentDate = new Date();
  const contractDateString = `ngày ${currentDate.getDate().toString().padStart(2, '0')} tháng ${(currentDate.getMonth() + 1).toString().padStart(2, '0')} năm ${currentDate.getFullYear()}`;
  const contractCode = `HĐ-PJ-${project.id.toString().padStart(5, '0')}/KAIDOSOLAR`;

  // Milestone Calculations
  const totalCost = project.totalCost || 0;
  const phase1Cost = Math.round(totalCost * 0.5);
  const phase2Cost = Math.round(totalCost * 0.4);
  const phase3Cost = totalCost - phase1Cost - phase2Cost;

  return (
    <>
      <PrintTrigger label="🖨️ In Hợp Đồng" />
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4;
            margin: 15mm 20mm 15mm 20mm;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
        
        .print-container {
          max-width: 210mm;
          min-height: 297mm;
          margin: 40px auto;
          background: white;
          padding: 20mm 20mm;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          font-family: 'Times New Roman', Times, serif;
          color: #000;
          line-height: 1.6;
          font-size: 14.5px;
          text-align: justify;
        }

        .national-header {
          text-align: center;
          margin-bottom: 25px;
          line-height: 1.3;
        }

        .national-title {
          font-weight: bold;
          font-size: 15px;
          text-transform: uppercase;
        }

        .national-subtitle {
          font-weight: bold;
          font-size: 14px;
        }

        .national-divider {
          width: 140px;
          height: 1px;
          background: #000;
          margin: 6px auto 0 auto;
        }

        .contract-title {
          text-align: center;
          margin: 30px 0 20px 0;
          line-height: 1.4;
        }

        .contract-title h1 {
          font-size: 18px;
          margin: 0;
          text-transform: uppercase;
          font-weight: bold;
        }

        .contract-title p {
          font-style: italic;
          margin: 6px 0 0 0;
          font-size: 14px;
        }

        .party-header {
          font-weight: bold;
          text-transform: uppercase;
          margin-top: 15px;
          margin-bottom: 8px;
          display: block;
        }

        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
        }

        .info-table td {
          padding: 3px 0;
          border: none !important;
          vertical-align: top;
        }

        .info-label {
          width: 24%;
          font-weight: normal;
        }

        .info-value {
          width: 76%;
        }

        .article-title {
          font-weight: bold;
          margin-top: 18px;
          margin-bottom: 6px;
          text-transform: uppercase;
        }

        .bullet-list {
          margin: 4px 0 10px 0;
          padding-left: 20px;
        }

        .bullet-list li {
          margin-bottom: 4px;
        }

        .signature-section {
          display: flex;
          justify-content: space-between;
          text-align: center;
          margin-top: 45px;
          page-break-inside: avoid;
        }

        .signature-box {
          width: 45%;
        }

        .btn-print {
          position: fixed;
          bottom: 30px;
          right: 30px;
          background: #10b981;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-family: inherit;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          z-index: 1000;
          font-weight: bold;
          transition: all 0.2s;
        }
        
        .btn-print:hover {
          background: #059669;
          transform: translateY(-2px);
        }
      `}} />

      <div className="print-container">
        {/* National Header */}
        <div className="national-header">
          <div className="national-title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div className="national-subtitle">Độc lập - Tự do - Hạnh phúc</div>
          <div className="national-divider"></div>
        </div>

        {/* Contract Title */}
        <div className="contract-title">
          <h1>HỢP ĐỒNG LẮP ĐẶT HỆ THỐNG ĐIỆN MẶT TRỜI</h1>
          <p>Số: {contractCode}</p>
        </div>

        {/* Intro */}
        <p style={{ textIndent: '25px', marginBottom: '15px' }}>
          Hôm nay, {contractDateString}, tại văn phòng Công ty TNHH Kaido Solar, chúng tôi gồm có các bên dưới đây cùng thỏa thuận ký kết hợp đồng mua bán và lắp đặt hệ thống điện năng lượng mặt trời:
        </p>

        {/* Party A */}
        <span className="party-header">BÊN THI CÔNG (BÊN A): CÔNG TY TNHH KAIDO SOLAR</span>
        <table className="info-table">
          <tbody>
            <tr>
              <td className="info-label">Đại diện pháp luật:</td>
              <td className="info-value"><strong>Ông Nguyễn Văn A</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Chức vụ: Giám đốc</td>
            </tr>
            <tr>
              <td className="info-label">Địa chỉ:</td>
              <td className="info-value">Xã Thổ Tang - Tỉnh Phú Thọ</td>
            </tr>
            <tr>
              <td className="info-label">Hotline / Zalo:</td>
              <td className="info-value">0901.096.096</td>
            </tr>
            <tr>
              <td className="info-label">Email:</td>
              <td className="info-value">contact@kaidosolar.com &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Website: www.kaidosolar.com</td>
            </tr>
          </tbody>
        </table>

        {/* Party B */}
        <span className="party-header">BÊN THỤ HƯỞNG (BÊN B): KHÁCH HÀNG</span>
        <table className="info-table">
          <tbody>
            <tr>
              <td className="info-label">Họ và tên:</td>
              <td className="info-value"><strong>{project.customer.name}</strong></td>
            </tr>
            <tr>
              <td className="info-label">Địa chỉ:</td>
              <td className="info-value">{project.customer.address || "..................................................................................................."}</td>
            </tr>
            <tr>
              <td className="info-label">Điện thoại:</td>
              <td className="info-value">{project.customer.phone}</td>
            </tr>
            {project.customer.email && (
              <tr>
                <td className="info-label">Email:</td>
                <td className="info-value">{project.customer.email}</td>
              </tr>
            )}
          </tbody>
        </table>

        <p style={{ marginBottom: '15px' }}>
          Sau khi bàn bạc, trao đổi ý kiến thống nhất, hai bên cùng ký kết Hợp đồng kinh tế này với các điều khoản thỏa thuận cụ thể dưới đây:
        </p>

        {/* Article 1 */}
        <div className="article-title">ĐIỀU 1: NỘI DUNG VÀ ĐỊA ĐIỂM LẮP ĐẶT</div>
        <p style={{ textIndent: '25px' }}>
          Bên B đồng ý mua và Bên A đồng ý cung cấp thiết bị, vật tư và triển khai thi công lắp đặt trọn gói hệ thống Điện năng lượng mặt trời cho Bên B:
        </p>
        <ul className="bullet-list">
          <li><strong>Tên dự án:</strong> {project.name}</li>
          <li><strong>Địa điểm thi công lắp đặt:</strong> Tại địa chỉ của Bên B nêu trên.</li>
          <li><strong>Chi tiết cấu hình thiết bị vật tư:</strong> Được thống nhất và đính kèm đầy đủ trong Bảng báo giá chi tiết số <strong>BG-PJ-{project.id.toString().padStart(5, '0')}</strong>.</li>
        </ul>

        {/* Article 2 */}
        <div className="article-title">ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN</div>
        <p style={{ textIndent: '25px' }}>
          1. <strong>Tổng giá trị hợp đồng trọn gói:</strong> <strong>{totalCost.toLocaleString('en-US')} VNĐ</strong>.
        </p>
        <p style={{ textIndent: '25px', marginTop: '4px' }}>
          (Bằng chữ: <em>{numberToVietnameseWords(totalCost)}</em>).
        </p>
        <p style={{ textIndent: '25px', marginTop: '6px' }}>
          2. <strong>Tiến độ và Phương thức thanh toán:</strong> Bên B thanh toán cho Bên A theo hình thức chuyển khoản hoặc tiền mặt chia làm 03 đợt cụ thể như sau:
        </p>
        <ul className="bullet-list">
          <li><strong>Đợt 1 (Tạm ứng 50%):</strong> Thanh toán số tiền <strong>{phase1Cost.toLocaleString('en-US')} VNĐ</strong> ngay sau khi hai bên ký kết hợp đồng này để Bên A chuẩn bị và tập kết vật tư.</li>
          <li><strong>Đợt 2 (Thanh toán 40%):</strong> Thanh toán tiếp số tiền <strong>{phase2Cost.toLocaleString('en-US')} VNĐ</strong> ngay sau khi Bên A tập kết đầy đủ các thiết bị chính (Tấm pin mặt trời, Inverter biến tần) đến địa điểm công trình của Bên B.</li>
          <li><strong>Đợt 3 (Thanh toán 10% còn lại):</strong> Thanh toán số tiền còn lại là <strong>{phase3Cost.toLocaleString('en-US')} VNĐ</strong> trong vòng 03 ngày làm việc kể từ ngày hai bên tiến hành nghiệm thu, đóng điện vận hành và bàn giao hệ thống đưa vào sử dụng.</li>
        </ul>

        {/* Article 3 */}
        <div className="article-title">ĐIỀU 3: TIẾN ĐỘ THI CÔNG VÀ BÀN GIAO</div>
        <p style={{ textIndent: '25px' }}>
          Thời gian thi công và hoàn thiện bàn giao đưa hệ thống vào sử dụng từ **03 đến 07 ngày làm việc** kể từ ngày Bên A nhận được đầy đủ số tiền tạm ứng Đợt 1 của Bên B và mặt bằng thi công đủ điều kiện kỹ thuật an toàn để lắp đặt.
        </p>

        {/* Article 4 */}
        <div className="article-title">ĐIỀU 4: QUY CHẾ BẢO HÀNH VÀ BẢO TRÌ</div>
        <p style={{ textIndent: '25px' }}>
          Bên A cam kết cung cấp thiết bị chính hãng mới 100% và bảo hành hệ thống theo đúng tiêu chuẩn nhà sản xuất và thời hạn bảo hành chi tiết cho từng loại thiết bị vật tư được hiển thị rõ ràng trên Bảng báo giá đi kèm hợp đồng.
        </p>

        {/* Article 5 */}
        <div className="article-title">ĐIỀU 5: ĐIỀU KHOẢN CHUNG</div>
        <p style={{ textIndent: '25px' }}>
          1. Hai bên cam kết thực hiện đúng và đầy đủ các điều khoản đã thỏa thuận trong hợp đồng này. Trường hợp có phát sinh vướng mắc trong quá trình thực hiện, hai bên sẽ cùng đàm phán giải quyết trên tinh thần hợp tác thiện chí.
        </p>
        <p style={{ textIndent: '25px', marginTop: '4px' }}>
          2. Hợp đồng này được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản để thực hiện. Hợp đồng chính thức có hiệu lực kể từ ngày ký.
        </p>

        {/* Signatures */}
        <div className="signature-section">
          <div className="signature-box">
            <strong>ĐẠI DIỆN BÊN B</strong>
            <p style={{ fontStyle: 'italic', fontSize: '12px', marginTop: '5px', color: '#475569' }}>(Ký và ghi rõ họ tên)</p>
            <div style={{ height: '80px' }}></div>
          </div>
          <div className="signature-box">
            <strong>ĐẠI DIỆN BÊN A</strong>
            <p style={{ fontStyle: 'italic', fontSize: '12px', marginTop: '5px', color: '#475569' }}>(Ký, đóng dấu và ghi rõ họ tên)</p>
            <div style={{ height: '80px' }}></div>
            <strong style={{ textTransform: 'uppercase' }}>CÔNG TY TNHH KAIDO SOLAR</strong>
          </div>
        </div>
      </div>
    </>
  );
}
