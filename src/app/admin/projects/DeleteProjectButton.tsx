'use client';

import { useState, useActionState, useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { deleteProjectSecure } from '@/app/actions/project';

export default function DeleteProjectButton({ projectId, projectName }: { projectId: number, projectName: string }) {
  const [showModal, setShowModal] = useState(false);
  const [state, formAction, isPending] = useActionState(deleteProjectSecure, null);

  // Close modal if success
  useEffect(() => {
    if (state?.success) {
      setShowModal(false);
    }
  }, [state]);

  return (
    <>
      <button 
        className="btn btn-action btn-danger" 
        onClick={() => setShowModal(true)}
        title="Xóa dự án"
      >
        <Trash2 size={16} />
      </button>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '90%', position: 'relative' }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ 
                width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,71,87,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                color: 'var(--danger)'
              }}>
                <AlertTriangle size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Xóa vĩnh viễn dự án?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Bạn đang chuẩn bị xóa dự án <strong>{projectName}</strong>. Hành động này không thể hoàn tác. 
                Vui lòng nhập mật khẩu quản trị để xác nhận.
              </p>
            </div>

            <form action={formAction}>
              <input type="hidden" name="projectId" value={projectId} />
              
              {state?.error && (
                <div style={{ color: 'var(--danger)', background: 'rgba(255,71,87,0.1)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>
                  {state.error}
                </div>
              )}

              <div className="form-group">
                <input 
                  type="password" 
                  name="password" 
                  required 
                  placeholder="Nhập mật khẩu của bạn..." 
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-danger" style={{ flex: 1, opacity: isPending ? 0.7 : 1 }} disabled={isPending}>
                  {isPending ? 'Đang xóa...' : 'Xác nhận Xóa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
