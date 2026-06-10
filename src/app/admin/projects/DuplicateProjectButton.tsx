'use client';

import { useState } from 'react';
import { Copy, Loader2 } from 'lucide-react';
import { duplicateProject } from '@/app/actions/project';
import { useRouter } from 'next/navigation';

export default function DuplicateProjectButton({ projectId, projectName }: { projectId: number, projectName: string }) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleDuplicate = async () => {
    if (!confirm(`Bạn có chắc chắn muốn sao chép dự án "${projectName}"?`)) {
      return;
    }
    
    setIsPending(true);

    try {
      const res = await duplicateProject(projectId);
      if (res.error) {
        alert(res.error);
      } else if (res.newProjectId) {
        // Redirect directly to the newly duplicated project detail page
        router.push(`/admin/projects/${res.newProjectId}`);
      }
    } catch (err) {
      alert('Có lỗi xảy ra khi sao chép dự án.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button 
      className="btn btn-action" 
      onClick={handleDuplicate}
      disabled={isPending}
      type="button"
      style={{ 
        background: 'rgba(59,130,246,0.1)', 
        color: '#3b82f6',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 12px'
      }}
      title="Sao chép dự án"
    >
      {isPending ? (
        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
      ) : (
        <Copy size={16} />
      )}
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </button>
  );
}
