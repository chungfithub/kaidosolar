'use client';

import { useState } from 'react';
import { Box, HardHat, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { addProjectItem, removeProjectItem, assignInstaller, updateProjectItem } from '@/app/actions/project';

export default function ProjectDashboardClient({ project, availableProducts, availableInstallers }: any) {
  const [addingItem, setAddingItem] = useState(false);
  const [addingInstaller, setAddingInstaller] = useState(false);
  
  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editQuantity, setEditQuantity] = useState<number>(0);

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditPrice(item.price);
    setEditQuantity(item.quantity);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSave = async (itemId: number) => {
    await updateProjectItem(project.id, itemId, editQuantity, editPrice);
    setEditingId(null);
  };

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
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {project.items.map((item: any) => {
                const isEditing = editingId === item.id;
                return (
                  <tr key={item.id}>
                    <td>{item.product.name}</td>
                    <td>
                      {isEditing ? (
                        <input 
                          type="number" 
                          className="form-control" 
                          style={{ width: '130px', padding: '6px 8px', margin: 0, fontSize: '0.9rem' }} 
                          value={editPrice}
                          onChange={e => setEditPrice(parseInt(e.target.value, 10) || 0)}
                        />
                      ) : (
                        `${new Intl.NumberFormat('en-US').format(item.price)}đ`
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input 
                          type="number" 
                          className="form-control" 
                          style={{ width: '80px', padding: '6px 8px', margin: 0, fontSize: '0.9rem' }} 
                          value={editQuantity}
                          onChange={e => setEditQuantity(parseInt(e.target.value, 10) || 0)}
                          min={1}
                        />
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td style={{ fontWeight: 'bold' }}>
                      {isEditing ? (
                        `${new Intl.NumberFormat('en-US').format(editPrice * editQuantity)}đ`
                      ) : (
                        `${new Intl.NumberFormat('en-US').format(item.price * item.quantity)}đ`
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {isEditing ? (
                          <>
                            <button 
                              className="btn btn-action" 
                              style={{ background: '#10b981', color: 'white', padding: '6px' }}
                              onClick={() => handleSave(item.id)}
                              title="Lưu thay đổi"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              className="btn btn-action btn-outline" 
                              style={{ padding: '6px' }}
                              onClick={cancelEdit}
                              title="Hủy"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="btn btn-action btn-outline" 
                              style={{ padding: '6px', color: 'var(--primary)' }}
                              onClick={() => startEdit(item)}
                              title="Chỉnh sửa đơn giá & số lượng"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="btn btn-danger btn-action" 
                              style={{ padding: '6px' }}
                              onClick={() => removeProjectItem(project.id, item.id)}
                              title="Xóa sản phẩm"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
