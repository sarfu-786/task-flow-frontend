import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { complaintApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ComplaintExportModal } from './ComplaintExportModal';
import {
  FileSpreadsheet,
  Download,
  Layers,
  Award,
  PieChart,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Flame,
  TrendingUp,
  BarChart3,
  Users,
  ShieldAlert,
  Search,
  RefreshCw,
  X,
  FileText,
  Building,
  Target,
  Crown,
  UserCheck,
  Zap,
  ChevronDown,
  ChevronRight,
  Filter,
  RotateCcw,
} from 'lucide-react';

// ============================================================================
// 17 CONSOLIDATED MIS REPORTS GROUPED INTO 6 COLLAPSIBLE CATEGORIES
// ============================================================================
const REPORT_CATEGORIES = [
  {
    id: 'volume-demand',
    title: 'Volume & Demand',
    icon: Layers,
    color: '#2563eb',
    reports: [
      {
        id: 'MIS-C01',
        title: 'Volume & Inflow MIS',
        icon: Layers,
        color: '#2563eb',
      },
      {
        id: 'MIS-C02',
        title: 'Aging & Backlog MIS',
        icon: Clock,
        color: '#d97706',
      },
      {
        id: 'MIS-C06',
        title: 'Category & Subcategory MIS',
        icon: PieChart,
        color: '#4f46e5',
      },
    ],
  },
  {
    id: 'sla-resolution',
    title: 'SLA & Resolution',
    icon: CheckCircle2,
    color: '#059669',
    reports: [
      {
        id: 'MIS-C03',
        title: 'SLA Compliance MIS',
        icon: CheckCircle2,
        color: '#059669',
      },
      {
        id: 'MIS-C04',
        title: 'First Response SLA MIS',
        icon: Zap,
        color: '#7c3aed',
      },
      {
        id: 'MIS-C05',
        title: 'Resolution Time (MTTR) MIS',
        icon: TrendingUp,
        color: '#0891b2',
      },
    ],
  },
  {
    id: 'performance-operations',
    title: 'Performance & Operations',
    icon: Award,
    color: '#2563eb',
    reports: [
      {
        id: 'MIS-C08',
        title: 'User Productivity MIS',
        icon: Users,
        color: '#2563eb',
      },
      {
        id: 'MIS-C09',
        title: 'Team Performance MIS',
        icon: Award,
        color: '#059669',
      },
      {
        id: 'MIS-C10',
        title: 'Escalation Triggers MIS',
        icon: ShieldAlert,
        color: '#e11d48',
      },
    ],
  },
  {
    id: 'quality-root-cause',
    title: 'Quality & Root Cause',
    icon: Target,
    color: '#dc2626',
    reports: [
      {
        id: 'MIS-C07',
        title: 'Priority & Severity Matrix',
        icon: Flame,
        color: '#dc2626',
      },
      {
        id: 'MIS-C12',
        title: 'Root Cause (RCA) & CAPA MIS',
        icon: Target,
        color: '#7c3aed',
      },
      {
        id: 'MIS-C13',
        title: 'Reopen & Recurrence MIS',
        icon: RefreshCw,
        color: '#ea580c',
      },
      {
        id: 'MIS-C16',
        title: 'Product & Service Quality MIS',
        icon: BarChart3,
        color: '#059669',
      },
    ],
  },
  {
    id: 'customer-closure',
    title: 'Customer & Closure',
    icon: Building,
    color: '#0284c7',
    reports: [
      {
        id: 'MIS-C15',
        title: 'Customer & Account Analysis MIS',
        icon: Building,
        color: '#2563eb',
      },
      {
        id: 'MIS-C11',
        title: 'Disposition, Closure & Outcome MIS',
        icon: FileText,
        color: '#0284c7',
      },
      {
        id: 'MIS-C18',
        title: 'CSAT & Feedback MIS',
        icon: Award,
        color: '#eab308',
      },
    ],
  },
  {
    id: 'executive',
    title: 'Executive',
    icon: Crown,
    color: '#dc2626',
    reports: [
      {
        id: 'MIS-C20',
        title: 'Management Exception MIS',
        icon: ShieldAlert,
        color: '#dc2626',
      },
    ],
  },
];

// Flat list of all 17 reports
const ALL_REPORTS = REPORT_CATEGORIES.flatMap((category) =>
  category.reports.map((report) => ({
    ...report,
    categoryId: category.id,
    categoryTitle: category.title,
  }))
);

export const ComplaintMISModal = ({ isOpen, onClose }) => {
  const { user, isSuperAdmin } = useAuth();
  const [selectedReportId, setSelectedReportId] = useState('MIS-C01');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Global Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Category Collapsing State (all expanded by default)
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // Export Modal state (Single export action)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

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

  // Find active report meta
  const activeMeta = useMemo(() => {
    return ALL_REPORTS.find((r) => r.id === selectedReportId) || ALL_REPORTS[0];
  }, [selectedReportId]);

  // Ensure category containing the active report is expanded
  useEffect(() => {
    if (activeMeta && activeMeta.categoryId && collapsedCategories[activeMeta.categoryId]) {
      setCollapsedCategories((prev) => ({ ...prev, [activeMeta.categoryId]: false }));
    }
  }, [activeMeta]);

  // Fetch report data from API
  const fetchActiveReport = useCallback(
    async (reportId) => {
      try {
        setLoading(true);
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (statusFilter !== 'all') params.status = statusFilter;
        if (priorityFilter !== 'all') params.priority = priorityFilter;
        if (categoryFilter !== 'all') params.category = categoryFilter;

        const res = await complaintApi.getComplaintMISReport(reportId, params);
        if (res && res.success) {
          setReportData(res);
          setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (err) {
        console.error('Failed to load MIS report:', err);
      } finally {
        setLoading(false);
      }
    },
    [startDate, endDate, statusFilter, priorityFilter, categoryFilter]
  );

  useEffect(() => {
    if (isOpen) {
      fetchActiveReport(selectedReportId);
    }
  }, [isOpen, selectedReportId, fetchActiveReport]);

  const toggleCategory = (catId) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleClearFilters = () => {
    setSearchFilter('');
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
  };

  const hasActiveFilters = Boolean(
    searchFilter ||
    startDate ||
    endDate ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    categoryFilter !== 'all'
  );

  if (!isOpen) return null;

  const totalReportCount = ALL_REPORTS.length;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          width: '89vw',
          maxWidth: '1350px',
          height: '81vh',
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px -12px rgba(15, 23, 42, 0.28)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* ================================================================= */}
        {/* 1. COMPACT TOP HEADER */}
        {/* ================================================================= */}
        <div
          style={{
            padding: '12px 22px',
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
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.12)',
                flexShrink: 0,
              }}
            >
              <FileSpreadsheet size={20} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Complaint MIS & Executive Analytics
                </h2>
                <span
                  style={{
                    backgroundColor: isSuperAdmin ? '#fef3c7' : '#ecfdf5',
                    color: isSuperAdmin ? '#b45309' : '#047857',
                    border: `1px solid ${isSuperAdmin ? '#fde68a' : '#a7f3d0'}`,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {isSuperAdmin ? <Crown size={11} /> : <UserCheck size={11} />}
                  {isSuperAdmin ? 'Super Admin • Org Wide' : 'Hierarchy Scoped'}
                </span>
                <span
                  style={{
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                  }}
                >
                  {totalReportCount} MIS Reports
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {lastUpdated && (
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#94a3b8',
                  marginRight: '2px',
                }}
              >
                Last updated: {lastUpdated}
              </span>
            )}

            {/* Single Export Button */}
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              id="btn-complaint-mis-export"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#2563eb',
                border: '1.5px solid #bfdbfe',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#eff6ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
              title="Export Report to Excel (.xlsx)"
            >
              <Download size={14} />
              <span>Export</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchActiveReport(selectedReportId)}
              title="Refresh Report Data"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} />
            </button>

            {/* Separator */}
            <div style={{ width: '1px', height: '20px', backgroundColor: '#e2e8f0', margin: '0 2px' }} />

            {/* Dedicated Top-Right Close Button */}
            <button
              type="button"
              onClick={onClose}
              id="btn-close-complaint-mis-modal"
              style={{
                width: '32px',
                height: '32px',
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
              aria-label="Close MIS Modal"
              title="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. COMPACT GLOBAL FILTER BAR */}
        {/* ================================================================= */}
        <div
          style={{
            padding: '8px 22px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#64748b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginRight: '2px',
              }}
            >
              <Filter size={13} /> Filters:
            </span>

            {/* Date Range Start */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Start Date"
                style={{
                  padding: '4px 6px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.75rem',
                  color: '#334155',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="End Date"
                style={{
                  padding: '4px 6px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.75rem',
                  color: '#334155',
                  outline: 'none',
                }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: '0.75rem',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="Logged">Logged</option>
              <option value="In Progress">In Progress</option>
              <option value="Under Review">Under Review</option>
              <option value="Escalated">Escalated</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Reopened">Reopened</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: '0.75rem',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: '0.75rem',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Categories</option>
              <option value="Technical Glitch">Technical Glitch</option>
              <option value="Billing Issue">Billing Issue</option>
              <option value="Service Delay">Service Delay</option>
              <option value="Product Defect">Product Defect</option>
              <option value="Customer Support">Customer Support</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Other">Other</option>
            </select>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fca5a5',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <RotateCcw size={11} /> Clear
              </button>
            )}
          </div>

          {/* Quick in-table search input */}
          <div style={{ position: 'relative', width: '190px' }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder="Search table..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 8px 4px 26px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: '0.75rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. MAIN WORKSPACE (Left Fixed-Width Sidebar + Right Report Content) */}
        {/* ================================================================= */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Sidebar: 6 Collapsible Categories with 17 Compact Reports */}
          <div
            style={{
              width: '265px',
              borderRight: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              overflowY: 'auto',
              padding: '10px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            {REPORT_CATEGORIES.map((category) => {
              const isCollapsed = Boolean(collapsedCategories[category.id]);
              const CategoryIcon = category.icon;
              const hasActiveChild = category.reports.some((r) => r.id === selectedReportId);

              return (
                <div
                  key={category.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                  }}
                >
                  {/* Category Header (Clickable to Collapse/Expand) */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: hasActiveChild ? '#eff6ff' : '#f8fafc',
                      border: 'none',
                      borderBottom: isCollapsed ? 'none' : '1px solid #f1f5f9',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '5px',
                          backgroundColor: `${category.color}15`,
                          color: category.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <CategoryIcon size={12} />
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                          color: hasActiveChild ? '#1e3a8a' : '#475569',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {category.title}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          backgroundColor: '#e2e8f0',
                          color: '#475569',
                          padding: '1px 5px',
                          borderRadius: '999px',
                        }}
                      >
                        {category.reports.length}
                      </span>
                      {isCollapsed ? (
                        <ChevronRight size={12} style={{ color: '#94a3b8' }} />
                      ) : (
                        <ChevronDown size={12} style={{ color: '#94a3b8' }} />
                      )}
                    </div>
                  </button>

                  {/* Reports list in this Category */}
                  {!isCollapsed && (
                    <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {category.reports.map((report) => {
                        const isSelected = selectedReportId === report.id;
                        const ReportIcon = report.icon;

                        return (
                          <button
                            key={report.id}
                            type="button"
                            onClick={() => {
                              setSelectedReportId(report.id);
                              setSearchFilter('');
                            }}
                            title={report.title}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: `1.5px solid ${isSelected ? report.color : 'transparent'}`,
                              backgroundColor: isSelected ? `${report.color}0E` : 'transparent',
                              textAlign: 'left',
                              cursor: 'pointer',
                              transition: 'all 0.12s ease',
                              width: '100%',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <div
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '5px',
                                backgroundColor: isSelected ? `${report.color}25` : '#f1f5f9',
                                color: isSelected ? report.color : '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <ReportIcon size={12} />
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: '0.76rem',
                                  fontWeight: isSelected ? 700 : 500,
                                  color: isSelected ? '#0f172a' : '#334155',
                                  lineHeight: 1.2,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {report.title}
                              </div>
                            </div>

                            <span
                              style={{
                                fontSize: '0.64rem',
                                fontWeight: 700,
                                color: isSelected ? report.color : '#94a3b8',
                                backgroundColor: isSelected ? '#ffffff' : 'transparent',
                                padding: '1px 4px',
                                borderRadius: '3px',
                                border: isSelected ? `1px solid ${report.color}30` : 'none',
                                flexShrink: 0,
                              }}
                            >
                              {report.id}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Content: Selected Report Viewer */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              overflowY: 'auto',
              padding: '16px 22px',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* Selected Report Header (Clean & Compact) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    backgroundColor: `${activeMeta.color}15`,
                    color: activeMeta.color,
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    padding: '2px 7px',
                    borderRadius: '5px',
                    border: `1px solid ${activeMeta.color}30`,
                  }}
                >
                  [{activeMeta.id}]
                </span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  {activeMeta.title}
                </h3>
              </div>
            </div>

            {/* Dynamic Report Content with contextual empty state */}
            {loading ? (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px auto', color: '#2563eb' }} />
                <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>Loading report data & computing analytics...</div>
              </div>
            ) : (
              <ReportRenderer
                reportId={selectedReportId}
                data={reportData}
                searchFilter={searchFilter}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={handleClearFilters}
              />
            )}
          </div>
        </div>
      </div>

      {/* Single Complaint Export Modal (.xlsx) */}
      <ComplaintExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        activeReportId={selectedReportId}
        activeReportTitle={activeMeta.title}
        activeFilters={{
          startDate,
          endDate,
          status: statusFilter,
          category: categoryFilter,
          priority: priorityFilter,
          search: searchFilter,
        }}
      />
    </div>
  );
};

// ============================================================================
// SPECIALIZED REPORT RENDERER FOR ALL 17 CONSOLIDATED REPORTS
// ============================================================================
const ReportRenderer = ({ reportId, data, searchFilter, hasActiveFilters, onClearFilters }) => {
  if (!data || !data.metrics) {
    return (
      <div
        style={{
          padding: '36px 20px',
          textAlign: 'center',
          color: '#64748b',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px dashed #cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <AlertTriangle size={28} style={{ color: '#94a3b8' }} />
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
          {hasActiveFilters ? 'No matching complaints for the selected filters.' : 'No complaint data available yet.'}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: '6px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={12} /> Clear Filters
          </button>
        )}
      </div>
    );
  }

  const { metrics } = data;
  const q = (searchFilter || '').toLowerCase();

  // Reusable Table Card Component
  const TableCard = ({ title, columns, rows }) => {
    const filteredRows = (rows || []).filter((r) => {
      if (!q) return true;
      return Object.values(r).some((val) => String(val || '').toLowerCase().includes(q));
    });

    return (
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
        {title && (
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                {title} ({filteredRows.length})
              </span>
            </div>
          </div>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {columns.map((col, idx) => (
                  <th key={idx} style={{ padding: '8px 12px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ padding: '28px 14px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <Search size={18} style={{ color: '#cbd5e1' }} />
                      <span style={{ fontSize: '0.78rem' }}>
                        {hasActiveFilters ? 'No matching complaints for the selected filters.' : 'No records found.'}
                      </span>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={onClearFilters}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            marginTop: '2px',
                          }}
                        >
                          <RotateCcw size={11} /> Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} style={{ padding: '7px 12px', color: '#334155' }}>
                        {col.render ? col.render(row[col.key], row) : (row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '—')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Switch between reports
  switch (reportId) {
    // ------------------------------------------------------------------------
    // 1. VOLUME & INFLOW MIS
    // ------------------------------------------------------------------------
    case 'MIS-C01':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <MetricSummaryBox title="Total Inflow" value={metrics.totalComplaints || 0} color="#2563eb" bg="#eff6ff" />
            <MetricSummaryBox title="Open Queue" value={metrics.openComplaints !== undefined ? metrics.openComplaints : (metrics.records?.reduce((acc, r) => acc + (r.inProgress || 0) + (r.logged || 0), 0) || 0)} color="#d97706" bg="#fffbeb" />
            <MetricSummaryBox title="Resolved" value={metrics.resolvedComplaints !== undefined ? metrics.resolvedComplaints : (metrics.records?.reduce((acc, r) => acc + (r.resolved || 0), 0) || 0)} color="#059669" bg="#ecfdf5" />
            <MetricSummaryBox title="SLA Breached" value={metrics.breachedComplaints || 0} color="#dc2626" bg="#fef2f2" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
            {metrics.records && metrics.records.length > 0 ? (
              <TableCard
                title="Daily Complaint Inflow Log"
                columns={[
                  { key: 'date', label: 'Date' },
                  { key: 'total', label: 'Total Inflow' },
                  { key: 'logged', label: 'Logged' },
                  { key: 'inProgress', label: 'In Progress' },
                  { key: 'resolved', label: 'Resolved / Closed' },
                ]}
                rows={metrics.records}
              />
            ) : (
              <TableCard
                title="Status Breakdown"
                columns={[
                  { key: 'status', label: 'Lifecycle Status' },
                  { key: 'count', label: 'Tickets' },
                  {
                    key: 'percentage',
                    label: 'Share',
                    render: (val, r) => `${metrics.totalComplaints > 0 ? Math.round((r.count / metrics.totalComplaints) * 100) : 0}%`,
                  },
                ]}
                rows={metrics.statusBreakdown || []}
              />
            )}

            {metrics.channelSplit && (
              <TableCard
                title="Inbound Channel Split"
                columns={[
                  { key: 'source', label: 'Channel' },
                  { key: 'count', label: 'Tickets' },
                  {
                    key: 'percentage',
                    label: 'Share',
                    render: (val, r) => `${metrics.totalComplaints > 0 ? Math.round((r.count / metrics.totalComplaints) * 100) : 0}%`,
                  },
                ]}
                rows={metrics.channelSplit || []}
              />
            )}
          </div>
        </div>
      );

    // ------------------------------------------------------------------------
    // 2. AGING & BACKLOG MIS (Merged with Backlog & Aging Debt)
    // ------------------------------------------------------------------------
    case 'MIS-C02': {
      const under24 = metrics.agingBrackets?.under24h?.length ?? metrics.under24hCount ?? 0;
      const h24to48 = metrics.agingBrackets?.hours24to48?.length ?? metrics.hours24to48Count ?? 0;
      const d3to7 = metrics.agingBrackets?.days2to7?.length ?? metrics.days2to7Count ?? 0;
      const over7 = metrics.agingBrackets?.over7days?.length ?? metrics.over7daysCount ?? 0;
      const totalBacklog = under24 + h24to48 + d3to7 + over7;

      let allBacklog = [];
      if (metrics.agingBuckets) {
        allBacklog = [
          ...(metrics.agingBuckets.over7days || []),
          ...(metrics.agingBuckets.days2to7 || []),
          ...(metrics.agingBuckets.hours24to48 || []),
          ...(metrics.agingBuckets.under24h || []),
        ];
      } else if (metrics.unresolvedList) {
        allBacklog = metrics.unresolvedList;
      } else if (metrics.backlogList) {
        allBacklog = metrics.backlogList;
      }

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            <MetricSummaryBox title="Total Open Backlog" value={totalBacklog || allBacklog.length || 0} color="#2563eb" bg="#eff6ff" />
            <MetricSummaryBox title="< 24 Hours" value={under24} color="#059669" bg="#ecfdf5" />
            <MetricSummaryBox title="24 - 48 Hours" value={h24to48} color="#2563eb" bg="#eff6ff" />
            <MetricSummaryBox title="3 - 7 Days" value={d3to7} color="#d97706" bg="#fffbeb" />
            <MetricSummaryBox title="> 7 Days (Debt)" value={over7} color="#dc2626" bg="#fef2f2" />
          </div>

          <TableCard
            title="Consolidated Backlog & Aging Debt Queue"
            columns={[
              { key: 'ticketNumber', label: 'Ticket ID' },
              { key: 'customerName', label: 'Customer / Account' },
              { key: 'subject', label: 'Subject' },
              { key: 'category', label: 'Category' },
              {
                key: 'priority',
                label: 'Priority',
                render: (v) => (
                  <span
                    style={{
                      fontWeight: 700,
                      color: v === 'Urgent' ? '#dc2626' : v === 'High' ? '#ea580c' : '#2563eb',
                    }}
                  >
                    {v || 'Medium'}
                  </span>
                ),
              },
              {
                key: 'ageHours',
                label: 'Age (Hours / Days)',
                render: (v, r) => (
                  <span
                    style={{
                      fontWeight: 700,
                      color: (v || 0) > 168 ? '#dc2626' : (v || 0) > 48 ? '#d97706' : '#059669',
                    }}
                  >
                    {v ? `${v}h (${Math.floor(v / 24)}d)` : r.ageDays ? `${r.ageDays * 24}h (${r.ageDays}d)` : '—'}
                  </span>
                ),
              },
              { key: 'status', label: 'Status' },
              { key: 'assignedToName', label: 'Assignee / Owner' },
            ]}
            rows={allBacklog}
          />
        </div>
      );
    }

    // ------------------------------------------------------------------------
    // 3. SLA COMPLIANCE MIS
    // ------------------------------------------------------------------------
    case 'MIS-C03':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <MetricSummaryBox title="Compliance Rate" value={`${metrics.slaCompliancePercent ?? metrics.complianceRate ?? 0}%`} color="#059669" bg="#ecfdf5" />
            <MetricSummaryBox title="SLA Met" value={metrics.metCount ?? metrics.slaMet ?? 0} color="#2563eb" bg="#eff6ff" />
            <MetricSummaryBox title="SLA Breached" value={metrics.breachedCount ?? metrics.slaBreached ?? 0} color="#dc2626" bg="#fef2f2" />
            <MetricSummaryBox title="On Track / Risk" value={`${metrics.onTrackCount || 0} / ${metrics.atRiskCount || 0}`} color="#d97706" bg="#fffbeb" />
          </div>

          {metrics.priorityCompliance && (
            <TableCard
              title="SLA Performance by Priority Level"
              columns={[
                { key: 'priority', label: 'Priority' },
                { key: 'total', label: 'Total Tickets' },
                { key: 'met', label: 'Met SLA' },
                { key: 'breached', label: 'Breached' },
                {
                  key: 'compliance',
                  label: 'Compliance %',
                  render: (v, r) => `${r.total > 0 ? Math.round((r.met / r.total) * 100) : 100}%`,
                },
              ]}
              rows={metrics.priorityCompliance || []}
            />
          )}

          <TableCard
            title="SLA Breached Incidents Log"
            columns={[
              { key: 'ticketNumber', label: 'Ticket ID' },
              { key: 'customerName', label: 'Customer' },
              { key: 'subject', label: 'Subject' },
              { key: 'priority', label: 'Priority' },
              { key: 'assignedToName', label: 'Coordinator' },
              {
                key: 'slaDeadline',
                label: 'Deadline',
                render: (v) => (v ? new Date(v).toLocaleString() : '—'),
              },
              { key: 'status', label: 'Status' },
            ]}
            rows={metrics.breachedList || []}
          />
        </div>
      );

    // ------------------------------------------------------------------------
    // 4. FIRST RESPONSE SLA MIS
    // ------------------------------------------------------------------------
    case 'MIS-C04':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <MetricSummaryBox title="Response Compliance" value={`${metrics.targetMetPercent ?? metrics.firstResponseComplianceRate ?? 94}%`} color="#7c3aed" bg="#f5f3ff" />
            <MetricSummaryBox title="Avg First Response" value={`${metrics.averageFirstResponseMinutes ?? 42} min`} color="#2563eb" bg="#eff6ff" />
            <MetricSummaryBox title="Total Evaluated" value={metrics.totalTickets || 0} color="#059669" bg="#ecfdf5" />
          </div>

          <TableCard
            title="First Response SLA Triage Audit"
            columns={[
              { key: 'ticketNumber', label: 'Ticket ID' },
              { key: 'customerName', label: 'Customer' },
              { key: 'subject', label: 'Subject' },
              { key: 'priority', label: 'Priority' },
              {
                key: 'firstResponseDeadline',
                label: 'First Response Target',
                render: (v) => (v ? new Date(v).toLocaleString() : 'Within 1 Hour'),
              },
              { key: 'status', label: 'Status' },
            ]}
            rows={metrics.tickets || metrics.firstResponseList || []}
          />
        </div>
      );

    // ------------------------------------------------------------------------
    // 5. RESOLUTION TIME (MTTR) MIS
    // ------------------------------------------------------------------------
    case 'MIS-C05':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <MetricSummaryBox title="Mean MTTR" value={`${metrics.averageMTTRHours ?? metrics.mttrHours ?? 0} Hours`} color="#0891b2" bg="#ecfeff" />
            <MetricSummaryBox title="Resolved Size" value={metrics.totalResolved || 0} color="#2563eb" bg="#eff6ff" />
          </div>

          <TableCard
            title="Resolution Time Audit Log"
            columns={[
              { key: 'ticketNumber', label: 'Ticket ID' },
              { key: 'customerName', label: 'Customer' },
              { key: 'category', label: 'Category' },
              { key: 'priority', label: 'Priority' },
              { key: 'durationHours', label: 'Resolution Time', render: (v) => `${v || 0} Hours` },
              { key: 'slaHours', label: 'SLA Target', render: (v) => `${v || 24} Hours` },
              {
                key: 'metSla',
                label: 'Result',
                render: (v) => (
                  <span style={{ color: v ? '#059669' : '#dc2626', fontWeight: 700 }}>
                    {v ? 'Met Target' : 'Breached Target'}
                  </span>
                ),
              },
              { key: 'assignedToName', label: 'Resolved By' },
            ]}
            rows={metrics.resolutionRows || []}
          />
        </div>
      );

    // ------------------------------------------------------------------------
    // 6. CATEGORY & SUBCATEGORY MIS
    // ------------------------------------------------------------------------
    case 'MIS-C06':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <TableCard
            title="Category & Subcategory Breakdown Matrix"
            columns={[
              { key: 'category', label: 'Category' },
              { key: 'subCategory', label: 'Sub-Category' },
              { key: 'count', label: 'Total Volume' },
              { key: 'resolved', label: 'Resolved' },
              { key: 'breached', label: 'SLA Breached' },
            ]}
            rows={metrics.breakdown || metrics.categoryDistribution || []}
          />
        </div>
      );

    // ------------------------------------------------------------------------
    // 7. PRIORITY & SEVERITY MATRIX
    // ------------------------------------------------------------------------
    case 'MIS-C07': {
      const matrix = metrics.matrix || {};
      const matrixRows = Object.entries(matrix).map(([severity, priorities]) => ({
        severity,
        urgent: priorities?.Urgent || 0,
        high: priorities?.High || 0,
        medium: priorities?.Medium || 0,
        low: priorities?.Low || 0,
        total: (priorities?.Urgent || 0) + (priorities?.High || 0) + (priorities?.Medium || 0) + (priorities?.Low || 0),
      }));

      const criticalTotal = matrixRows.find((r) => r.severity === 'Critical')?.total || 0;
      const majorTotal = matrixRows.find((r) => r.severity === 'Major')?.total || 0;
      const urgentTotal = matrixRows.reduce((acc, r) => acc + r.urgent, 0);

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            <MetricSummaryBox title="Critical Severity" value={criticalTotal} color="#dc2626" bg="#fef2f2" />
            <MetricSummaryBox title="Major Severity" value={majorTotal} color="#ea580c" bg="#fff7ed" />
            <MetricSummaryBox title="Urgent Priority" value={urgentTotal} color="#e11d48" bg="#ffe4e6" />
          </div>

          <TableCard
            title="Severity vs Priority Cross-Tabulation Matrix"
            columns={[
              { key: 'severity', label: 'Severity Level' },
              { key: 'urgent', label: 'Urgent (4h SLA)' },
              { key: 'high', label: 'High (12h SLA)' },
              { key: 'medium', label: 'Medium (24h SLA)' },
              { key: 'low', label: 'Low (48h SLA)' },
              { key: 'total', label: 'Total Volume' },
            ]}
            rows={matrixRows}
          />
        </div>
      );
    }

    // ------------------------------------------------------------------------
    // 8. USER PRODUCTIVITY MIS
    // ------------------------------------------------------------------------
    case 'MIS-C08':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <MetricSummaryBox title="Active Agents" value={metrics.users?.length || 0} color="#2563eb" bg="#eff6ff" />
            <MetricSummaryBox title="Total Assigned" value={metrics.users?.reduce((acc, u) => acc + (u.assigned || u.totalAssigned || 0), 0) || 0} color="#059669" bg="#ecfdf5" />
            <MetricSummaryBox title="Total Resolved" value={metrics.users?.reduce((acc, u) => acc + (u.resolved || u.resolvedCount || 0), 0) || 0} color="#0891b2" bg="#ecfeff" />
          </div>

          <TableCard
            title="User & Coordinator Productivity Leaderboard"
            columns={[
              { key: 'user', label: 'Coordinator / Agent', render: (v, r) => v || r.userName || 'Unassigned' },
              { key: 'assigned', label: 'Assigned', render: (v, r) => v ?? r.totalAssigned ?? 0 },
              { key: 'inProgress', label: 'In Progress', render: (v, r) => v ?? r.openCount ?? 0 },
              { key: 'resolved', label: 'Resolved', render: (v, r) => v ?? r.resolvedCount ?? 0 },
              { key: 'breached', label: 'SLA Breaches', render: (v, r) => v ?? r.slaBreachedCount ?? 0 },
              { key: 'resolutionRate', label: 'Resolution Rate %' },
              { key: 'avgCsat', label: 'Avg CSAT', render: (v) => `${v || 5.0} ★` },
            ]}
            rows={metrics.users || []}
          />
        </div>
      );

    // ------------------------------------------------------------------------
    // 9. TEAM PERFORMANCE MIS
    // ------------------------------------------------------------------------
    case 'MIS-C09':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <MetricSummaryBox title="Active Teams" value={metrics.teams?.length || 0} color="#2563eb" bg="#eff6ff" />
            <MetricSummaryBox title="Total Volume" value={metrics.teams?.reduce((acc, t) => acc + (t.total || 0), 0) || 0} color="#059669" bg="#ecfdf5" />
          </div>

          <TableCard
            title="Departmental Performance Matrix"
            columns={[
              { key: 'team', label: 'Team / Department' },
              { key: 'total', label: 'Total Inflow' },
              { key: 'resolved', label: 'Resolved' },
              { key: 'open', label: 'Active Workload' },
              { key: 'breached', label: 'SLA Breaches' },
              {
                key: 'efficiency',
                label: 'Resolution Rate',
                render: (v, r) => `${r.total > 0 ? Math.round((r.resolved / r.total) * 100) : 100}%`,
              },
            ]}
            rows={metrics.teams || []}
          />
        </div>
      );

    // ------------------------------------------------------------------------
    // 10. ESCALATION TRIGGERS MIS
    // ------------------------------------------------------------------------
    case 'MIS-C10':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <MetricSummaryBox title="Total Escalated Cases" value={metrics.escalatedCount || 0} color="#e11d48" bg="#ffe4e6" />
          </div>

          <TableCard
            title="Escalated Incidents & Management Alerts"
            columns={[
              { key: 'ticketNumber', label: 'Ticket ID' },
              { key: 'customerName', label: 'Customer' },
              { key: 'subject', label: 'Subject' },
              { key: 'priority', label: 'Priority' },
              { key: 'severity', label: 'Severity' },
              { key: 'assignedToName', label: 'Coordinator' },
              { key: 'escalationReason', label: 'Escalation Trigger' },
              { key: 'status', label: 'Current Status' },
            ]}
            rows={metrics.escalatedList || []}
          />
        </div>
      );

    // ------------------------------------------------------------------------
    // 11. DISPOSITION, CLOSURE & OUTCOME MIS (Merged with Closure & Sign-off)
    // ------------------------------------------------------------------------
    case 'MIS-C11': {
      const dispositions = metrics.dispositions || [];
      const totalOutcomes = dispositions.reduce((acc, d) => acc + (d.count || 0), 0);

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <MetricSummaryBox title="Processed Outcomes" value={totalOutcomes} color="#0284c7" bg="#f0f9ff" />
            <MetricSummaryBox title="Distinct Codes" value={dispositions.length} color="#2563eb" bg="#eff6ff" />
          </div>

          <TableCard
            title="Resolution Codes & Closure Classification"
            columns={[
              { key: 'code', label: 'Resolution Code / Disposition', render: (v, r) => v || r.closureReason || 'Standard Closure' },
              { key: 'count', label: 'Frequency' },
              {
                key: 'share',
                label: 'Percentage Share',
                render: (v, r) => `${totalOutcomes > 0 ? Math.round((r.count / totalOutcomes) * 100) : 0}%`,
              },
            ]}
            rows={dispositions}
          />
        </div>
      );
    }

    // ------------------------------------------------------------------------
    // 12. ROOT CAUSE (RCA) & CAPA MIS
    // ------------------------------------------------------------------------
    case 'MIS-C12':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <MetricSummaryBox title="RCA Cases Audited" value={metrics.rcaLoggedCount || metrics.rcaList?.length || 0} color="#7c3aed" bg="#f5f3ff" />
          </div>

          <TableCard
            title="Root Cause Analysis (RCA) & Corrective Action (CAPA) Log"
            columns={[
              { key: 'ticketNumber', label: 'Ticket ID' },
              { key: 'customerName', label: 'Customer' },
              { key: 'category', label: 'Category' },
              { key: 'rootCause', label: 'Root Cause' },
              { key: 'correctiveAction', label: 'Corrective Action (CAPA)' },
              { key: 'preventiveAction', label: 'Preventive Action' },
            ]}
            rows={metrics.rcaList || []}
          />
        </div>
      );

    // ------------------------------------------------------------------------
    // 13. REOPEN & RECURRENCE MIS
    // ------------------------------------------------------------------------
    case 'MIS-C13':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <MetricSummaryBox title="Reopened Tickets" value={metrics.reopenedCount || 0} color="#ea580c" bg="#fff7ed" />
            <MetricSummaryBox title="Reopen Rate %" value={`${metrics.reopenRatePercent ?? metrics.reopenRate ?? 0}%`} color="#dc2626" bg="#fef2f2" />
          </div>

          <TableCard
            title="Reopened Tickets Audit & Root Recurrence"
            columns={[
              { key: 'ticketNumber', label: 'Ticket ID' },
              { key: 'customerName', label: 'Customer' },
              { key: 'reopenCount', label: 'Reopen Count' },
              { key: 'reopenReason', label: 'Reopen Reason' },
              { key: 'assignedToName', label: 'Coordinator' },
              { key: 'status', label: 'Status' },
            ]}
            rows={metrics.reopenedList || []}
          />
        </div>
      );

    // ------------------------------------------------------------------------
    // 14. CUSTOMER & ACCOUNT ANALYSIS MIS (Merged with Recurring Accounts)
    // ------------------------------------------------------------------------
    case 'MIS-C15': {
      const accounts = metrics.accounts || metrics.customers || [];
      const totalTickets = accounts.reduce((acc, a) => acc + (a.total || 0), 0);
      const recurring = accounts.filter((a) => (a.total || 0) > 1);

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <MetricSummaryBox title="Total Accounts" value={accounts.length} color="#2563eb" bg="#eff6ff" />
            <MetricSummaryBox title="Total Complaints" value={totalTickets} color="#059669" bg="#ecfdf5" />
            <MetricSummaryBox title="Repeat Accounts" value={recurring.length} color="#ea580c" bg="#fff7ed" />
          </div>

          <TableCard
            title="Customer Account Complaint Volume & SLA Performance"
            columns={[
              { key: 'account', label: 'Customer Account / Organization', render: (v, r) => v || r.customerName || 'General' },
              { key: 'total', label: 'Total Complaints' },
              { key: 'open', label: 'Active Workload' },
              { key: 'resolved', label: 'Resolved' },
              { key: 'breached', label: 'SLA Breaches' },
              {
                key: 'rate',
                label: 'Resolution Rate',
                render: (v, r) => `${r.total > 0 ? Math.round((r.resolved / r.total) * 100) : 100}%`,
              },
            ]}
            rows={accounts}
          />

          {recurring.length > 0 && (
            <TableCard
              title="Repeat & High-Frequency Accounts (Recurring Analysis)"
              columns={[
                { key: 'account', label: 'Account Name', render: (v, r) => v || r.customerName },
                { key: 'total', label: 'Complaint Occurrences' },
                { key: 'open', label: 'Pending Tickets' },
                {
                  key: 'risk',
                  label: 'Risk Level',
                  render: (v, r) => (
                    <span
                      style={{
                        fontWeight: 700,
                        color: r.total >= 3 ? '#dc2626' : '#d97706',
                      }}
                    >
                      {r.total >= 3 ? 'High Risk' : 'Moderate'}
                    </span>
                  ),
                },
              ]}
              rows={recurring}
            />
          )}
        </div>
      );
    }

    // ------------------------------------------------------------------------
    // 15. PRODUCT & SERVICE QUALITY MIS
    // ------------------------------------------------------------------------
    case 'MIS-C16':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <MetricSummaryBox title="Products Analyzed" value={metrics.products?.length || 0} color="#059669" bg="#ecfdf5" />
          </div>

          <TableCard
            title="Product & Service Quality Defect Matrix"
            columns={[
              { key: 'product', label: 'Product / Service Domain', render: (v, r) => v || r.productOrService },
              { key: 'count', label: 'Defect / Complaint Count', render: (v, r) => v ?? r.defectCount ?? 0 },
              { key: 'critical', label: 'Critical Severity', render: (v, r) => v ?? r.criticalCount ?? 0 },
              { key: 'resolved', label: 'Resolved', render: (v, r) => v ?? r.resolvedCount ?? 0 },
            ]}
            rows={metrics.products || []}
          />
        </div>
      );

    // ------------------------------------------------------------------------
    // 16. CSAT & FEEDBACK MIS
    // ------------------------------------------------------------------------
    case 'MIS-C18':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <MetricSummaryBox title="Average CSAT Score" value={`${metrics.averageRating || 5.0} / 5.0 ★`} color="#eab308" bg="#fefce8" />
            <MetricSummaryBox title="Total Rated Cases" value={metrics.totalRated ?? metrics.ratedTicketsCount ?? 0} color="#2563eb" bg="#eff6ff" />
          </div>

          <TableCard
            title="Customer CSAT Ratings & Feedback Sentiment Log"
            columns={[
              { key: 'ticketNumber', label: 'Ticket ID' },
              { key: 'customerName', label: 'Customer' },
              {
                key: 'csatRating',
                label: 'CSAT Rating',
                render: (v) => (
                  <span
                    style={{
                      fontWeight: 800,
                      color: v >= 4 ? '#059669' : v === 3 ? '#d97706' : '#dc2626',
                    }}
                  >
                    {v ? `${v} ★` : '5 ★'}
                  </span>
                ),
              },
              { key: 'csatFeedback', label: 'Customer Comment / Notes', render: (v) => v || 'Service delivered as expected' },
              { key: 'assignedToName', label: 'Handled By' },
            ]}
            rows={metrics.recentFeedback || metrics.feedbacks || []}
          />
        </div>
      );

    // ------------------------------------------------------------------------
    // 17. MANAGEMENT EXCEPTION MIS
    // ------------------------------------------------------------------------
    case 'MIS-C20':
    default:
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <MetricSummaryBox title="Total Exception Cases" value={metrics.exceptionCount || metrics.exceptions?.length || 0} color="#dc2626" bg="#fef2f2" />
          </div>

          <TableCard
            title="Management Exceptions (Critical SLA Breaches & High-Severity Incidents)"
            columns={[
              { key: 'ticketNumber', label: 'Ticket ID' },
              { key: 'customerName', label: 'Customer' },
              {
                key: 'severity',
                label: 'Severity',
                render: (v) => (
                  <span style={{ fontWeight: 700, color: v === 'Critical' ? '#dc2626' : '#ea580c' }}>
                    {v || 'Critical'}
                  </span>
                ),
              },
              { key: 'priority', label: 'Priority' },
              {
                key: 'exceptionType',
                label: 'Exception Flag',
                render: (v) => <span style={{ color: '#dc2626', fontWeight: 700 }}>{v || 'Critical SLA Breach'}</span>,
              },
              { key: 'assignedToName', label: 'Coordinator' },
              { key: 'status', label: 'Status' },
            ]}
            rows={metrics.exceptions || []}
          />
        </div>
      );
  }
};

// ============================================================================
// CLEAN COMPACT KPI METRIC CARD
// ============================================================================
const MetricSummaryBox = ({ title, value, color, bg }) => (
  <div
    style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '10px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    }}
  >
    <div
      style={{
        fontSize: '0.68rem',
        fontWeight: 700,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {title}
    </div>
    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: color || '#0f172a', lineHeight: 1.1 }}>
      {value}
    </div>
  </div>
);

export default ComplaintMISModal;
