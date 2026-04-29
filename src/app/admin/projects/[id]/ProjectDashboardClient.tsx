'use client';

import { useState } from 'react';
import { Box, HardHat, Plus, Trash2 } from 'lucide-react';
import { addProjectItem, removeProjectItem, assignInstaller } from '@/app/actions/project';

export default function ProjectDashboardClient({ project, availableProducts, availableInstallers }: any) {
  const [addingItem, setAddingItem] = useState(false);
  const [addingInstaller, setAddingInstaller] = useState(false);

  return (
    <>
      {/* ITEMS CARD */}
      <div className="card">
        <div className="card-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Box size={20} color="var(--primary)" />
            Danh sách Thiết bị (BOM)
          </div>
          <button className="btn btn-primary btn-action" onClick={() => setAddingItem(!addingItem)}>
            <Plus size={16} /> Thêm thiết bị
          </button>
        </div>

        {addingItem && (
          <form action={async (formData) => {
            formData.append('projectId', project.id.toString());
            await addProjectItem(null, formData);
            setAddingItem(false);
          }} style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 2, margin: 0 }}>
                <select name="productId" required style={{ width: '100%', padding: '10px' }}>
                  <option value="">-- Chọn sản phẩm --</option>
                  {availableProducts.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} - {new Intl.NumberFormat('en-US').format(p.price)}đ</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <input type="number" name="quantity" defaultValue={1} min={1} required style={{ width: '100%', padding: '10px' }} placeholder="Số lượng" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>Thêm</button>
            </div>
          </form>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tên thiết bị</th>
                <th>Đơn giá</th>
                <th>Số lượng</th>
                <th>Thành tiền</th>
                <th>Xóa</th>
              </tr>
            </thead>
            <tbody>
              {project.items.map((item: any) => (
                <tr key={item.id}>
                  <td>{item.product.name}</td>
                  <td>{new Intl.NumberFormat('en-US').format(item.price)}đ</td>
                  <td>{item.quantity}</td>
                  <td style={{ fontWeight: 'bold' }}>{new Intl.NumberFormat('en-US').format(item.price * item.quantity)}đ</td>
                  <td>
                    <button 
                      className="btn btn-danger btn-action" 
                      onClick={() => removeProjectItem(project.id, item.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {project.items.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có thiết bị nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSTALLERS CARD */}
      <div className="card">
        <div className="card-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardHat size={20} color="var(--primary)" />
            Nhân sự thi công
          </div>
          <button className="btn btn-outline btn-action" onClick={() => setAddingInstaller(!addingInstaller)}>
            <Plus size={16} /> Phân công Kỹ Thuật
          </button>
        </div>

        {addingInstaller && (
          <form action={async (formData) => {
            formData.append('projectId', project.id.toString());
            await assignInstaller(null, formData);
            setAddingInstaller(false);
          }} style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <select name="installerId" required style={{ width: '100%', padding: '10px' }}>
                  <option value="">-- Chọn Kỹ Thuật --</option>
                  {availableInstallers.map((i: any) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>Phân công</button>
            </div>
          </form>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tên Kỹ Thuật</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {project.installers.map((pi: any) => (
                <tr key={pi.id}>
                  <td><strong>{pi.installer.name}</strong></td>
                  <td>
                    <span className="badge badge-pending">Đã phân công</span>
                  </td>
                </tr>
              ))}
              {project.installers.length === 0 && (
                <tr>
                  <td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa phân công kỹ thuật nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
