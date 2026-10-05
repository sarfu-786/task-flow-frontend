import React, { useState, useEffect } from 'react';
import { ProjectTable } from './ProjectTable';
import { ProjectKanbanBoard } from './ProjectKanbanBoard';
import { ProjectGanttView } from './ProjectGanttView';
import { ProjectResourceWorkload } from './ProjectResourceWorkload';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import {
  FolderKanban,
  X,
  Table as TableIcon,
  Kanban,
  Calendar,
  Users,
  Sparkles,
  Upload,
  Download,
} from 'lucide-react';

export const ProjectDirectoryModal = ({
  isOpen,
  onClose,
  onViewProject,
  onEditProject,
  onOpenMilestones,
  onDeleteProject,
  canDelete = false,
  onOpenTaskModal,
  onOpenImport,
  onOpenExport,
}) => {
  const { openImportModal, openExportModal, setIsImportModalOpen, setIsExportModalOpen } = useProjects();
  const { isSuperAdmin, isManager } = useAuth();
  const [activeView, setActiveView] = useState('table'); // 'table' | 'kanban' | 'gantt' | 'workload'

  // Lock body scroll and handle ESC key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '1240px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #ffffff, #f8fafc)',
            flexShrink: 0,
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#eef2ff',
                color: '#4f46e5',
                border: '1.5px solid #c7d2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.12)',
                flexShrink: 0,
              }}
            >
              <FolderKanban size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Project Directory
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    backgroundColor: '#eef2ff',
                    color: '#4f46e5',
                    border: '1px solid #c7d2fe',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  <Sparkles size={11} />
                  <span>Authorized Deliverables</span>
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                Comprehensive project repository, milestone tracking, timeline scheduling, and team assignments.
              </p>
            </div>
          </div>

          {/* Top-Right Action Controls: Import, Export, View Switcher + Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Import & Export Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                id="btn-dir-modal-import"
                onClick={() => {
                  if (onOpenImport) onOpenImport();
                  else if (openImportModal) openImportModal();
                  else setIsImportModalOpen(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 13px',
                  borderRadius: '9px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  border: '1.5px solid #cbd5e1',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                title="Import projects from Excel spreadsheet"
              >
                <Upload size={13} color="#4f46e5" />
                <span>Import</span>
              </button>

              <button
                type="button"
                id="btn-dir-modal-export"
                onClick={() => {
                  if (onOpenExport) onOpenExport();
                  else if (openExportModal) openExportModal();
                  else setIsExportModalOpen(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 13px',
                  borderRadius: '9px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  border: '1.5px solid #cbd5e1',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                title="Export projects to Excel / CSV / JSON"
              >
                <Download size={13} color="#059669" />
                <span>Export</span>
              </button>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '22px', backgroundColor: '#e2e8f0', margin: '0 2px' }} />

            {/* View Mode Toggle Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#f1f5f9',
                padding: '3px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <button
                type="button"
                id="btn-dir-modal-table"
                onClick={() => setActiveView('table')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  fontSize: '0.8rem',
                  fontWeight: activeView === 'table' ? 800 : 600,
                  color: activeView === 'table' ? '#4f46e5' : '#64748b',
                  backgroundColor: activeView === 'table' ? '#ffffff' : 'transparent',
                  border: 'none',
                  boxShadow: activeView === 'table' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <TableIcon size={14} />
                <span>Table</span>
              </button>

              <button
                type="button"
                id="btn-dir-modal-kanban"
                onClick={() => setActiveView('kanban')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  fontSize: '0.8rem',
                  fontWeight: activeView === 'kanban' ? 800 : 600,
                  color: activeView === 'kanban' ? '#4f46e5' : '#64748b',
                  backgroundColor: activeView === 'kanban' ? '#ffffff' : 'transparent',
                  border: 'none',
                  boxShadow: activeView === 'kanban' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Kanban size={14} />
                <span>Kanban</span>
              </button>

              <button
                type="button"
                id="btn-dir-modal-gantt"
                onClick={() => setActiveView('gantt')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  fontSize: '0.8rem',
                  fontWeight: activeView === 'gantt' ? 800 : 600,
                  color: activeView === 'gantt' ? '#4f46e5' : '#64748b',
                  backgroundColor: activeView === 'gantt' ? '#ffffff' : 'transparent',
                  border: 'none',
                  boxShadow: activeView === 'gantt' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Calendar size={14} />
                <span>Gantt</span>
              </button>

              <button
                type="button"
                id="btn-dir-modal-workload"
                onClick={() => setActiveView('workload')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  fontSize: '0.8rem',
                  fontWeight: activeView === 'workload' ? 800 : 600,
                  color: activeView === 'workload' ? '#4f46e5' : '#64748b',
                  backgroundColor: activeView === 'workload' ? '#ffffff' : 'transparent',
                  border: 'none',
                  boxShadow: activeView === 'workload' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Users size={14} />
                <span>Workload</span>
              </button>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0', margin: '0 2px' }} />

            {/* Dedicated Top-Right Cut/Close Button */}
            <button
              type="button"
              onClick={onClose}
              id="btn-close-project-dir-modal"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fee2e2';
                e.currentTarget.style.color = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.color = '#64748b';
              }}
              aria-label="Close modal"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '24px 28px',
            backgroundColor: '#f8fafc',
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
          }}
        >
          {activeView === 'table' && (
            <ProjectTable
              onViewProject={(p) => {
                onClose();
                if (onViewProject) onViewProject(p);
              }}
              onEditProject={(p) => {
                onClose();
                if (onEditProject) onEditProject(p);
              }}
              onOpenMilestones={(p) => {
                onClose();
                if (onOpenMilestones) onOpenMilestones(p);
              }}
              onDeleteProject={(p) => {
                onClose();
                if (onDeleteProject) onDeleteProject(p);
              }}
              canDelete={canDelete}
            />
          )}

          {activeView === 'kanban' && (
            <ProjectKanbanBoard
              onViewProject={(p) => {
                onClose();
                if (onViewProject) onViewProject(p);
              }}
              onOpenTaskModal={(p) => {
                onClose();
                if (onOpenTaskModal) onOpenTaskModal(p);
              }}
            />
          )}

          {activeView === 'gantt' && (
            <ProjectGanttView
              onViewProject={(p) => {
                onClose();
                if (onViewProject) onViewProject(p);
              }}
              onOpenTaskModal={(p) => {
                onClose();
                if (onOpenTaskModal) onOpenTaskModal(p);
              }}
            />
          )}

          {activeView === 'workload' && (
            <ProjectResourceWorkload
              onViewProject={(p) => {
                onClose();
                if (onViewProject) onViewProject(p);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDirectoryModal;
