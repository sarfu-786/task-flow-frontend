import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  TrendingUp,
  AlertCircle,
  FolderKanban,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  Building,
  Mail,
  Phone,
  Shield,
  Layers,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useOpportunities } from '../../context/OpportunityContext';
import { useComplaints } from '../../context/ComplaintContext';
import { useProjects } from '../../context/ProjectContext';

export const CRMDrilldownModal = ({
  isOpen,
  onClose,
  type = 'leads', // 'leads' | 'opportunities' | 'complaints' | 'projects'
  items = [],
  title = 'Module Overview',
  onItemClick,
}) => {
  const { openCreateModal: openCreateLeadModal } = useLeads();
  const { openCreateModal: openCreateOpportunityModal } = useOpportunities();
  const { openCreateModal: openCreateComplaintModal } = useComplaints();
  const { openCreateModal: openCreateProjectModal } = useProjects();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setStatusFilter('all');
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const safeItems = Array.isArray(items) ? items : [];

  // Filter items based on search and status
  const filteredItems = safeItems.filter((item) => {
    if (!item) return false;
    const q = search.trim().toLowerCase();

    // Match Search
    let matchesSearch = true;
    if (q) {
      if (type === 'leads') {
        matchesSearch =
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.company && item.company.toLowerCase().includes(q)) ||
          (item.email && item.email.toLowerCase().includes(q)) ||
          (item.phone && item.phone.toLowerCase().includes(q));
      } else if (type === 'opportunities') {
        matchesSearch =
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.accountName && item.accountName.toLowerCase().includes(q)) ||
          (item.leadName && item.leadName.toLowerCase().includes(q));
      } else if (type === 'complaints') {
        matchesSearch =
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.ticketNumber && item.ticketNumber.toLowerCase().includes(q)) ||
          (item.customerName && item.customerName.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q));
      } else if (type === 'projects') {
        matchesSearch =
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.client && item.client.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q));
      }
    }

    // Match Status
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = item.status === statusFilter || item.stage === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  const getThemeColor = () => {
    switch (type) {
      case 'leads':
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: Target };
      case 'opportunities':
        return { bg: '#fef3c7', color: '#b45309', border: '#fde68a', icon: TrendingUp };
      case 'complaints':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', icon: AlertCircle };
      case 'projects':
        return { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe', icon: FolderKanban };
      default:
        return { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1', icon: Layers };
    }
  };

  const theme = getThemeColor();
  const IconComponent = theme.icon;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: theme.bg,
                color: theme.color,
                border: `1px solid ${theme.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconComponent size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {title}
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: theme.bg,
                    color: theme.color,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  {filteredItems.length} {type}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Interactive pop-up overview & record details
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              color: '#64748b',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div
          style={{
            padding: '12px 24px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              className="form-control"
              placeholder={`Search ${type} by name, company, or keyword...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '34px', fontSize: '0.85rem', height: '36px', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '0.85rem', height: '36px', minWidth: '140px' }}
            >
              <option value="all">All Statuses</option>
              {type === 'leads' && (
                <>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
                </>
              )}
              {type === 'opportunities' && (
                <>
                  <option value="Prospecting">Prospecting</option>
                  <option value="Qualification">Qualification</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Closed Won">Closed Won</option>
                  <option value="Closed Lost">Closed Lost</option>
                </>
              )}
              {type === 'complaints' && (
                <>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </>
              )}
              {type === 'projects' && (
                <>
                  <option value="Active">Active</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Planning">Planning</option>
                  <option value="On Hold">On Hold</option>
                </>
              )}
            </select>

            {type === 'leads' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  openCreateLeadModal();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  fontSize: '0.825rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Plus size={14} />
                <span>Add Lead</span>
              </button>
            )}

            {type === 'opportunities' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  openCreateOpportunityModal();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  fontSize: '0.825rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  borderColor: '#059669',
                }}
              >
                <Plus size={14} />
                <span>Add Deal</span>
              </button>
            )}

            {type === 'complaints' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  openCreateComplaintModal();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  fontSize: '0.825rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                  borderColor: '#dc2626',
                }}
              >
                <Plus size={14} />
                <span>Add Complaint</span>
              </button>
            )}

            {type === 'projects' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  openCreateProjectModal();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  fontSize: '0.825rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                  borderColor: '#7c3aed',
                }}
              >
                <Plus size={14} />
                <span>Add Project</span>
              </button>
            )}
          </div>
        </div>

        {/* List Content Body */}
        <div
          style={{
            padding: '16px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
              <IconComponent size={40} style={{ margin: '0 auto 10px', opacity: 0.35, color: theme.color }} />
              <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--text-primary)' }}>
                No records found in this category
              </h4>
              <p style={{ margin: 0, fontSize: '0.84rem' }}>
                {search ? 'Try adjusting your search criteria.' : `You currently have 0 ${type} recorded.`}
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const itemId = item._id || item.id || `item-${idx}`;

              return (
                <div
                  key={itemId}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Row 1: Header & Status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '0.94rem',
                          color: '#0f172a',
                        }}
                      >
                        {type === 'leads' && (item.name || 'Unnamed Lead')}
                        {type === 'opportunities' && (item.title || item.name || 'Opportunity')}
                        {type === 'complaints' && (item.title || `Ticket #${item.ticketNumber || idx + 1}`)}
                        {type === 'projects' && (item.name || 'Project Name')}
                      </span>

                      {/* Sub-label/Company */}
                      {(item.company || item.client || item.accountName) && (
                        <span
                          style={{
                            fontSize: '0.78rem',
                            color: '#64748b',
                            background: '#f1f5f9',
                            padding: '2px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          {item.company || item.client || item.accountName}
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        background:
                          item.status === 'Won' || item.status === 'Closed Won' || item.status === 'Resolved' || item.status === 'Completed'
                            ? '#ecfdf5'
                            : item.status === 'In Progress' || item.status === 'Negotiation' || item.status === 'Proposal'
                            ? '#fffbeb'
                            : item.status === 'Lost' || item.status === 'Closed Lost'
                            ? '#fef2f2'
                            : '#eff6ff',
                        color:
                          item.status === 'Won' || item.status === 'Closed Won' || item.status === 'Resolved' || item.status === 'Completed'
                            ? '#047857'
                            : item.status === 'In Progress' || item.status === 'Negotiation' || item.status === 'Proposal'
                            ? '#b45309'
                            : item.status === 'Lost' || item.status === 'Closed Lost'
                            ? '#dc2626'
                            : '#1d4ed8',
                        border: `1px solid ${
                          item.status === 'Won' || item.status === 'Closed Won' || item.status === 'Resolved' || item.status === 'Completed'
                            ? '#a7f3d0'
                            : item.status === 'In Progress' || item.status === 'Negotiation' || item.status === 'Proposal'
                            ? '#fde68a'
                            : item.status === 'Lost' || item.status === 'Closed Lost'
                            ? '#fecaca'
                            : '#bfdbfe'
                        }`,
                      }}
                    >
                      {item.status || item.stage || 'Active'}
                    </span>
                  </div>

                  {/* Row 2: Details & Metadata */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '14px',
                      fontSize: '0.8rem',
                      color: '#64748b',
                    }}
                  >
                    {item.email && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={13} /> {item.email}
                      </span>
                    )}

                    {item.phone && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={13} /> {item.phone}
                      </span>
                    )}

                    {(item.value || item.amount || item.budget) && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#059669' }}>
                        <DollarSign size={13} /> ${Number(item.value || item.amount || item.budget || 0).toLocaleString()}
                      </span>
                    )}

                    {item.probability !== undefined && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2563eb', fontWeight: 600 }}>
                        Win Rate: {item.probability}%
                      </span>
                    )}

                    {item.progress !== undefined && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span>Progress: {item.progress}%</span>
                        <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${item.progress}%`, height: '100%', background: '#10b981' }} />
                        </div>
                      </div>
                    )}

                    {item.priority && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Priority: <strong style={{ color: item.priority === 'High' ? '#dc2626' : '#475569' }}>{item.priority}</strong>
                      </span>
                    )}

                    {item.assignedTo && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Assigned: <strong>{typeof item.assignedTo === 'object' ? item.assignedTo.name : item.assignedTo}</strong>
                      </span>
                    )}
                  </div>

                  {/* Description / Summary if present */}
                  {item.description && (
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid #f1f5f9',
            background: '#ffffff',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
          >
            Close Pop-up
          </button>
        </div>
      </div>
    </div>
  );
};

export default CRMDrilldownModal;
