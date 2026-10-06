import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { socketService } from '../services/socket';

const LeadContext = createContext(null);

export const LeadProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const [leads, setLeads] = useState(() => {
    try {
      const cached = localStorage.getItem('taskflow_cached_leads');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [stats, setStats] = useState(() => {
    try {
      const cached = localStorage.getItem('taskflow_cached_lead_stats');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtering & Pagination State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all');
  const [conversionStatusFilter, setConversionStatusFilter] = useState('all');
  const [temperatureFilter, setTemperatureFilter] = useState('all');
  const [followUpStatusFilter, setFollowUpStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: '', end: '' });
  const [followUpDateFilter, setFollowUpDateFilter] = useState('');
  const [slaTierFilter, setSlaTierFilter] = useState('all');
  const [dispositionFilter, setDispositionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Active Top Navigation Tab: 'pipeline' | 'dispositions' | 'filter' | 'mis' | 'widgets' | 'sla' | 'audit'
  const [activeTab, setActiveTab] = useState('pipeline');

  // Advanced Filter Engine State
  const [advancedRules, setAdvancedRules] = useState([]);
  const [advancedLogic, setAdvancedLogic] = useState('AND');
  const [isAdvancedFilterActive, setIsAdvancedFilterActive] = useState(false);
  const [advancedFilteredLeads, setAdvancedFilteredLeads] = useState(null);
  const [filterStats, setFilterStats] = useState(null);

  // Modal States
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedLead, setSelectedLead] = useState(null);

  // Lead Detail View Modal (5 tabs: Lead Info, Call Logs, Follow-Ups, Timeline, Opportunity)
  const [isLeadDetailModalOpen, setIsLeadDetailModalOpen] = useState(false);
  const [leadForDetail, setLeadForDetail] = useState(null);
  const [leadDetailTab, setLeadDetailTab] = useState('info');

  // Add Call Log Modal
  const [isAddCallModalOpen, setIsAddCallModalOpen] = useState(false);
  const [leadForCall, setLeadForCall] = useState(null);

  // Schedule Follow-Up Modal
  const [isScheduleFollowUpModalOpen, setIsScheduleFollowUpModalOpen] = useState(false);
  const [leadForFollowUp, setLeadForFollowUp] = useState(null);

  // Qualify Modal
  const [isQualifyModalOpen, setIsQualifyModalOpen] = useState(false);
  const [leadToQualify, setLeadToQualify] = useState(null);

  // Convert Modal
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState(null);

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);

  // 1-Click Disposition Modal State
  const [isDispositionModalOpen, setIsDispositionModalOpen] = useState(false);
  const [leadForDisposition, setLeadForDisposition] = useState(null);

  // Audit Trail Viewer Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [leadForAudit, setLeadForAudit] = useState(null);

  // Import / Export Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [roleScope, setRoleScope] = useState('');

  // Fetch leads
  const fetchLeads = useCallback(async (silent = false) => {
    if (!isAuthenticated) return;
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await api.getLeads();
      if (res.success) {
        setLeads(res.leads);
        if (res.roleScope) setRoleScope(res.roleScope);
        try {
          localStorage.setItem('taskflow_cached_leads', JSON.stringify(res.leads));
        } catch {}

        // If detail modal is open, keep leadForDetail in sync
        setLeadForDetail((prev) => {
          if (!prev) return null;
          const fresh = res.leads.find((l) => (l._id && l._id === prev._id) || (l.leadId && l.leadId === prev.leadId));
          return fresh || prev;
        });
      }
    } catch (err) {
      console.error('Fetch leads error:', err);
      if (!silent) setError(err.message || 'Failed to load leads');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getLeadStats();
      if (res.success) {
        setStats(res.stats);
        try {
          localStorage.setItem('taskflow_cached_lead_stats', JSON.stringify(res.stats));
        } catch {}
      }
    } catch (err) {
      console.error('Fetch lead stats error:', err);
    }
  }, [isAuthenticated]);

  // Initial Load & Socket Listeners
  useEffect(() => {
    if (isAuthenticated) {
      fetchLeads();
      fetchStats();

      const unsubscribeLeads = socketService.on('leads:updated', () => {
        fetchLeads(true);
        fetchStats();
      });

      const unsubscribeSLA = socketService.on('sla:breach', () => {
        fetchLeads(true);
        fetchStats();
      });

      return () => {
        if (typeof unsubscribeLeads === 'function') unsubscribeLeads();
        if (typeof unsubscribeSLA === 'function') unsubscribeSLA();
      };
    }
  }, [isAuthenticated, fetchLeads, fetchStats]);

  // Create Lead
  const createLead = async (leadData) => {
    try {
      const res = await api.createLead(leadData);
      if (res.success) {
        await fetchLeads(true);
        await fetchStats();
        closeLeadModal();
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  // Update Lead
  const updateLead = async (id, leadData) => {
    try {
      const res = await api.updateLead(id, leadData);
      if (res.success) {
        await fetchLeads(true);
        await fetchStats();
        closeLeadModal();
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  // Update Lead Status
  const updateLeadStatus = async (id, status) => {
    try {
      const res = await api.updateLeadStatus(id, status);
      if (res.success) {
        setLeads((prev) =>
          prev.map((l) => (l._id.toString() === id.toString() ? { ...l, status } : l))
        );
        await fetchStats();
        return res;
      }
    } catch (err) {
      console.error('Failed to update lead status:', err);
      throw err;
    }
  };

  // Record Call Log
  const recordCall = async (leadId, callData) => {
    try {
      const res = await api.recordLeadCall(leadId, callData);
      if (res.success) {
        await fetchLeads(true);
        await fetchStats();
        closeAddCallModal();
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  // Schedule Follow-Up
  const scheduleFollowUp = async (leadId, followupData) => {
    try {
      const res = await api.scheduleLeadFollowUp(leadId, followupData);
      if (res.success) {
        await fetchLeads(true);
        await fetchStats();
        closeScheduleFollowUpModal();
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  // Update Follow-Up
  const updateFollowUp = async (leadId, followUpId, followupData) => {
    try {
      const res = await api.updateLeadFollowUp(leadId, followUpId, followupData);
      if (res.success) {
        await fetchLeads(true);
        await fetchStats();
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  // 1-Click Disposition Matrix Logging
  const logDisposition = async (id, dispositionData) => {
    try {
      const res = await api.logLeadDisposition(id, dispositionData);
      if (res.success) {
        await fetchLeads(true);
        await fetchStats();
        closeDispositionModal();
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  // Claim Unassigned Lead from High-Priority Queue
  const claimLead = async (id) => {
    try {
      const res = await api.claimUnassignedLead(id);
      if (res.success) {
        await fetchLeads(true);
        await fetchStats();
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  // Execute Advanced Multi-Dimensional Filter
  const executeAdvancedFilter = async (rules, logic = 'AND') => {
    try {
      setLoading(true);
      setAdvancedRules(rules);
      setAdvancedLogic(logic);
      const res = await api.filterLeadsAdvanced(rules, logic);
      if (res.success) {
        setAdvancedFilteredLeads(res.leads);
        setIsAdvancedFilterActive(true);
        setFilterStats({
          executionTimeMs: res.executionTimeMs,
          count: res.count,
          rulesCount: rules.length,
        });
      }
      return res;
    } catch (err) {
      console.error('Advanced filter error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetAdvancedFilter = () => {
    setAdvancedRules([]);
    setAdvancedLogic('AND');
    setIsAdvancedFilterActive(false);
    setAdvancedFilteredLeads(null);
    setFilterStats(null);
  };

  // Qualify Lead (Without creating an opportunity)
  const qualifyLead = async (id, qualificationData = {}) => {
    try {
      const res = await api.qualifyLead(id, qualificationData);
      if (res.success) {
        await fetchLeads(true);
        await fetchStats();
        closeQualifyModal();
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  // Convert Lead to Opportunity
  const convertLeadToOpportunity = async (id, conversionData) => {
    try {
      const res = await api.convertLeadToOpportunity(id, conversionData);
      if (res.success) {
        await fetchLeads(true);
        await fetchStats();
        closeConvertModal();
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  // Update Opportunity Stage directly from Converted Lead UI
  const updateLeadOpportunityStage = async (leadOrOppId, stage, lostReason = '', lostReasonDetails = '') => {
    try {
      const res = await api.updateOpportunityStage(leadOrOppId, stage, lostReason, lostReasonDetails);
      if (res.success) {
        await fetchLeads(true);
        await fetchStats();
      }
      return res;
    } catch (err) {
      console.error('Failed to update lead opportunity stage:', err);
      throw err;
    }
  };

  // Delete Lead
  const deleteLead = async (id) => {
    try {
      const res = await api.deleteLead(id);
      if (res.success) {
        setLeads((prev) => prev.filter((l) => l._id.toString() !== id.toString()));
        await fetchStats();
        closeDeleteModal();
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  // Modal Open / Close Handlers
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedLead(null);
    setIsLeadModalOpen(true);
  };

  const openEditModal = (lead) => {
    setModalMode('edit');
    setSelectedLead(lead);
    setIsLeadModalOpen(true);
  };

  const closeLeadModal = () => {
    setIsLeadModalOpen(false);
    setSelectedLead(null);
  };

  const openLeadDetailModal = (lead, tab = 'info') => {
    setLeadForDetail(lead);
    setLeadDetailTab(tab);
    setIsLeadDetailModalOpen(true);
  };

  const closeLeadDetailModal = () => {
    setIsLeadDetailModalOpen(false);
    setLeadForDetail(null);
    setLeadDetailTab('info');
  };

  const openAddCallModal = (lead) => {
    setLeadForCall(lead);
    setIsAddCallModalOpen(true);
  };

  const closeAddCallModal = () => {
    setIsAddCallModalOpen(false);
    setLeadForCall(null);
  };

  const openScheduleFollowUpModal = (lead) => {
    setLeadForFollowUp(lead);
    setIsScheduleFollowUpModalOpen(true);
  };

  const closeScheduleFollowUpModal = () => {
    setIsScheduleFollowUpModalOpen(false);
    setLeadForFollowUp(null);
  };

  const openQualifyModal = (lead) => {
    setLeadToQualify(lead);
    setIsQualifyModalOpen(true);
  };

  const closeQualifyModal = () => {
    setIsQualifyModalOpen(false);
    setLeadToQualify(null);
  };

  const openConvertModal = (lead) => {
    setLeadToConvert(lead);
    setIsConvertModalOpen(true);
  };

  const closeConvertModal = () => {
    setIsConvertModalOpen(false);
    setLeadToConvert(null);
  };

  const openDeleteModal = (lead) => {
    setLeadToDelete(lead);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setLeadToDelete(null);
  };

  const openDispositionModal = (lead) => {
    setLeadForDisposition(lead);
    setIsDispositionModalOpen(true);
  };

  const closeDispositionModal = () => {
    setIsDispositionModalOpen(false);
    setLeadForDisposition(null);
  };

  const openAuditModal = (lead) => {
    setLeadForAudit(lead);
    setIsAuditModalOpen(true);
  };

  const closeAuditModal = () => {
    setIsAuditModalOpen(false);
    setLeadForAudit(null);
  };

  const openImportModal = () => {
    setIsImportModalOpen(true);
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
  };

  const openExportModal = () => {
    setIsExportModalOpen(true);
  };

  const closeExportModal = () => {
    setIsExportModalOpen(false);
  };

  const previewLeadExcel = async (fileData, fileName, mapping = null) => {
    return await api.previewLeadExcel(fileData, fileName, mapping);
  };

  const importLeadExcel = async (payload) => {
    return await api.importLeadExcel(payload);
  };

  const downloadLeadExcelTemplate = async (format = 'xlsx') => {
    return await api.downloadLeadExcelTemplate(format);
  };

  // Filtered Leads computation
  const baseLeads = isAdvancedFilterActive && advancedFilteredLeads !== null ? advancedFilteredLeads : leads;

  const filteredLeads = baseLeads.filter((lead) => {
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      const matchId = (lead.leadId && lead.leadId.toLowerCase().includes(q)) || (lead.lead_id && lead.lead_id.toLowerCase().includes(q));
      const matchName = (lead.name && lead.name.toLowerCase().includes(q)) || (lead.contactPerson && lead.contactPerson.toLowerCase().includes(q));
      const matchCompany = lead.company && lead.company.toLowerCase().includes(q);
      const matchEmail = lead.email && lead.email.toLowerCase().includes(q);
      const matchPhone = (lead.phone && lead.phone.toLowerCase().includes(q)) || (lead.mobileNumber && lead.mobileNumber.toLowerCase().includes(q));
      const matchReq = lead.requirement && lead.requirement.toLowerCase().includes(q);
      const matchNotes = (lead.notes && lead.notes.toLowerCase().includes(q)) || (lead.remarks && lead.remarks.toLowerCase().includes(q));
      const matchAssignee = (lead.assignedTo && lead.assignedTo.toLowerCase().includes(q)) || (lead.assignedSalesUser && lead.assignedSalesUser.toLowerCase().includes(q));
      const matchSource = (lead.source && lead.source.toLowerCase().includes(q)) || (lead.campaign_source && lead.campaign_source.toLowerCase().includes(q));
      if (!matchId && !matchName && !matchCompany && !matchEmail && !matchPhone && !matchReq && !matchNotes && !matchAssignee && !matchSource) {
        return false;
      }
    }

    if (statusFilter !== 'all' && lead.status !== statusFilter && lead.lead_status !== statusFilter) {
      return false;
    }

    if (priorityFilter !== 'all' && lead.priority !== priorityFilter) {
      return false;
    }

    if (sourceFilter !== 'all' && lead.source?.toLowerCase() !== sourceFilter.toLowerCase() && lead.campaign_source?.toLowerCase() !== sourceFilter.toLowerCase()) {
      return false;
    }

    if (assignedToFilter !== 'all' && lead.assignedTo?.toLowerCase() !== assignedToFilter.toLowerCase() && lead.assignedSalesUser?.toLowerCase() !== assignedToFilter.toLowerCase()) {
      return false;
    }

    if (managerFilter !== 'all') {
      const mgr = (lead.assignedManagerName || lead.assignedManager || '').toLowerCase();
      if (!mgr.includes(managerFilter.toLowerCase())) return false;
    }

    if (conversionStatusFilter !== 'all') {
      const isConverted = lead.status === 'Converted' || !!lead.opportunityId || !!lead.convertedOpportunityId;
      if (conversionStatusFilter === 'converted' && !isConverted) return false;
      if (conversionStatusFilter === 'unconverted' && isConverted) return false;
    }

    if (temperatureFilter !== 'all' && lead.leadTemperature?.toLowerCase() !== temperatureFilter.toLowerCase()) {
      return false;
    }

    if (followUpStatusFilter !== 'all') {
      const normStatus = (lead.followUpStatus || '').toLowerCase().replace(/[\s-]+/g, '_');
      const normFilter = followUpStatusFilter.toLowerCase().replace(/[\s-]+/g, '_');
      if (normStatus !== normFilter) return false;
    }

    if (followUpDateFilter && followUpDateFilter !== '') {
      if (!lead.nextFollowUpDate && !lead.next_followup_at) return false;
      const fDate = new Date(lead.nextFollowUpDate || lead.next_followup_at).toISOString().split('T')[0];
      if (fDate !== followUpDateFilter) return false;
    }

    if (dateRangeFilter.start) {
      const start = new Date(dateRangeFilter.start).getTime();
      if (new Date(lead.createdAt).getTime() < start) return false;
    }
    if (dateRangeFilter.end) {
      const end = new Date(dateRangeFilter.end).getTime() + (24 * 60 * 60 * 1000 - 1);
      if (new Date(lead.createdAt).getTime() > end) return false;
    }

    if (slaTierFilter !== 'all' && Number(lead.sla_tier || 0) !== Number(slaTierFilter)) {
      return false;
    }

    if (dispositionFilter !== 'all' && lead.disposition_code !== dispositionFilter) {
      return false;
    }

    return true;
  });

  const clearAllFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSourceFilter('all');
    setAssignedToFilter('all');
    setManagerFilter('all');
    setConversionStatusFilter('all');
    setTemperatureFilter('all');
    setFollowUpStatusFilter('all');
    setDateRangeFilter({ start: '', end: '' });
    setFollowUpDateFilter('');
    setSlaTierFilter('all');
    setDispositionFilter('all');
    resetAdvancedFilter();
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    priorityFilter,
    sourceFilter,
    assignedToFilter,
    managerFilter,
    conversionStatusFilter,
    temperatureFilter,
    followUpStatusFilter,
    followUpDateFilter,
    dateRangeFilter,
    slaTierFilter,
    dispositionFilter,
  ]);

  const checkDuplicate = async (leadData) => {
    return await api.checkLeadDuplicate(leadData);
  };

  return (
    <LeadContext.Provider
      value={{
        leads,
        roleScope,
        filteredLeads,
        paginatedLeads,
        totalLeads: filteredLeads.length,
        totalPages,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        stats,
        loading,
        error,
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
        temperatureFilter,
        setTemperatureFilter,
        followUpStatusFilter,
        setFollowUpStatusFilter,
        dateRangeFilter,
        setDateRangeFilter,
        followUpDateFilter,
        setFollowUpDateFilter,
        slaTierFilter,
        setSlaTierFilter,
        dispositionFilter,
        setDispositionFilter,
        clearAllFilters,
        activeTab,
        setActiveTab,
        advancedRules,
        advancedLogic,
        isAdvancedFilterActive,
        filterStats,
        executeAdvancedFilter,
        resetAdvancedFilter,
        fetchLeads,
        fetchStats,
        createLead,
        updateLead,
        updateLeadStatus,
        recordCall,
        scheduleFollowUp,
        updateFollowUp,
        logDisposition,
        claimLead,
        qualifyLead,
        convertLeadToOpportunity,
        deleteLead,
        checkDuplicate,
        // Create / Edit Modal
        isLeadModalOpen,
        modalMode,
        selectedLead,
        openCreateModal,
        openEditModal,
        closeLeadModal,
        // Lead Detail Modal
        isLeadDetailModalOpen,
        leadForDetail,
        leadDetailTab,
        setLeadDetailTab,
        openLeadDetailModal,
        closeLeadDetailModal,
        // Add Call Modal
        isAddCallModalOpen,
        leadForCall,
        openAddCallModal,
        closeAddCallModal,
        // Schedule Follow-Up Modal
        isScheduleFollowUpModalOpen,
        leadForFollowUp,
        openScheduleFollowUpModal,
        closeScheduleFollowUpModal,
        // Qualify Lead Modal
        isQualifyModalOpen,
        leadToQualify,
        openQualifyModal,
        closeQualifyModal,
        // Convert Modal
        isConvertModalOpen,
        leadToConvert,
        openConvertModal,
        closeConvertModal,
        updateLeadOpportunityStage,
        // Delete Modal
        isDeleteModalOpen,
        leadToDelete,
        openDeleteModal,
        closeDeleteModal,
        // Disposition Modal
        isDispositionModalOpen,
        leadForDisposition,
        openDispositionModal,
        closeDispositionModal,
        // Audit Modal
        isAuditModalOpen,
        leadForAudit,
        openAuditModal,
        closeAuditModal,
        // Import & Export Modals & APIs
        isImportModalOpen,
        setIsImportModalOpen,
        openImportModal,
        closeImportModal,
        isExportModalOpen,
        setIsExportModalOpen,
        openExportModal,
        closeExportModal,
        previewLeadExcel,
        importLeadExcel,
        downloadLeadExcelTemplate,
      }}
    >
      {children}
    </LeadContext.Provider>
  );
};

export const useLeads = () => {
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error('useLeads must be used within a LeadProvider');
  }
  return context;
};

export default LeadContext;
