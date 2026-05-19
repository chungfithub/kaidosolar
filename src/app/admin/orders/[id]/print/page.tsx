import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import PrintTrigger from "./PrintTrigger";

const prisma = new PrismaClient();

export default async function PrintQuotationPage({ params }: { params: { id: string } }) {
  const orderId = parseInt(params.id);
  
  if (isNaN(orderId)) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      items: {
        include: {
          product: true
        }
      }
    }
  });

  if (!order) {
    notFound();
  }

  const createdDate = new Date(order.createdAt);
  const dateString = `Ngày ${createdDate.getDate().toString().padStart(2, '0')} tháng ${createdDate.getMonth() + 1} năm ${createdDate.getFullYear()}`;

  return (
    <>
      <PrintTrigger label="🖨️ In Báo Giá" />
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
        
        .print-container {
          max-width: 210mm;
          min-height: 297mm;
          margin: 40px auto;
          background: white;
          padding: 20mm;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          font-family: 'Times New Roman', Times, serif;
          color: #000;
          line-height: 1.5;
        }

        .header-section {
          display: flex;
          border-bottom: 2px solid #e1251b;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }

        .logo-box {
          flex: 0 0 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .company-info {
          flex: 1;
          padding-left: 20px;
          font-size: 13px;
        }

        .company-name {
          color: #e1251b;
          font-weight: bold;
          font-size: 16px;
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        .quotation-title {
          text-align: center;
          margin: 30px 0 20px 0;
        }

        .quotation-title h1 {
          font-size: 24px;
          margin: 0;
          text-transform: uppercase;
          font-weight: bold;
        }

        .quotation-title p {
          font-style: italic;
          margin: 5px 0 0 0;
        }

        .customer-info {
          margin-bottom: 25px;
        }

        .customer-info table {
          width: 100%;
          border: none;
        }

        .customer-info td {
          padding: 5px 0;
          vertical-align: top;
          border: none;
        }

        .quotation-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }

        .quotation-table th, .quotation-table td {
          border: 1px solid #000;
          padding: 8px;
          font-size: 14px;
        }

        .quotation-table th {
          background-color: #f2f2f2;
          font-weight: bold;
          text-align: center;
        }

        .footer-notes {
          font-size: 14px;
          margin-bottom: 40px;
        }

        .signature-section {
          display: flex;
          justify-content: space-between;
          text-align: center;
          margin-top: 50px;
        }

        .signature-box {
          width: 45%;
        }

        .btn-print {
          position: fixed;
          bottom: 30px;
          right: 30px;
          background: #0ea5e9;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-family: inherit;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          z-index: 1000;
        }
      `}} />


      <div className="print-container">
        {/* Header */}
        <div className="header-section">
          <div className="logo-box">
            <h2 style={{ color: '#0ea5e9', fontSize: '32px', margin: 0, fontWeight: 900, fontStyle: 'italic' }}>
              KAIDO<span style={{ color: '#f59e0b' }}>SOLAR</span>
            </h2>
          </div>
          <div className="company-info">
            <div className="company-name">CÔNG TY TNHH ĐIỆN MẶT TRỜI KAIDO VIỆT NAM</div>
            <div><strong>Địa chỉ:</strong> Số 123 Đường Điện Quang, Quận Ánh Sáng, TP. Hồ Chí Minh</div>
            <div><strong>Hotline:</strong> 1900 9999 - <strong>Zalo:</strong> 0987 654 321</div>
            <div><strong>Email:</strong> contact@kaidosolar.vn - <strong>Website:</strong> www.kaidosolar.vn</div>
          </div>
        </div>

        {/* Title */}
        <div className="quotation-title">
          <h1>BẢNG BÁO GIÁ DỰ KIẾN</h1>
          <p>({dateString})</p>
        </div>

        {/* Customer Info */}
        <div className="customer-info">
          <table>
            <tbody>
              <tr>
                <td style={{ width: '15%' }}>Kính gửi:</td>
                <td style={{ width: '45%' }}><strong>{order.customer.name}</strong></td>
                <td style={{ width: '15%' }}>Mã báo giá:</td>
                <td style={{ width: '25%' }}><strong>{order.orderCode}</strong></td>
              </tr>
              <tr>
                <td>Địa chỉ:</td>
                <td>{order.customer.address || "..........................................................."}</td>
                <td>Điện thoại:</td>
                <td>{order.customer.phone}</td>
              </tr>
              {order.customer.email && (
                <tr>
                  <td>Email:</td>
                  <td>{order.customer.email}</td>
                  <td></td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
          <p style={{ marginTop: '15px' }}>
            Kaido Solar hân hạnh gửi đến Quý Khách bảng báo giá thiết bị và dịch vụ theo mô tả dưới đây:
          </p>
        </div>

        {/* Table */}
        <table className="quotation-table">
          <thead>
            <tr>
              <th style={{ width: '5%' }}>STT</th>
              <th style={{ width: '35%' }}>Tên thiết bị / Dịch vụ</th>
              <th style={{ width: '15%' }}>Hãng SX</th>
              <th style={{ width: '10%' }}>ĐVT</th>
              <th style={{ width: '10%' }}>S.Lượng</th>
              <th style={{ width: '10%' }}>Đơn giá</th>
              <th style={{ width: '15%' }}>Thành tiền (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={item.id}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td>
                  <strong>{item.product.name}</strong>
                  {item.warrantyNote && <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>Bảo hành: {item.warrantyNote}</div>}
                </td>
                <td style={{ textAlign: 'center' }}>{item.product.brand || '-'}</td>
                <td style={{ textAlign: 'center' }}>Cái/Bộ</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{item.unitPrice.toLocaleString('en-US')}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{(item.unitPrice * item.quantity).toLocaleString('en-US')}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={6} style={{ textAlign: 'right', fontWeight: 'bold', paddingRight: '15px' }}>TỔNG CỘNG</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '16px', color: '#e1251b' }}>
                {order.total.toLocaleString('en-US')}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer Notes */}
        <div className="footer-notes">
          <p><strong>Ghi chú:</strong></p>
          <ul style={{ margin: '5px 0 15px 0', paddingLeft: '20px' }}>
            <li>Báo giá trên chưa bao gồm thuế VAT 8% hoặc 10% (nếu có yêu cầu xuất hóa đơn).</li>
            <li>Đã bao gồm chi phí vận chuyển trong bán kính 20km.</li>
            <li>Báo giá có giá trị trong vòng 15 ngày kể từ ngày báo giá.</li>
            {order.notes && <li>{order.notes}</li>}
          </ul>

          <p><strong>Bảo hành:</strong></p>
          <ul style={{ margin: '5px 0 15px 0', paddingLeft: '20px' }}>
            <li>Tấm Pin NLMT: Bảo hành vật lý 12 năm, hiệu suất 25 năm.</li>
            <li>Bộ Inverter: Bảo hành 5 năm.</li>
            <li>Phụ kiện và nhân công lắp đặt: Bảo hành 1 năm.</li>
          </ul>
        </div>

        {/* Signatures */}
        <div className="signature-section">
          <div className="signature-box">
            <strong>ĐẠI DIỆN KHÁCH HÀNG</strong>
            <p style={{ fontStyle: 'italic', fontSize: '12px', marginTop: '5px' }}>(Ký và ghi rõ họ tên)</p>
          </div>
          <div className="signature-box">
            <strong>ĐẠI DIỆN KAIDO SOLAR</strong>
            <p style={{ fontStyle: 'italic', fontSize: '12px', marginTop: '5px' }}>(Ký và ghi rõ họ tên)</p>
            <div style={{ height: '80px' }}></div>
            <strong>Nhân viên Kinh Doanh</strong>
          </div>
        </div>
      </div>
    </>
  );
}
