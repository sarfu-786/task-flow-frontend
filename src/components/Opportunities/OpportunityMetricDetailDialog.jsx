import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Search,
  X,
  Plus,
  Edit2,
  Trash2,
  Building,
  User as UserIcon,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Percent,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { useOpportunities, STAGES } from '../../context/OpportunityContext';
import { useAuth } from '../../context/AuthContext';

export const OpportunityMetricDetailDialog = ({
  open,
  onClose,
  metricType = 'pipeline', // 'pipeline' | 'won' | 'win_rate' | 'negotiation'
  onEditOpportunity,
  onDeleteOpportunity,
  onCreateOpportunity,
}) => {
  const {
    opportunities,
    stats,
    updateOpportunityStage,
    openCreateModal,
    openEditModal,
    openDeleteModal,
  } = useOpportunities();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [page, setPage] = useState(0);
  const rowsPerPage = 6;

  // Sync initial stage filter whenever dialog opens or metricType changes
  useEffect(() => {
    if (!open) return;
    setSearchTerm('');
    setPriorityFilter('all');
    setPage(0);

    if (metricType === 'won') {
      setStageFilter('Won');
    } else if (metricType === 'negotiation') {
      setStageFilter('Negotiation');
    } else {
      setStageFilter('all');
    }
  }, [open, metricType]);

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (open) {
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
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Dialog configuration based on metricType
  const config = useMemo(() => {
    switch (metricType) {
      case 'won':
        return {
          title: 'Won Revenue & Closed Deals',
          subtitle: 'Successfully closed client contracts, enterprise licenses, and realized revenue.',
          icon: CheckCircle2,
          primaryColor: '#059669',
          bgLight: '#ecfdf5',
          borderColor: '#a7f3d0',
          badgeText: 'Closed Won Deals',
          emptyMessage: 'No closed-won opportunities found matching your criteria.',
        };
      case 'win_rate':
        return {
          title: 'Win Rate Ratio & Performance Analysis',
          subtitle: 'Detailed breakdown of won versus lost deal engagements and conversion metrics.',
          icon: DollarSign,
          primaryColor: '#7c3aed',
          bgLight: '#f5f3ff',
          borderColor: '#ddd6fe',
          badgeText: 'Conversion Analysis',
          emptyMessage: 'No opportunity records available for win rate analysis.',
        };
      case 'negotiation':
        return {
          title: 'In Negotiation Pipeline',
          subtitle: 'High-probability opportunities undergoing final commercial review and contract alignment.',
          icon: TrendingUp,
          primaryColor: '#d97706',
          bgLight: '#fffbeb',
          borderColor: '#fde68a',
          badgeText: 'In Negotiation',
          emptyMessage: 'No opportunities currently in the negotiation stage.',
        };
      case 'pipeline':
      default:
        return {
          title: 'Pipeline Value & Deal Directory',
          subtitle: 'Complete directory of all registered enterprise opportunities and active sales stages.',
          icon: Layers,
          primaryColor: '#2563eb',
          bgLight: '#eff6ff',
          borderColor: '#bfdbfe',
          badgeText: 'Active Pipeline',
          emptyMessage: 'No opportunities found matching your filter criteria.',
        };
    }
  }, [metricType]);

  // Filter opportunities
  const filteredDeals = useMemo(() => {
    return (opportunities || []).filter((opp) => {
      // 1. Metric Type base filter
      if (metricType === 'won' && stageFilter === 'all') {
        if (opp.stage !== 'Won') return false;
      } else if (metricType === 'negotiation' && stageFilter === 'all') {
        if (opp.stage !== 'Negotiation') return false;
      }

      // 2. Stage Filter
      if (stageFilter !== 'all' && opp.stage !== stageFilter) {
        return false;
      }

      // 3. Priority Filter
      if (priorityFilter !== 'all' && opp.priority !== priorityFilter) {
        return false;
      }

      // 4. Search Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const name = (opp.name || '').toLowerCase();
        const company = (opp.company || '').toLowerCase();
        const leadName = (opp.relatedLeadName || '').toLowerCase();
        const assignedTo = (opp.assignedTo || '').toLowerCase();
        const notes = (opp.notes || '').toLowerCase();

        return (
          name.includes(q) ||
          company.includes(q) ||
          leadName.includes(q) ||
          assignedTo.includes(q) ||
          notes.includes(q)
        );
      }

      return true;
    });
  }, [opportunities, metricType, stageFilter, priorityFilter, searchTerm]);

  // KPI Calculations for current filter
  const filterKpis = useMemo(() => {
    const totalCount = filteredDeals.length;
    const totalValue = filteredDeals.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const avgProb =
      totalCount > 0
        ? Math.round(filteredDeals.reduce((sum, o) => sum + (Number(o.probability) || 0), 0) / totalCount)
        : 0;
    const wonCount = filteredDeals.filter((o) => o.stage === 'Won').length;
    const wonVal = filteredDeals
      .filter((o) => o.stage === 'Won')
      .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

    return { totalCount, totalValue, avgProb, wonCount, wonVal };
  }, [filteredDeals]);

  const totalPages = Math.ceil(filteredDeals.length / rowsPerPage) || 1;
  const paginatedDeals = filteredDeals.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  if (!open) return null;

  const IconComponent = config.icon;

  const formatAmount = (num) => {
    if (!num && num !== 0) return '₹0';
    return `₹${Number(num).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getStageBadge = (opp) => {
    const stage = opp.stage || 'Qualification';
    const stageConfig = {
      Qualification: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#2563eb' },
      Proposal: { bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe', dot: '#6366f1' },
      Negotiation: { bg: '#fffbeb', color: '#b45309', border: '#fde68a', dot: '#d97706' },
      Won: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', dot: '#059669' },
      Lost: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', dot: '#dc2626' },
    };

    const nextStageMap = {
      Qualification: 'Proposal',
      Proposal: 'Negotiation',
      Negotiation: 'Won',
      Won: 'Qualification',
      Lost: 'Qualification',
    };

    const c = stageConfig[stage] || stageConfig.Qualification;

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          updateOpportunityStage(opp._id, nextStageMap[stage] || 'Qualification');
        }}
        title={`Current Stage: ${stage}. Click to advance.`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '0.74rem',
          fontWeight: 700,
          background: c.bg,
          color: c.color,
          border: `1px solid ${c.border}`,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: c.dot,
          }}
        />
        <span>{stage}</span>
      </button>
    );
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#dc2626',
              background: '#fef2f2',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid #fee2e2',
            }}
          >
            High
          </span>
        );
      case 'Medium':
        return (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#d97706',
              background: '#fffbeb',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid #fef3c7',
            }}
          >
            Medium
          </span>
        );
      case 'Low':
      default:
        return (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#475569',
              background: '#f1f5f9',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
            }}
          >
            Low
          </span>
        );
    }
  };

  const getProbabilityColor = (prob) => {
    if (prob >= 75) return '#059669';
    if (prob >= 40) return '#d97706';
    return '#2563eb';
  };

  const handleEdit = (opp) => {
    onClose();
    if (onEditOpportunity) {
      onEditOpportunity(opp);
    } else {
      openEditModal(opp);
    }
  };

  const handleDelete = (opp) => {
    onClose();
    if (onDeleteOpportunity) {
      onDeleteOpportunity(opp);
    } else {
      openDeleteModal(opp);
    }
  };

  const handleCreate = () => {
    onClose();
    if (onCreateOpportunity) {
      onCreateOpportunity();
    } else {
      openCreateModal();
    }
  };

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
        zIndex: 9999,
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
          borderRadius: '24px',
          width: '100%',
          maxWidth: '1120px',
          height: '92vh',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Dialog Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #ffffff, #f8fafc)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: config.bgLight,
                color: config.primaryColor,
                border: `1.5px solid ${config.borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${config.primaryColor}20`,
                flexShrink: 0,
              }}
            >
              <IconComponent size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                  {config.title}
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    backgroundColor: config.bgLight,
                    color: config.primaryColor,
                    border: `1px solid ${config.borderColor}`,
                    fontSize: '0.74rem',
                    fontWeight: 700,
                  }}
                >
                  {config.badgeText}
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                {config.subtitle}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleCreate}
              className="btn btn-primary"
              style={{
                backgroundColor: '#059669',
                borderColor: '#059669',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '0.84rem',
                borderRadius: '999px',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
              }}
            >
              <Plus size={16} />
              <span>Add Deal</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Close modal (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* KPI Mini Metric Summary Ribbon */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            padding: '16px 28px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Filtered Deals
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {filterKpis.totalCount}
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Pipeline Value
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
              {formatAmount(filterKpis.totalValue)}
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Avg Probability
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
              {filterKpis.avgProb}%
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Won Revenue
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
              {formatAmount(filterKpis.wonVal)}
            </div>
          </div>
        </div>

        {/* Controls: Search, Stage Tabs & Priority Filter */}
        <div
          style={{
            padding: '14px 28px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            backgroundColor: '#ffffff',
            flexShrink: 0,
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 260px', maxWidth: '400px' }}>
            <Search
              size={16}
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
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              placeholder="Search by deal, company, lead, or assignee..."
              style={{
                width: '100%',
                padding: '8px 34px 8px 36px',
                borderRadius: '999px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Stage Tabs & Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Stage Pills */}
            <div
              style={{
                display: 'inline-flex',
                background: '#f1f5f9',
                padding: '3px',
                borderRadius: '999px',
                gap: '2px',
                overflowX: 'auto',
                maxWidth: '100%',
              }}
            >
              {['all', ...STAGES].map((stg) => {
                const isActive = stageFilter === stg;
                const count =
                  stg === 'all'
                    ? (opportunities || []).length
                    : (opportunities || []).filter((o) => o.stage === stg).length;
                return (
                  <button
                    key={stg}
                    type="button"
                    onClick={() => {
                      setStageFilter(stg);
                      setPage(0);
                    }}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '999px',
                      border: 'none',
                      fontSize: '0.74rem',
                      fontWeight: isActive ? 700 : 500,
                      backgroundColor: isActive ? '#ffffff' : 'transparent',
                      color: isActive ? '#0f172a' : '#64748b',
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>{stg === 'all' ? 'All Deals' : stg}</span>
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: '999px',
                        fontSize: '0.68rem',
                        backgroundColor: isActive ? '#f1f5f9' : '#e2e8f0',
                        color: '#475569',
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(0);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.78rem',
                color: '#334155',
                backgroundColor: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Main Deals Scrollable Table Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 16px 28px' }}>
          {filteredDeals.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  backgroundColor: config.bgLight,
                  color: config.primaryColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <IconComponent size={32} />
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                {config.emptyMessage}
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#64748b', maxWidth: '420px' }}>
                No opportunity records match your current filters. You can adjust the stage filter or click below to register a new deal.
              </p>
              <button
                type="button"
                onClick={handleCreate}
                className="btn btn-primary"
                style={{
                  backgroundColor: '#059669',
                  borderColor: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '999px',
                  padding: '8px 18px',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                }}
              >
                <Plus size={16} />
                <span>Create Opportunity Deal</span>
              </button>
            </div>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: '0 8px',
                marginTop: '8px',
              }}
            >
              <thead>
                <tr style={{ color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Opportunity Deal</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Deal Value</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Sales Stage</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Win Probability</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Priority</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Assigned To</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Target Close</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDeals.map((opp) => {
                  const prob = Number(opp.probability) || 0;
                  const probColor = getProbabilityColor(prob);
                  return (
                    <tr
                      key={opp._id}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                    >
                      {/* Deal & Company */}
                      <td style={{ padding: '12px 14px', borderRadius: '10px 0 0 10px', borderLeft: `3px solid ${probColor}` }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                          {opp.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                          {opp.company && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.74rem',
                                color: '#64748b',
                              }}
                            >
                              <Building size={12} />
                              <span>{opp.company}</span>
                            </span>
                          )}
                          {opp.relatedLeadName && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '0.7rem',
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              <Tag size={10} />
                              <span>Lead: {opp.relatedLeadName}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Deal Value */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#059669' }}>
                          {formatAmount(opp.amount)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Pipeline Asset</div>
                      </td>

                      {/* Stage Badge (interactive) */}
                      <td style={{ padding: '12px 14px' }}>
                        {getStageBadge(opp)}
                      </td>

                      {/* Probability Progress Bar */}
                      <td style={{ padding: '12px 14px', minWidth: '130px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: probColor }}>
                            {prob}%
                          </span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '999px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, Math.max(0, prob))}%`,
                              height: '100%',
                              backgroundColor: probColor,
                              borderRadius: '999px',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </td>

                      {/* Priority */}
                      <td style={{ padding: '12px 14px' }}>
                        {getPriorityBadge(opp.priority)}
                      </td>

                      {/* Assigned To */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                          >
                            {(opp.assignedTo || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                              {opp.assignedTo || 'Unassigned'}
                            </div>
                            {opp.assignedBy && (
                              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                                by {opp.assignedBy}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Expected Close Date */}
                      <td style={{ padding: '12px 14px', fontSize: '0.76rem', color: '#64748b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          <span>{formatDate(opp.expectedCloseDate)}</span>
                        </div>
                      </td>

                      {/* Action buttons (Sign only) */}
                      <td style={{ padding: '12px 14px', borderRadius: '0 10px 10px 0', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleEdit(opp)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#2563eb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            title="Edit Deal"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(opp)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: '1px solid #fee2e2',
                              backgroundColor: '#fff5f5',
                              color: '#dc2626',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            title="Delete Deal"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Dialog Footer & Pagination */}
        <div
          style={{
            padding: '14px 28px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Showing <strong>{paginatedDeals.length}</strong> of <strong>{filteredDeals.length}</strong> deal records
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: page === 0 ? '#94a3b8' : '#334155',
                  cursor: page === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                Page {page + 1} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: page >= totalPages - 1 ? '#94a3b8' : '#334155',
                  cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpportunityMetricDetailDialog;
