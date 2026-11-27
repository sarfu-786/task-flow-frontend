import React, { useState } from 'react';
import { useLeads } from '../../context/LeadContext';
import { useUserManagement } from '../../context/UserContext';
import { AdvancedFilterDrawer } from './AdvancedFilterDrawer';
import {
  PhoneCall,
  Edit2,
  Trash2,
  Sparkles,
  Clock,
  Eye,
  Plus,
  Search,
  RotateCcw,
  CheckCircle2,
  Calendar,
  User,
  Filter,
  ArrowUpDown,
  Building,
  AlertCircle,
  Tag,
  Shield,
  Layers,
  Flame,
  Sun,
  Snowflake,
  Upload,
} from 'lucide-react';

export const EnhancedLeadTable = () => {
  const {
    paginatedLeads,
    totalLeads,
    currentPage,
    totalPages,
    setCurrentPage,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    sourceFilter,
    setSourceFilter,
    assignedToFilter,
    setAssignedToFilter,
    managerFilter,
    setManagerFilter,
    conversionStatusFilter,
    setConversionStatusFilter,
    followUpDateFilter,
    setFollowUpDateFilter,
    temperatureFilter,
    setTemperatureFilter,
    followUpStatusFilter,
    setFollowUpStatusFilter,
    dateRangeFilter,
    minValueFilter,
    isAdvancedFilterActive,
    clearAllFilters,
    openCreateModal,
    openImportModal,
    openEditModal,
    openLeadDetailModal,
    openAddCallModal,
    openScheduleFollowUpModal,
    openQualifyModal,
    openConvertModal,
    openDeleteModal,
  } = useLeads();

  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const { users } = useUserManagement();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Converted':
        return { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe', label: 'Converted' };
      case 'Qualified':
        return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', label: 'Qualified' };
      case 'Interested':
        return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'Interested' };
      case 'Follow-Up':
      case 'Follow_Up':
        return { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'Follow-Up' };
      case 'Contacted':
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', label: 'Contacted' };
      case 'Not Interested':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Not Interested' };
      case 'Invalid':
        return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', label: 'Invalid' };
      default:
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', label: status || 'New' };
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
      case 'High':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      case 'Medium':
        return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
      default:
        return { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
    }
  };

  const getTemperatureBadge = (temp, score = 0) => {
    const t = temp || (score >= 70 ? 'Hot' : score >= 40 ? 'Warm' : 'Cold');
    switch (t) {
      case 'Hot':
        return { bg: '#fef2f2', color: '#ea580c', border: '#fecaca', icon: '🔥', label: 'Hot' };
      case 'Warm':
        return { bg: '#fffbeb', color: '#d97706', border: '#fde68a', icon: '☀️', label: 'Warm' };
      case 'Cold':
      default:
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: '❄️', label: 'Cold' };
    }
  };

  const getFollowUpStateBadge = (lead) => {
    // Converted or closed leads should never show active/overdue follow-up alerts
    if (lead.status === 'Converted') {
      return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', label: 'Deal Converted' };
    }
    if (['Not Interested', 'Invalid', 'Lost'].includes(lead.status)) {
      return null;
    }

    const status = lead.followUpStatus || 'None';
    const nextDate = lead.nextFollowUpDate || lead.next_followup_at;
    if (!nextDate && status === 'None') return null;

    switch (status) {
      case 'Overdue':
        return {
          bg: '#fef2f2',
          color: '#dc2626',
          border: '#fecaca',
          label: lead.followUpOverdueDays ? `Overdue (${lead.followUpOverdueDays}d)` : 'Overdue',
        };
      case 'Due Today':
        return { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'Due Today' };
      case 'Upcoming':
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', label: 'Upcoming' };
      case 'Completed':
        return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'Completed' };
      default:
        return null;
    }
  };

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '₹0';
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  const moreFiltersCount =
    (sourceFilter !== 'all' ? 1 : 0) +
    (minValueFilter ? 1 : 0) +
    (dateRangeFilter?.start || dateRangeFilter?.end ? 1 : 0);

  const isAnyFilterActive =
    Boolean(search) ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    assignedToFilter !== 'all' ||
    sourceFilter !== 'all' ||
    Boolean(minValueFilter) ||
    Boolean(dateRangeFilter?.start) ||
    Boolean(dateRangeFilter?.end) ||
    temperatureFilter !== 'all' ||
    followUpStatusFilter !== 'all' ||
    Boolean(isAdvancedFilterActive);

  return (
    <div
      className="enhanced-lead-table-container"
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Interactive Quick Filter Toolbar */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Compact Search Box */}
        <div style={{ position: 'relative', width: '210px', flexShrink: 0 }}>
          <Search
            size={13}
            color="#94a3b8"
            style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search leads, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '5px 8px 5px 28px',
              borderRadius: '7px',
              border: '1px solid #cbd5e1',
              fontSize: '0.78rem',
              backgroundColor: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Quick Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* 1. Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: statusFilter !== 'all' ? '1px solid #93c5fd' : '1px solid #cbd5e1',
              fontSize: '0.74rem',
              backgroundColor: statusFilter !== 'all' ? '#eff6ff' : '#ffffff',
              color: statusFilter !== 'all' ? '#1d4ed8' : '#334155',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Follow-Up">Follow-Up</option>
            <option value="Qualified">Qualified</option>
            <option value="Interested">Interested</option>
            <option value="Converted">Converted</option>
            <option value="Not Interested">Not Interested</option>
            <option value="Invalid">Invalid</option>
          </select>

          {/* 2. Temperature Filter */}
          <select
            value={temperatureFilter}
            onChange={(e) => setTemperatureFilter(e.target.value)}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: temperatureFilter !== 'all' ? '1px solid #93c5fd' : '1px solid #cbd5e1',
              fontSize: '0.74rem',
              backgroundColor: temperatureFilter !== 'all' ? '#eff6ff' : '#ffffff',
              color: temperatureFilter !== 'all' ? '#1d4ed8' : '#334155',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="all">All Temps</option>
            <option value="Hot">🔥 Hot (&ge; 70)</option>
            <option value="Warm">☀️ Warm (40-69)</option>
            <option value="Cold">❄️ Cold (&lt; 40)</option>
          </select>

          {/* 3. Follow-Up Status Filter */}
          <select
            value={followUpStatusFilter}
            onChange={(e) => setFollowUpStatusFilter(e.target.value)}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: followUpStatusFilter !== 'all' ? '1px solid #93c5fd' : '1px solid #cbd5e1',
              fontSize: '0.74rem',
              backgroundColor: followUpStatusFilter !== 'all' ? '#eff6ff' : '#ffffff',
              color: followUpStatusFilter !== 'all' ? '#1d4ed8' : '#334155',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="all">All Follow-Ups</option>
            <option value="Overdue">🔴 Overdue</option>
            <option value="Due Today">🟡 Due Today</option>
            <option value="Upcoming">🔵 Upcoming</option>
            <option value="Completed">🟢 Completed</option>
          </select>

          {/* 4. Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: priorityFilter !== 'all' ? '1px solid #93c5fd' : '1px solid #cbd5e1',
              fontSize: '0.74rem',
              backgroundColor: priorityFilter !== 'all' ? '#eff6ff' : '#ffffff',
              color: priorityFilter !== 'all' ? '#1d4ed8' : '#334155',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* 5. Assigned Sales Rep Filter */}
          <select
            value={assignedToFilter}
            onChange={(e) => setAssignedToFilter(e.target.value)}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: assignedToFilter !== 'all' ? '1px solid #93c5fd' : '1px solid #cbd5e1',
              fontSize: '0.74rem',
              backgroundColor: assignedToFilter !== 'all' ? '#eff6ff' : '#ffffff',
              color: assignedToFilter !== 'all' ? '#1d4ed8' : '#334155',
              fontWeight: 600,
              cursor: 'pointer',
              maxWidth: '145px',
            }}
          >
            <option value="all">All Owners</option>
            {(users || [])
              .filter((u) => u && u.status !== 'Rejected' && u.status !== 'Pending')
              .map((u) => (
                <option key={u._id || u.id || u.email} value={u.name || u.username}>
                  {u.name || u.email || 'User'}
                </option>
              ))}
          </select>

          {/* More Filters Trigger (Source, Min Value ₹, Date Range) */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 9px',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: moreFiltersCount > 0 ? '#2563eb' : showAdvancedFilter ? '#6366f1' : '#cbd5e1',
              backgroundColor: moreFiltersCount > 0 ? '#eff6ff' : showAdvancedFilter ? '#f5f3ff' : '#ffffff',
              color: moreFiltersCount > 0 ? '#1d4ed8' : showAdvancedFilter ? '#4f46e5' : '#334155',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Filter by Lead Source, Min Deal Value (₹), and Date Range"
          >
            <Filter size={12} color={moreFiltersCount > 0 ? '#1d4ed8' : '#4f46e5'} />
            <span>More Filters</span>
            {moreFiltersCount > 0 && (
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '0px 5px',
                  borderRadius: '999px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                }}
              >
                {moreFiltersCount}
              </span>
            )}
          </button>

          {/* Reset Filters */}
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={clearAllFilters}
              title="Reset all search queries and filters"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#64748b',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Advanced Multi-Dimensional Filter Drawer */}
      {(showAdvancedFilter || isAdvancedFilterActive) && (
        <div style={{ padding: '16px 18px 0 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <AdvancedFilterDrawer />
        </div>
      )}

      {/* Main Responsive Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', textAlign: 'left', color: '#475569', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
              <th style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>ID</th>
              <th style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>COMPANY</th>
              <th style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>CONTACT</th>
              <th style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>STATUS</th>
              <th style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>SCORE</th>
              <th style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>OWNER</th>
              <th style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>LAST CALL</th>
              <th style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>FOLLOW-UP</th>
              <th style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>VALUE</th>
              <th style={{ padding: '11px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLeads.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ padding: '28px 16px', textAlign: 'center' }}>
                  {isAnyFilterActive ? (
                    <div>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: '#f1f5f9',
                          color: '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 8px auto',
                        }}
                      >
                        <Search size={16} />
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1e293b', marginBottom: '3px' }}>
                        No leads matching your current criteria
                      </div>
                      <p style={{ margin: '0 0 12px 0', fontSize: '0.75rem', color: '#64748b' }}>
                        Try clearing or adjusting your search keywords and filter parameters.
                      </p>
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                        }}
                      >
                        <RotateCcw size={12} />
                        <span>Reset Filters</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          border: '1.5px solid #bfdbfe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 10px auto',
                          boxShadow: '0 2px 5px rgba(37, 99, 235, 0.1)',
                        }}
                      >
                        <Layers size={18} />
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a', marginBottom: '3px' }}>
                        No leads in your CRM registry yet
                      </div>
                      <p style={{ margin: '0 auto 14px auto', fontSize: '0.76rem', color: '#64748b', maxWidth: '360px', lineHeight: 1.45 }}>
                        Start tracking prospect pipelines, outreach logs, and deal conversions by adding your first lead or importing from Excel.
                      </p>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={openCreateModal}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                          }}
                        >
                          <Plus size={13} />
                          <span>Add Lead</span>
                        </button>
                        <button
                          type="button"
                          onClick={openImportModal}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#ffffff',
                            color: '#059669',
                            border: '1.5px solid #a7f3d0',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <Upload size={12} />
                          <span>Import Leads</span>
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              paginatedLeads.map((lead) => {
                const statusBadge = getStatusBadge(lead.status);
                const priorityBadge = getPriorityBadge(lead.priority);
                const score = lead.leadScore !== undefined ? lead.leadScore : 50;
                const tempBadge = getTemperatureBadge(lead.leadTemperature, score);
                const followUpBadge = getFollowUpStateBadge(lead);
                const isConverted = lead.status === 'Converted' || !!lead.opportunityId || !!lead.convertedOpportunityId;
                const canConvert = !isConverted && (lead.status === 'Qualified' || lead.status === 'Interested');
                const canQualify = !isConverted && lead.status !== 'Qualified' && lead.status !== 'Lost' && lead.status !== 'Invalid';

                return (
                  <tr
                    key={lead._id || lead.lead_id || lead.leadId}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: isConverted ? '#faf5ff' : '#ffffff',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* 1. Lead ID */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {lead.leadId || 'LD-001'}
                      </span>
                    </td>

                    {/* 2. Company */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.88rem' }}>
                        {lead.company || 'Enterprise Account'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Source: {lead.source || lead.campaign_source || 'Website'}
                      </div>
                    </td>

                    {/* 3. Contact */}
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>
                        {lead.contactPerson || lead.name}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '1px' }}>
                        {lead.mobileNumber || lead.phone ? (
                          <a
                            href={`tel:${(lead.mobileNumber || lead.phone).replace(/\s+/g, '')}`}
                            title="Click to call"
                            style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                          >
                            {lead.mobileNumber || lead.phone}
                          </a>
                        ) : (
                          lead.email || 'No phone'
                        )}
                      </div>
                    </td>

                    {/* 4. Status */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: statusBadge.bg,
                            color: statusBadge.color,
                            border: `1px solid ${statusBadge.border}`,
                          }}
                        >
                          {statusBadge.label}
                        </span>

                        {lead.priority && (
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              background: priorityBadge.bg,
                              color: priorityBadge.color,
                              border: `1px solid ${priorityBadge.border}`,
                            }}
                          >
                            {lead.priority}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 5. Lead Score & Temperature */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: tempBadge.bg,
                            color: tempBadge.color,
                            border: `1px solid ${tempBadge.border}`,
                          }}
                          title={`Lead Temperature: ${tempBadge.label} (Score: ${score}/100)`}
                        >
                          <span>{tempBadge.icon}</span>
                          <span>{tempBadge.label}</span>
                        </span>
                        <span
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            color: '#1e293b',
                          }}
                        >
                          {score}
                        </span>
                      </div>
                    </td>

                    {/* 6. Assigned To */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.82rem' }}>
                        {lead.assignedSalesUser || lead.assignedTo || 'Unassigned'}
                      </div>
                      {lead.assignedManagerName && (
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          Mgr: {lead.assignedManagerName}
                        </div>
                      )}
                    </td>

                    {/* 7. Last Contact */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.78rem', color: lead.lastContactDate ? '#334155' : '#94a3b8' }}>
                        {lead.lastContactDate || lead.last_contacted_at
                          ? new Date(lead.lastContactDate || lead.last_contacted_at).toLocaleDateString('en-GB')
                          : 'Not contacted'}
                      </div>
                      {lead.callLogs && lead.callLogs.length > 0 && (
                        <button
                          type="button"
                          onClick={() => openLeadDetailModal(lead, 'calls')}
                          title="Click to view complete call history, duration, and remarks"
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            margin: '2px 0 0 0',
                            fontSize: '0.68rem',
                            color: '#2563eb',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            textUnderlineOffset: '2px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <span>{lead.callLogs.length} call{lead.callLogs.length > 1 ? 's' : ''} logged</span>
                        </button>
                      )}
                    </td>

                    {/* 8. Next Follow-Up (Clean single badge for Converted leads; Date + State for Active leads) */}
                    <td style={{ padding: '12px 12px', whiteSpace: 'nowrap' }}>
                      {isConverted ? (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: '#f5f3ff',
                            color: '#6d28d9',
                            border: '1px solid #ddd6fe',
                            display: 'inline-block',
                          }}
                        >
                          Deal Converted
                        </span>
                      ) : lead.nextFollowUpDate || lead.next_followup_at ? (
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b45309' }}>
                            {new Date(lead.nextFollowUpDate || lead.next_followup_at).toLocaleDateString('en-GB')}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            {followUpBadge && (
                              <span
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.66rem',
                                  fontWeight: 700,
                                  background: followUpBadge.bg,
                                  color: followUpBadge.color,
                                  border: `1px solid ${followUpBadge.border}`,
                                  whiteSpace: 'nowrap',
                                  display: 'inline-block',
                                }}
                              >
                                {followUpBadge.label}
                              </span>
                            )}
                            {lead.nextFollowUpTime && (
                              <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                {lead.nextFollowUpTime}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No follow-up</span>
                      )}
                    </td>

                    {/* 9. Value */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.86rem' }}>
                        {formatCurrency(lead.estimatedValue || lead.dealValue || lead.pipeline_value)}
                      </div>
                    </td>

                    {/* 10. Action: Single View-Only Eye Icon for Converted leads; Full Actions for active leads */}
                    <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {isConverted ? (
                        <button
                          type="button"
                          onClick={() => openLeadDetailModal(lead)}
                          title={`View Converted Lead & Linked Deal (${lead.opportunityId || 'Opportunity'})`}
                          style={{
                            width: '30px',
                            height: '30px',
                            padding: 0,
                            borderRadius: '7px',
                            background: '#f5f3ff',
                            border: '1px solid #ddd6fe',
                            color: '#6d28d9',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Eye size={14} />
                        </button>
                      ) : (
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', flexWrap: 'nowrap' }}>
                        {/* 1. View Sign */}
                        <button
                          type="button"
                          onClick={() => openLeadDetailModal(lead)}
                          title="View Lead Details"
                          style={{
                            width: '28px',
                            height: '28px',
                            padding: 0,
                            borderRadius: '6px',
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            color: '#334155',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Eye size={14} />
                        </button>

                        {/* 2. Edit Sign */}
                        <button
                          type="button"
                          onClick={() => openEditModal(lead)}
                          title="Edit Lead"
                          style={{
                            width: '28px',
                            height: '28px',
                            padding: 0,
                            borderRadius: '6px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#475569',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* 3. Add Call Sign */}
                        <button
                          type="button"
                          onClick={() => openAddCallModal(lead)}
                          title="Record Call / Communication Log"
                          style={{
                            width: '28px',
                            height: '28px',
                            padding: 0,
                            borderRadius: '6px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#1d4ed8',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <PhoneCall size={13} />
                        </button>

                        {/* 4. Follow-Up Sign */}
                        <button
                          type="button"
                          onClick={() => openScheduleFollowUpModal(lead)}
                          title="Schedule Follow-Up"
                          style={{
                            width: '28px',
                            height: '28px',
                            padding: 0,
                            borderRadius: '6px',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            color: '#b45309',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Clock size={13} />
                        </button>

                        {/* 5. Convert / Qualify Sign */}
                        {canConvert ? (
                          <button
                            type="button"
                            onClick={() => openConvertModal(lead)}
                            title="Convert Qualified Lead to Opportunity"
                            style={{
                              width: '28px',
                              height: '28px',
                              padding: 0,
                              borderRadius: '6px',
                              background: '#059669',
                              border: 'none',
                              color: '#ffffff',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 1px 2px rgba(5, 150, 105, 0.25)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Sparkles size={14} />
                          </button>
                        ) : canQualify ? (
                          <button
                            type="button"
                            onClick={() => openQualifyModal(lead)}
                            title="Qualify Lead (Prepare for Opportunity Pipeline)"
                            style={{
                              width: '28px',
                              height: '28px',
                              padding: 0,
                              borderRadius: '6px',
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#059669',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <CheckCircle2 size={13} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            title="Convert (Disabled: Lead is marked as Lost/Invalid)"
                            style={{
                              width: '28px',
                              height: '28px',
                              padding: 0,
                              borderRadius: '6px',
                              background: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              color: '#94a3b8',
                              cursor: 'not-allowed',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Sparkles size={13} />
                          </button>
                        )}

                        {/* 6. Delete Sign */}
                        <button
                          type="button"
                          onClick={() => openDeleteModal(lead)}
                          title="Delete Lead"
                          style={{
                            width: '28px',
                            height: '28px',
                            padding: 0,
                            borderRadius: '6px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          background: '#ffffff',
        }}
      >
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Showing <strong>{paginatedLeads.length}</strong> of <strong>{totalLeads}</strong> leads
        </span>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  border: currentPage === p ? 'none' : '1px solid #e2e8f0',
                  background: currentPage === p ? '#2563eb' : '#ffffff',
                  color: currentPage === p ? '#ffffff' : '#334155',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              className="btn btn-secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedLeadTable;

