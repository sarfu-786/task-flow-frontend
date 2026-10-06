import React, { useState, useEffect } from 'react';
import { ComplaintTable } from './ComplaintTable';
import { ComplaintKanban } from './ComplaintKanban';
import { ComplaintCards } from './ComplaintCards';
import {
  AlertCircle,
  X,
  Table as TableIcon,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';

export const ComplaintDirectoryModal = ({
  isOpen,
  onClose,
  onView,
  onEdit,
  onResolve,
  onDelete,
  canDelete,
}) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban' | 'cards'
  const { fetchComplaints, loading, totalItems, stats } = useComplaints();

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
        zIndex: 1000,
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
          width: '90vw',
          maxWidth: '1360px',
          height: '80vh',
          maxHeight: '840px',
          minHeight: '520px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #ffffff, #f8fafc)',
            flexWrap: 'wrap',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                border: '1.5px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(37, 99, 235, 0.12)',
                flexShrink: 0,
              }}
            >
              <AlertCircle size={20} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Complaint & Ticket Directory
                </h2>
                <span
                  style={{
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {totalItems || stats.total || 0} Registered Tickets
                </span>
              </div>
              <p
                style={{
                  margin: '1px 0 0',
                  fontSize: '0.78rem',
                  color: '#64748b',
                  lineHeight: '1.3',
                }}
              >
                Comprehensive ticket registry, real-time SLA countdowns, multi-stage workflow & assignments
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* View Switcher Segmented Control */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#f1f5f9',
                padding: '2.5px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  backgroundColor: viewMode === 'table' ? '#ffffff' : 'transparent',
                  color: viewMode === 'table' ? '#2563eb' : '#64748b',
                  boxShadow: viewMode === 'table' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                }}
                id="btn-view-table"
              >
                <TableIcon size={14} />
                <span>Table</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  backgroundColor: viewMode === 'kanban' ? '#ffffff' : 'transparent',
                  color: viewMode === 'kanban' ? '#2563eb' : '#64748b',
                  boxShadow: viewMode === 'kanban' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                }}
                id="btn-view-kanban"
              >
                <LayoutGrid size={14} />
                <span>Kanban</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('cards')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  backgroundColor: viewMode === 'cards' ? '#ffffff' : 'transparent',
                  color: viewMode === 'cards' ? '#2563eb' : '#64748b',
                  boxShadow: viewMode === 'cards' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                }}
                id="btn-view-cards"
              >
                <Sparkles size={14} />
                <span>Cards</span>
              </button>
            </div>



            {/* Separator */}
            <div style={{ width: '1px', height: '22px', backgroundColor: '#e2e8f0', margin: '0 2px' }} />

            {/* Dedicated Top-Right Cut/Close Button */}
            <button
              type="button"
              onClick={onClose}
              id="btn-close-complaint-dir-modal"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
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
              aria-label="Close Directory Modal"
              title="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: viewMode === 'table' ? 'hidden' : 'auto',
            overflowX: 'hidden',
            padding: '14px 18px',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {viewMode === 'table' && (
            <ComplaintTable
              onView={onView}
              onEdit={onEdit}
              onResolve={onResolve}
              onDelete={onDelete}
              canDelete={canDelete}
            />
          )}

          {viewMode === 'kanban' && (
            <ComplaintKanban
              onView={onView}
              onEdit={onEdit}
              onResolve={onResolve}
              onDelete={onDelete}
              canDelete={canDelete}
            />
          )}

          {viewMode === 'cards' && (
            <ComplaintCards
              onView={onView}
              onEdit={onEdit}
              onResolve={onResolve}
              onDelete={onDelete}
              canDelete={canDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintDirectoryModal;
