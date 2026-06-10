'use client';

import { useState } from 'react';
import { Edit2 } from 'lucide-react';
import RenameProjectModal from './RenameProjectModal';

export default function ProjectNameCell({ projectId, initialName }: { projectId: number, initialName: string }) {
  const [name, setName] = useState(initialName);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <strong style={{ color: 'var(--accent)' }}>{name}</strong>
      <button 
        onClick={() => setIsModalOpen(true)}
        type="button"
        style={{ 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer', 
          color: 'var(--text-muted)',
          padding: '4px',
          borderRadius: '4px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
        title="Đổi tên dự án"
      >
        <Edit2 size={14} />
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
