import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { socketService } from '../services/socket';

const OpportunityContext = createContext(null);

export const STAGES = [
  'New Opportunity',
  'Contacted',
  'Requirement Understanding',
  'Proposal / Quotation',
  'Negotiation',
  'Won',
  'Lost',
];

export const LOST_REASONS = [
  'Price too high',
  'Competitor selected',
  'Budget unavailable',
  'Requirement changed',
  'Not interested',
  'Other',
];

export const normalizeStage = (stage) => {
  if (!stage) return 'New Opportunity';
  if (stage === 'Qualification') return 'New Opportunity';
  if (stage === 'Needs Analysis') return 'Requirement Understanding';
  if (stage === 'Proposal' || stage === 'Proposal/Quotation') return 'Proposal / Quotation';
  if (stage === 'Closed Won') return 'Won';
  if (stage === 'Closed Lost') return 'Lost';
  return stage;
};

export const OpportunityProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const [opportunities, setOpportunities] = useState(() => {
    try {
      const cached = localStorage.getItem('taskflow_cached_opps');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [stats, setStats] = useState(() => {
    try {
      const cached = localStorage.getItem('taskflow_cached_opp_stats');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('taskflow_opp_view_mode') || 'kanban';
    } catch {
      return 'kanban';
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtering & Pagination State
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal States
  const [isOpportunityModalOpen, setIsOpportunityModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [opportunityToDelete, setOpportunityToDelete] = useState(null);

  // Lost Reason Modal State
  const [isLostReasonModalOpen, setIsLostReasonModalOpen] = useState(false);
  const [opportunityToMarkLost, setOpportunityToMarkLost] = useState(null);

  // Toggle View Mode
  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('taskflow_opp_view_mode', mode);
    } catch {}
  };

  // Fetch opportunities
  const fetchOpportunities = useCallback(async (silent = false) => {
    if (!isAuthenticated) return;
    if (!silent) setLoading(true);
    setError('');
    try {
      const isManagerOrAdmin = user && ['Super Admin', 'Manager', 'Executive', 'Administrator'].includes(user.role);
      const res = await api.getOpportunities({
        myOpportunitiesOnly: !isManagerOrAdmin,
      });
      if (res.success) {
        setOpportunities(res.opportunities);
        try {
          localStorage.setItem('taskflow_cached_opps', JSON.stringify(res.opportunities));
        } catch {}
      }
    } catch (err) {
      console.error('Fetch opportunities error:', err);
      if (!silent) setError(err.message || 'Failed to load opportunities');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getOpportunityStats();
      if (res.success) {
        setStats(res.stats);
        try {
          localStorage.setItem('taskflow_cached_opp_stats', JSON.stringify(res.stats));
        } catch {}
      }
    } catch (err) {
      console.error('Fetch opportunity stats error:', err);
    }
  }, [isAuthenticated]);

  // Initial load and socket listeners
  useEffect(() => {
    if (isAuthenticated) {
      fetchOpportunities();
      fetchStats();

      const unsubscribe = socketService.on('opportunities:updated', () => {
        fetchOpportunities(true);
        fetchStats();
      });

      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    }
  }, [isAuthenticated, fetchOpportunities, fetchStats]);

  // Create Opportunity
  const createOpportunity = async (oppData) => {
    try {
      const res = await api.createOpportunity(oppData);
      if (res.success) {
        await fetchOpportunities(true);
        await fetchStats();
        closeOpportunityModal();
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  // Update Opportunity
  const updateOpportunity = async (id, oppData) => {
    try {
      const res = await api.updateOpportunity(id, oppData);
      if (res.success) {
        await fetchOpportunities(true);
        await fetchStats();
        closeOpportunityModal();
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  // Quick Stage Update (for Kanban drag-drop or stage button clicks)
  const updateOpportunityStage = async (id, stage, probability, lostReason = '', lostReasonDetails = '') => {
    try {
      const res = await api.updateOpportunityStage(id, stage, probability, lostReason, lostReasonDetails);
      if (res.success) {
        setOpportunities((prev) =>
          prev.map((o) =>
            o._id.toString() === id.toString()
              ? {
                  ...o,
                  stage,
                  probability: probability !== undefined && probability !== null ? probability : o.probability,
                  lostReason: stage === 'Lost' || stage === 'Closed Lost' ? (lostReason || o.lostReason) : '',
                  lostReasonDetails: stage === 'Lost' || stage === 'Closed Lost' ? (lostReasonDetails || o.lostReasonDetails) : '',
                }
              : o
          )
        );
        await fetchStats();
        return res;
      }
    } catch (err) {
      console.error('Failed to update stage:', err);
      throw err;
    }
  };

  // Delete Opportunity
  const deleteOpportunity = async (id) => {
    try {
      const res = await api.deleteOpportunity(id);
      if (res.success) {
        setOpportunities((prev) => prev.filter((o) => o._id.toString() !== id.toString()));
        await fetchStats();
        closeDeleteModal();
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  // Modal Handlers
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedOpportunity(null);
    setIsOpportunityModalOpen(true);
  };

  const openEditModal = (opp) => {
    setModalMode('edit');
    setSelectedOpportunity(opp);
    setIsOpportunityModalOpen(true);
  };

  const closeOpportunityModal = () => {
    setIsOpportunityModalOpen(false);
    setSelectedOpportunity(null);
  };

  const openDeleteModal = (opp) => {
    setOpportunityToDelete(opp);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setOpportunityToDelete(null);
  };

  // Lost Reason Modal Handlers
  const openLostReasonModal = (opp) => {
    setOpportunityToMarkLost(opp);
    setIsLostReasonModalOpen(true);
  };

  const closeLostReasonModal = () => {
    setIsLostReasonModalOpen(false);
    setOpportunityToMarkLost(null);
  };

  const submitMarkLost = async (lostReason, lostReasonDetails) => {
    if (!opportunityToMarkLost) return;
    try {
      await updateOpportunityStage(opportunityToMarkLost._id, 'Lost', 0, lostReason, lostReasonDetails);
      closeLostReasonModal();
    } catch (err) {
      throw err;
    }
  };

  // Filtered Opportunities
  const filteredOpportunities = opportunities.filter((opp) => {
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      const matchName = opp.name && opp.name.toLowerCase().includes(q);
      const matchCompany = opp.company && opp.company.toLowerCase().includes(q);
      const matchContact = opp.contactPerson && opp.contactPerson.toLowerCase().includes(q);
      const matchEmail = opp.email && opp.email.toLowerCase().includes(q);
      const matchPhone = opp.phone && opp.phone.toLowerCase().includes(q);
      const matchLeadId = (opp.originalLeadId || opp.leadId) && (opp.originalLeadId || opp.leadId).toLowerCase().includes(q);
      const matchLead = opp.relatedLeadName && opp.relatedLeadName.toLowerCase().includes(q);
      const matchNotes = opp.notes && opp.notes.toLowerCase().includes(q);
      const matchReason = opp.lostReason && opp.lostReason.toLowerCase().includes(q);
      const matchAssignee = opp.assignedTo && opp.assignedTo.toLowerCase().includes(q);
      if (
        !matchName &&
        !matchCompany &&
        !matchContact &&
        !matchEmail &&
        !matchPhone &&
        !matchLeadId &&
        !matchLead &&
        !matchNotes &&
        !matchReason &&
        !matchAssignee
      ) {
        return false;
      }
    }

    const currentNormalized = normalizeStage(opp.stage);
    if (stageFilter !== 'all') {
      if (opp.stage !== stageFilter && currentNormalized !== stageFilter) {
        return false;
      }
    }

    if (priorityFilter !== 'all' && opp.priority !== priorityFilter) {
      return false;
    }

    if (assignedToFilter !== 'all' && opp.assignedTo?.toLowerCase() !== assignedToFilter.toLowerCase()) {
      return false;
    }

    return true;
  });

  // Table pagination
  const totalPages = Math.ceil(filteredOpportunities.length / itemsPerPage) || 1;
  const paginatedOpportunities = filteredOpportunities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Grouped by stage for Kanban Pipeline
  const kanbanColumns = STAGES.reduce((acc, stage) => {
    const deals = filteredOpportunities.filter((o) => normalizeStage(o.stage) === stage);
    const totalValue = deals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    acc[stage] = {
      stage,
      deals,
      count: deals.length,
      totalValue,
    };
    return acc;
  }, {});

  useEffect(() => {
    setCurrentPage(1);
  }, [search, stageFilter, priorityFilter, assignedToFilter]);

  return (
    <OpportunityContext.Provider
      value={{
        opportunities,
        filteredOpportunities,
        paginatedOpportunities,
        kanbanColumns,
        totalOpportunities: filteredOpportunities.length,
        totalPages,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        stats,
        viewMode,
        setViewMode: handleSetViewMode,
        loading,
        error,
        search,
        setSearch,
        stageFilter,
        setStageFilter,
        priorityFilter,
        setPriorityFilter,
        assignedToFilter,
        setAssignedToFilter,
        fetchOpportunities,
        fetchStats,
        createOpportunity,
        updateOpportunity,
        updateOpportunityStage,
        deleteOpportunity,
        isOpportunityModalOpen,
        modalMode,
        selectedOpportunity,
        openCreateModal,
        openEditModal,
        closeOpportunityModal,
        isDeleteModalOpen,
        opportunityToDelete,
        openDeleteModal,
        closeDeleteModal,
        isLostReasonModalOpen,
        opportunityToMarkLost,
        openLostReasonModal,
        closeLostReasonModal,
        submitMarkLost,
      }}
    >
      {children}
    </OpportunityContext.Provider>
  );
};

export const useOpportunities = () => {
  const context = useContext(OpportunityContext);
  if (!context) {
    throw new Error('useOpportunities must be used within an OpportunityProvider');
  }
  return context;
};
