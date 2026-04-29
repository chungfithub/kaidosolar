'use client';

import { useActionState } from 'react';
import { createProject } from '@/app/actions/project';
import { Building, UserCircle, Send } from 'lucide-react';

const initialState = {
  error: '',
};

type Customer = {
  id: number;
  name: string;
  phone: string;
};

export default function ProjectForm({ customers }: { customers: Customer[] }) {
  const [state, formAction, isPending] = useActionState(createProject, initialState);

  return (
    <div className="card">
      <div className="card-header">
        <Building size={20} color="var(--primary)" />
        Thông tin dự án
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
        Nhập thông tin cơ bản để khởi tạo dự án mới
      </p>

      <form action={formAction}>
        {state?.error && (
          <div style={{ background: 'rgba(255,71,87,0.1)', color: 'var(--danger)', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem' }}>
            {state.error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="name">
            Tên dự án <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="VD: Điện mặt trời 10kWp áp mái - Anh Cường"
          />
        </div>

        <div className="form-group">
          <label htmlFor="customerId">
            Khách hàng <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <select id="customerId" name="customerId" required defaultValue="">
            <option value="" disabled>-- Chọn khách hàng --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.phone}
              </option>
            ))}
          </select>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            * Nếu chưa có khách hàng, vui lòng tạo mới tại mục Quản lý Khách hàng trước.
          </p>
        </div>

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={isPending}
            className="btn btn-primary"
            style={{ padding: '14px 28px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', opacity: isPending ? 0.7 : 1 }}
          >
            {isPending ? 'Đang xử lý...' : (
              <>
                Tạo dự án mới
                <Send size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
