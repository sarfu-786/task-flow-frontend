import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { complaintApi } from '../services/api';
import { socketService } from '../services/socket';

const ComplaintContext = createContext(null);

export const ComplaintProvider = ({ children }) => {
  const [allComplaints, setAllComplaints] = useState(() => {
    try {
      const cached = localStorage.getItem('taskflow_cached_complaints');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [moduleDisabled, setModuleDisabled] = useState(false);

  // Filters & State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [slaFilter, setSlaFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [metricFilter, setMetricFilterState] = useState('total'); // 'total' | 'urgent' | 'sla_risk' | 'resolved' | 'escalated' | 'critical'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const setMetricFilter = useCallback((filter) => {
    setMetricFilterState(filter);
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setSearch('');
    setMetricFilterState('total');
    setStatusFilter('all');
    setCategoryFilter('all');
    setSubCategoryFilter('all');
    setPriorityFilter('all');
    setSeverityFilter('all');
    setSlaFilter('all');
    setAssignedFilter('all');
    setTeamFilter('all');
    setCurrentPage(1);
  }, []);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const fetchComplaints = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await complaintApi.getComplaints({ limit: 2000 });
      if (res && res.success) {
        setAllComplaints(res.complaints || []);
        try {
          localStorage.setItem('taskflow_cached_complaints', JSON.stringify(res.complaints || []));
        } catch {}
        setModuleDisabled(false);
      }
    } catch (err) {
      if (err.moduleDisabled) {
        setModuleDisabled(true);
      }
      if (!silent) setError(err.message || 'Failed to load complaints');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints(true);
  }, [fetchComplaints]);

  // Compute dynamic filtered complaints matching search, metric cards, and filters
  const filteredComplaints = useMemo(() => {
    return allComplaints.filter((c) => {
      if (!c) return false;

      // Metric Card Quick Filter
      if (metricFilter === 'urgent') {
        if (c.priority !== 'Urgent' || ['Resolved', 'Closed'].includes(c.status)) return false;
      } else if (metricFilter === 'sla_risk') {
        if (!['Breached', 'At Risk'].includes(c.slaStatus)) return false;
      } else if (metricFilter === 'resolved') {
        if (!['Resolved', 'Closed'].includes(c.status)) return false;
      } else if (metricFilter === 'escalated') {
        if (c.status !== 'Escalated' && !c.isEscalated) return false;
      } else if (metricFilter === 'critical') {
        if (c.severity !== 'Critical' && c.priority !== 'Urgent') return false;
      }

      // Dropdown & Search Filters
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (subCategoryFilter !== 'all' && c.subCategory !== subCategoryFilter) return false;
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
      if (severityFilter !== 'all' && c.severity !== severityFilter) return false;
      if (slaFilter !== 'all' && c.slaStatus !== slaFilter) return false;
      if (assignedFilter !== 'all' && (c.assignedToName || '').toLowerCase() !== assignedFilter.toLowerCase()) return false;
      if (teamFilter !== 'all' && (c.team || '').toLowerCase() !== teamFilter.toLowerCase()) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchTicket = (c.ticketNumber || '').toLowerCase().includes(q);
        const matchId = (c.complaintId || '').toLowerCase().includes(q);
        const matchCustomer = (c.customerName || '').toLowerCase().includes(q);
        const matchOrg = (c.organization || '').toLowerCase().includes(q) || (c.account || '').toLowerCase().includes(q);
        const matchEmail = (c.customerEmail || '').toLowerCase().includes(q);
        const matchPhone = (c.customerPhone || '').toLowerCase().includes(q);
        const matchSubject = (c.subject || '').toLowerCase().includes(q);
        const matchDesc = (c.description || '').toLowerCase().includes(q);
        const matchAssignee = (c.assignedToName || '').toLowerCase().includes(q);
        const matchCategory = (c.category || '').toLowerCase().includes(q);
        const matchProd = (c.productOrService || '').toLowerCase().includes(q);

        if (!matchTicket && !matchId && !matchCustomer && !matchOrg && !matchEmail && !matchPhone && !matchSubject && !matchDesc && !matchAssignee && !matchCategory && !matchProd) {
          return false;
        }
      }
      return true;
    });
  }, [
    allComplaints,
    metricFilter,
    statusFilter,
    categoryFilter,
    subCategoryFilter,
    priorityFilter,
    severityFilter,
    slaFilter,
    assignedFilter,
    teamFilter,
    search,
  ]);

  const totalItems = filteredComplaints.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedComplaints = filteredComplaints.slice(startIndex, startIndex + itemsPerPage);

  // Live stats computed from all authorized complaints
  const stats = useMemo(() => {
    const total = allComplaints.length;
    const logged = allComplaints.filter((c) => c.status === 'Logged').length;
    const inProgress = allComplaints.filter((c) => ['Under Investigation', 'Assigned', 'In Progress', 'Awaiting Customer', 'Reopened'].includes(c.status)).length;
    const resolved = allComplaints.filter((c) => ['Resolved', 'Closed'].includes(c.status)).length;
    const slaBreached = allComplaints.filter((c) => c.slaStatus === 'Breached').length;
    const slaAtRisk = allComplaints.filter((c) => c.slaStatus === 'At Risk').length;
    const slaMet = allComplaints.filter((c) => c.slaStatus === 'Met').length;
    const urgent = allComplaints.filter((c) => c.priority === 'Urgent' && !['Resolved', 'Closed'].includes(c.status)).length;
    const escalated = allComplaints.filter((c) => c.status === 'Escalated' || c.isEscalated).length;
    const critical = allComplaints.filter((c) => c.severity === 'Critical' && !['Resolved', 'Closed'].includes(c.status)).length;

    return {
      total,
      logged,
      inProgress,
      resolved,
      slaBreached,
      slaAtRisk,
      slaMet,
      urgent,
      escalated,
      critical,
    };
  }, [allComplaints]);

  // Socket listener for real-time ticket events
  useEffect(() => {
    const unsub1 = socketService.on('complaint_created', () => fetchComplaints(true));
    const unsub2 = socketService.on('complaint_updated', () => fetchComplaints(true));
    const unsub3 = socketService.on('complaint_resolved', () => fetchComplaints(true));
    const unsub4 = socketService.on('complaint_deleted', () => fetchComplaints(true));

    return () => {
      if (unsub1) unsub1();
      if (unsub2) unsub2();
      if (unsub3) unsub3();
      if (unsub4) unsub4();
    };
  }, [fetchComplaints]);

  // CRUD & Workflow Operations
  const createComplaint = async (data) => {
    try {
      setLoading(true);
      const res = await complaintApi.createComplaint(data);
      if (res && res.success) {
        await fetchComplaints(true);
        setIsCreateModalOpen(false);
        return res.complaint;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateComplaint = async (id, data) => {
    try {
      setLoading(true);
      const res = await complaintApi.updateComplaint(id, data);
      if (res && res.success) {
        await fetchComplaints(true);
        setIsEditModalOpen(false);
        if (selectedComplaint && selectedComplaint._id === id) {
          setSelectedComplaint(res.complaint);
        }
        return res.complaint;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const assignComplaint = async (id, assignData) => {
    try {
      setLoading(true);
      const res = await complaintApi.assignComplaint(id, assignData);
      if (res && res.success) {
        await fetchComplaints(true);
        setIsReassignModalOpen(false);
        if (selectedComplaint && selectedComplaint._id === id) {
          setSelectedComplaint(res.complaint);
        }
        return res.complaint;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const escalateComplaint = async (id, escalateData) => {
    try {
      setLoading(true);
      const res = await complaintApi.escalateComplaint(id, escalateData);
      if (res && res.success) {
        await fetchComplaints(true);
        setIsEscalateModalOpen(false);
        if (selectedComplaint && selectedComplaint._id === id) {
          setSelectedComplaint(res.complaint);
        }
        return res.complaint;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const investigateComplaint = async (id, investigateData) => {
    try {
      setLoading(true);
      const res = await complaintApi.investigateComplaint(id, investigateData);
      if (res && res.success) {
        await fetchComplaints(true);
        if (selectedComplaint && selectedComplaint._id === id) {
          setSelectedComplaint(res.complaint);
        }
        return res.complaint;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addActivity = async (id, activityData) => {
    try {
      setLoading(true);
      const res = await complaintApi.addComplaintActivity(id, activityData);
      if (res && res.success) {
        await fetchComplaints(true);
        setIsActivityModalOpen(false);
        if (selectedComplaint && selectedComplaint._id === id) {
          setSelectedComplaint(res.complaint);
        }
        return res.activity;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resolveComplaint = async (id, resolveData) => {
    try {
      setLoading(true);
      const res = await complaintApi.resolveComplaint(id, resolveData);
      if (res && res.success) {
        await fetchComplaints(true);
        setIsResolveModalOpen(false);
        if (selectedComplaint && selectedComplaint._id === id) {
          setSelectedComplaint(res.complaint);
        }
        return res.complaint;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const closeComplaint = async (id, closeData) => {
    try {
      setLoading(true);
      const res = await complaintApi.closeComplaint(id, closeData);
      if (res && res.success) {
        await fetchComplaints(true);
        if (selectedComplaint && selectedComplaint._id === id) {
          setSelectedComplaint(res.complaint);
        }
        return res.complaint;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reopenComplaint = async (id, reopenData) => {
    try {
      setLoading(true);
      const res = await complaintApi.reopenComplaint(id, reopenData);
      if (res && res.success) {
        await fetchComplaints(true);
        setIsReopenModalOpen(false);
        if (selectedComplaint && selectedComplaint._id === id) {
          setSelectedComplaint(res.complaint);
        }
        return res.complaint;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const linkComplaint = async (id, linkData) => {
    try {
      setLoading(true);
      const res = await complaintApi.linkComplaint(id, linkData);
      if (res && res.success) {
        await fetchComplaints(true);
        if (selectedComplaint && selectedComplaint._id === id) {
          setSelectedComplaint(res.complaint);
        }
        return res.complaint;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (id, newStatus) => {
    try {
      setLoading(true);
      const res = await complaintApi.updateComplaint(id, { status: newStatus });
      if (res && res.success) {
        await fetchComplaints(true);
        if (selectedComplaint && selectedComplaint._id === id) {
          setSelectedComplaint(res.complaint);
        }
        return res.complaint;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteComplaint = async (id) => {
    try {
      setLoading(true);
      const res = await complaintApi.deleteComplaint(id);
      if (res && res.success) {
        await fetchComplaints(true);
        setIsDeleteModalOpen(false);
        setSelectedComplaint(null);
        return true;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComplaintContext.Provider
      value={{
        complaints: paginatedComplaints,
        allComplaints,
        filteredComplaints,
        stats,
        loading,
        error,
        moduleDisabled,
        metricFilter,
        setMetricFilter,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        categoryFilter,
        setCategoryFilter,
        subCategoryFilter,
        setSubCategoryFilter,
        priorityFilter,
        setPriorityFilter,
        severityFilter,
        setSeverityFilter,
        slaFilter,
        setSlaFilter,
        assignedFilter,
        setAssignedFilter,
        teamFilter,
        setTeamFilter,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        setItemsPerPage,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        resetFilters,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        isResolveModalOpen,
        setIsResolveModalOpen,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        isReassignModalOpen,
        setIsReassignModalOpen,
        isEscalateModalOpen,
        setIsEscalateModalOpen,
        isActivityModalOpen,
        setIsActivityModalOpen,
        isReopenModalOpen,
        setIsReopenModalOpen,
        selectedComplaint,
        setSelectedComplaint,
        fetchComplaints,
        createComplaint,
        updateComplaint,
        assignComplaint,
        escalateComplaint,
        investigateComplaint,
        addActivity,
        resolveComplaint,
        closeComplaint,
        reopenComplaint,
        linkComplaint,
        updateComplaintStatus,
        deleteComplaint,
      }}
    >
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaints = () => {
  const context = useContext(ComplaintContext);
  if (!context) {
    throw new Error('useComplaints must be used within a ComplaintProvider');
  }
  return context;
};

export default ComplaintContext;
