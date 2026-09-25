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

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [slaFilter, setSlaFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const resetFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setSlaFilter('all');
    setAssignedFilter('all');
    setCurrentPage(1);
  }, []);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const fetchComplaints = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await complaintApi.getComplaints({ limit: 1000 });
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

  // Compute dynamic filtered complaints matching search and filters
  const filteredComplaints = useMemo(() => {
    return allComplaints.filter((c) => {
      if (!c) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
      if (slaFilter !== 'all' && c.slaStatus !== slaFilter) return false;
      if (assignedFilter !== 'all' && (c.assignedToName || '').toLowerCase() !== assignedFilter.toLowerCase()) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchTicket = (c.ticketNumber || '').toLowerCase().includes(q);
        const matchCustomer = (c.customerName || '').toLowerCase().includes(q);
        const matchOrg = (c.organization || '').toLowerCase().includes(q);
        const matchSubject = (c.subject || '').toLowerCase().includes(q);
        const matchDesc = (c.description || '').toLowerCase().includes(q);
        const matchAssignee = (c.assignedToName || '').toLowerCase().includes(q);
        const matchCategory = (c.category || '').toLowerCase().includes(q);
        if (!matchTicket && !matchCustomer && !matchOrg && !matchSubject && !matchDesc && !matchAssignee && !matchCategory) {
          return false;
        }
      }
      return true;
    });
  }, [allComplaints, statusFilter, categoryFilter, priorityFilter, slaFilter, assignedFilter, search]);

  const totalItems = filteredComplaints.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedComplaints = filteredComplaints.slice(startIndex, startIndex + itemsPerPage);

  // Live stats from all organization complaints
  const stats = useMemo(() => {
    return {
      total: allComplaints.length,
      logged: allComplaints.filter((c) => c.status === 'Logged').length,
      inProgress: allComplaints.filter((c) => ['Under Investigation', 'In Progress', 'Awaiting Customer'].includes(c.status)).length,
      resolved: allComplaints.filter((c) => ['Resolved', 'Closed'].includes(c.status)).length,
      slaBreached: allComplaints.filter((c) => c.slaStatus === 'Breached').length,
      slaAtRisk: allComplaints.filter((c) => c.slaStatus === 'At Risk').length,
      slaMet: allComplaints.filter((c) => c.slaStatus === 'Met').length,
      urgent: allComplaints.filter((c) => c.priority === 'Urgent' && !['Resolved', 'Closed'].includes(c.status)).length,
    };
  }, [allComplaints]);

  // Socket listener for real-time ticket events
  useEffect(() => {
    const unsub1 = socketService.on('complaint_created', () => fetchComplaints());
    const unsub2 = socketService.on('complaint_updated', () => fetchComplaints());
    const unsub3 = socketService.on('complaint_resolved', () => fetchComplaints());
    const unsub4 = socketService.on('complaint_deleted', () => fetchComplaints());

    return () => {
      if (unsub1) unsub1();
      if (unsub2) unsub2();
      if (unsub3) unsub3();
      if (unsub4) unsub4();
    };
  }, [fetchComplaints]);

  const createComplaint = async (data) => {
    try {
      setLoading(true);
      const res = await complaintApi.createComplaint(data);
      if (res && res.success) {
        await fetchComplaints();
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
        await fetchComplaints();
        setIsEditModalOpen(false);
        setSelectedComplaint(null);
        return res.complaint;
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
        await fetchComplaints();
        setIsResolveModalOpen(false);
        setSelectedComplaint(null);
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
        await fetchComplaints();
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
        await fetchComplaints();
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
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        categoryFilter,
        setCategoryFilter,
        priorityFilter,
        setPriorityFilter,
        slaFilter,
        setSlaFilter,
        assignedFilter,
        setAssignedFilter,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        setItemsPerPage,
        resetFilters,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        isResolveModalOpen,
        setIsResolveModalOpen,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        selectedComplaint,
        setSelectedComplaint,
        fetchComplaints,
        createComplaint,
        updateComplaint,
        updateComplaintStatus,
        resolveComplaint,
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
