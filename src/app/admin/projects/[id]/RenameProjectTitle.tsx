'use client';

import { useState } from 'react';
import { Edit2 } from 'lucide-react';
import RenameProjectModal from '../RenameProjectModal';

interface Props {
  projectId: number;
  initialName: string;
}

export default function RenameProjectTitle({ projectId, initialName }: Props) {
  const [name, setName] = useState(initialName);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ color: 'var(--primary)', marginLeft: '12px' }}>{name}</span>
      <button 
        onClick={() => setIsModalOpen(true)}
        type="button"
        style={{ 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer', 
          color: 'var(--text-muted)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          borderRadius: '4px',
          transition: 'background 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
        title="Đổi tên dự án"
      >
        <Edit2 size={16} />
      </button>

      <RenameProjectModal 
        projectId={projectId} 
        initialName={name} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newName) => setName(newName)}
      />
    </div>
  );
}
