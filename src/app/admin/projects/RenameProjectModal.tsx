'use client';

import { useState } from 'react';
import { X, Edit3 } from 'lucide-react';
import { renameProject } from '@/app/actions/project';

interface Props {
  projectId: number;
  initialName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newName: string) => void;
}

export default function RenameProjectModal({ projectId, initialName, isOpen, onClose, onSuccess }: Props) {
  const [name, setName] = useState(initialName);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tên dự án không được để trống.');
      return;
    }
    setIsPending(true);
    setError(null);

    try {
      const res = await renameProject(projectId, name);
      if (res.error) {
        setError(res.error);
      } else {
        if (onSuccess) onSuccess(name.trim());
        onClose();
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi đổi tên dự án.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="card" style={{ maxWidth: '450px', width: '90%', position: 'relative', background: 'var(--dark-surface)' }}>
        <button 
          onClick={onClose}
          type="button"
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)'
          }}>
            <Edit3 size={20} />
          </div>
          <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--accent)' }}>Đổi tên dự án</h3>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ color: 'var(--danger)', background: 'rgba(255,71,87,0.1)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Tên dự án mới</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              required 
              placeholder="Nhập tên dự án mới..." 
              autoFocus
              className="form-control"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--dark)'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose} disabled={isPending}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, opacity: isPending ? 0.7 : 1 }} disabled={isPending}>
              {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
