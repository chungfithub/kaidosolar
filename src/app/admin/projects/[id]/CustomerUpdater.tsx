'use client';

import { useState, useTransition } from 'react';
import { updateProjectCustomer } from '@/app/actions/project';
import { Edit2, Check, X, PlusCircle } from 'lucide-react';

type Customer = {
  id: number;
  name: string;
  phone: string;
};

type Props = {
  projectId: number;
  currentCustomer: Customer | null;
  availableCustomers: Customer[];
};

export default function CustomerUpdater({ projectId, currentCustomer, availableCustomers }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(currentCustomer ? String(currentCustomer.id) : '');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const handleSave = () => {
    setError('');
    startTransition(async () => {
      const targetId = selectedCustomerId === '' ? null : parseInt(selectedCustomerId, 10);
      const res = await updateProjectCustomer(projectId, targetId);
      if (res.error) {
        setError(res.error);
      } else {
        setIsEditing(false);
      }
    });
  };

  if (isEditing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chọn khách hàng</p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            disabled={isPending}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
              color: 'var(--text)',
              fontSize: '0.95rem',
            }}
          >
            <option value="">-- Bỏ trống (Không gán) --</option>
            {availableCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={isPending}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isPending ? 0.7 : 1,
            }}
            title="Lưu"
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => {
              setSelectedCustomerId(currentCustomer ? String(currentCustomer.id) : '');
              setIsEditing(false);
              setError('');
            }}
            disabled={isPending}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(255,71,87,0.1)',
              color: 'var(--danger)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Hủy"
          >
            <X size={16} />
          </button>
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Khách hàng</p>
        {currentCustomer ? (
          <>
            <p style={{ fontWeight: 600, fontSize: '1.1rem', marginTop: '2px' }}>{currentCustomer.name}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{currentCustomer.phone}</p>
          </>
        ) : (
          <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '2px' }}>
            Chưa gán khách hàng
          </p>
        )}
      </div>
      <button
        onClick={() => setIsEditing(true)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.85rem',
          padding: '4px 8px',
          borderRadius: '4px',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(9, 132, 227, 0.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        {currentCustomer ? (
          <>
            <Edit2 size={14} />
            Thay đổi
          </>
        ) : (
          <>
            <PlusCircle size={14} />
            Gán khách hàng
          </>
        )}
      </button>
    </div>
  );
}
