"use client";
import { updateProjectStatus } from '@/app/actions/project';
import { useState } from 'react';

const steps = [
  { id: 'draft', label: 'Báo Giá', activeBg: '#FEF08A', activeColor: '#854D0E', shadow: 'rgba(254,240,138,0.6)' },
  { id: 'in_progress', label: 'Đang thi công', activeBg: '#BAE6FD', activeColor: '#0369A1', shadow: 'rgba(186,230,253,0.6)' },
  { id: 'completed', label: 'Hoàn thành', activeBg: 'var(--primary)', activeColor: 'white', shadow: 'rgba(16,185,129,0.4)' }
];

export default function StatusUpdater({ projectId, currentStatus }: { projectId: number, currentStatus: string }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const handleStepClick = (targetStatusId: string) => {
    if (isUpdating || targetStatusId === currentStatus) return;
    setPendingStatus(targetStatusId);
  };

  const confirmUpdate = async () => {
    if (!pendingStatus) return;
    setIsUpdating(true);
    await updateProjectStatus(projectId, pendingStatus);
    setIsUpdating(false);
    setPendingStatus(null);
  };

  const currentIndex = steps.findIndex(s => s.id === currentStatus);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '400px' }}>
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isPast = index < currentIndex;
        
        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: index === steps.length - 1 ? '0' : '1' }}>
            <button
              onClick={() => handleStepClick(step.id)}
              disabled={isUpdating}
              style={{
                background: (isActive || isPast) ? step.activeBg : 'var(--dark)',
                color: (isActive || isPast) ? step.activeColor : 'var(--text-muted)',
                border: (isActive || isPast) ? 'none' : '1px solid var(--border)',
                padding: '6px 16px',
                borderRadius: '50px',
                fontSize: '0.85rem',
                fontWeight: isActive ? 'bold' : '500',
                cursor: (isActive || isUpdating) ? 'default' : 'pointer',
                transition: 'all 0.3s',
                opacity: isUpdating && isActive ? 0.7 : 1,
                boxShadow: isActive ? `0 4px 12px ${step.shadow}` : 'none',
                whiteSpace: 'nowrap'
              }}
              title={isActive ? "" : `Chuyển sang ${step.label}`}
            >
              {step.label}
            </button>
            
            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div style={{
                height: '3px',
                flex: 1,
                background: isPast ? step.activeBg : 'var(--border)',
                margin: '0 8px',
                borderRadius: '2px',
                transition: 'all 0.3s'
              }}></div>
            )}
          </div>
        );
      })}

      {/* Confirmation Modal */}
      {pendingStatus && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{ 
            background: 'white', 
            padding: '24px', 
            borderRadius: '12px', 
            maxWidth: '400px', 
            width: '90%', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)' 
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.2rem' }}>Xác nhận tiến độ</h3>
            <p style={{ color: '#475569', marginBottom: '24px', lineHeight: '1.5' }}>
              Bạn có chắc chắn muốn chuyển dự án sang giai đoạn <strong style={{ color: 'var(--primary)' }}>{steps.find(s => s.id === pendingStatus)?.label}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn" 
                style={{ background: '#f1f5f9', color: '#475569', border: 'none' }}
                onClick={() => setPendingStatus(null)}
                disabled={isUpdating}
              >
                Hủy bỏ
              </button>
              <button 
                className="btn btn-primary" 
                onClick={confirmUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? 'Đang cập nhật...' : 'Đồng Ý'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
