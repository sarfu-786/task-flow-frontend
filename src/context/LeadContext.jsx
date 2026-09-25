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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal States
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedLead, setSelectedLead] = useState(null);

  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);

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

      const unsubscribe = socketService.on('leads:updated', () => {
        fetchLeads(true);
        fetchStats();
      });

      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
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

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      const matchName = lead.name && lead.name.toLowerCase().includes(q);
      const matchCompany = lead.company && lead.company.toLowerCase().includes(q);
      const matchEmail = lead.email && lead.email.toLowerCase().includes(q);
      const matchPhone = lead.phone && lead.phone.toLowerCase().includes(q);
      const matchNotes = lead.notes && lead.notes.toLowerCase().includes(q);
      const matchAssignee = lead.assignedTo && lead.assignedTo.toLowerCase().includes(q);
      const matchSource = lead.source && lead.source.toLowerCase().includes(q);
      if (!matchName && !matchCompany && !matchEmail && !matchPhone && !matchNotes && !matchAssignee && !matchSource) {
        return false;
      }
    }

    if (statusFilter !== 'all' && lead.status !== statusFilter) {
      return false;
    }

    if (priorityFilter !== 'all' && lead.priority !== priorityFilter) {
      return false;
    }

    if (sourceFilter !== 'all' && lead.source?.toLowerCase() !== sourceFilter.toLowerCase()) {
      return false;
    }

    if (assignedToFilter !== 'all' && lead.assignedTo?.toLowerCase() !== assignedToFilter.toLowerCase()) {
      return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, priorityFilter, sourceFilter, assignedToFilter]);

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
        fetchLeads,
        fetchStats,
        createLead,
        updateLead,
        updateLeadStatus,
        convertLeadToOpportunity,
        deleteLead,
        isLeadModalOpen,
        modalMode,
        selectedLead,
        openCreateModal,
        openEditModal,
        closeLeadModal,
        isConvertModalOpen,
        leadToConvert,
        openConvertModal,
        closeConvertModal,
        isDeleteModalOpen,
        leadToDelete,
        openDeleteModal,
        closeDeleteModal,
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
