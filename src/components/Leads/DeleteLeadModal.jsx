import React, { useState } from 'react';
import { useLeads } from '../../context/LeadContext';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

export const DeleteLeadModal = () => {
  const { isDeleteModalOpen, leadToDelete, closeDeleteModal, deleteLead } = useLeads();
  const [isDeleting, setIsDeleting] = useState(false);
  const [serverError, setServerError] = useState('');

  if (!isDeleteModalOpen || !leadToDelete) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setServerError('');
    try {
      await deleteLead(leadToDelete._id);
    } catch (err) {
      setServerError(err.message || 'Failed to delete lead');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-backdrop active" onClick={closeDeleteModal}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', width: '92%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <h3 className="modal-title" style={{ margin: 0, fontSize: '1.15rem' }}>
              Delete Lead
            </h3>
          </div>
          <button type="button" className="btn-icon" onClick={closeDeleteModal} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {serverError && (
          <div className="alert alert-danger" style={{ margin: '16px 20px 0' }}>
            {serverError}
          </div>
        )}

        <div className="modal-body" style={{ padding: '20px' }}>
          <p style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Are you sure you want to delete lead record for <strong>"{leadToDelete.name}"</strong>
            {leadToDelete.company ? ` from ${leadToDelete.company}` : ''}?
          </p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            This action cannot be undone and will permanently remove this prospective client record.
          </p>
        </div>

        <div
          className="modal-footer"
          style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}
        >
          <button type="button" className="btn btn-secondary" onClick={closeDeleteModal} disabled={isDeleting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={isDeleting}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '100px' }}
          >
            {isDeleting ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div className="spinner-sm" />
                <span>Deleting...</span>
              </div>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Delete Lead</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
