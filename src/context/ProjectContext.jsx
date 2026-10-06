import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectApi } from '../services/api';
import { socketService } from '../services/socket';

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState(() => {
    try {
      const cached = localStorage.getItem('taskflow_cached_projects');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [stats, setStats] = useState(() => {
    try {
      const cached = localStorage.getItem('taskflow_cached_project_stats');
      return cached
        ? JSON.parse(cached)
        : {
            total: 0,
            planning: 0,
            inProgress: 0,
            completed: 0,
            onHold: 0,
            totalBudget: 0,
            avgProgress: 0,
          };
    } catch {
      return {
        total: 0,
        planning: 0,
        inProgress: 0,
        completed: 0,
        onHold: 0,
        totalBudget: 0,
        avgProgress: 0,
      };
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [moduleDisabled, setModuleDisabled] = useState(false);

  // Active View Mode: 'table' | 'gantt' | 'kanban' | 'workload' | 'mis' | 'reports'
  const [viewMode, setViewMode] = useState('table');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Templates
  const [templates, setTemplates] = useState([]);

  // MIS Analytics
  const [misStats, setMisStats] = useState(null);
  const [misLoading, setMisLoading] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMilestonesModalOpen, setIsMilestonesModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isTimesheetModalOpen, setIsTimesheetModalOpen] = useState(false);

  // Selected Entities
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectForDetail, setProjectForDetail] = useState(null);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [projectForMilestones, setProjectForMilestones] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [targetProjectForSubEntity, setTargetProjectForSubEntity] = useState(null);

  const fetchProjects = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        setError(null);
        const res = await projectApi.getProjects({
          search,
          status: statusFilter,
          priority: priorityFilter,
          category: categoryFilter,
          manager: managerFilter,
          dateFilter,
          page: currentPage,
          limit: itemsPerPage,
        });

        if (res && res.success) {
          setProjects(res.projects || []);
          try {
            localStorage.setItem('taskflow_cached_projects', JSON.stringify(res.projects || []));
          } catch {}
          if (res.stats) {
            setStats(res.stats);
            try {
              localStorage.setItem('taskflow_cached_project_stats', JSON.stringify(res.stats));
            } catch {}
          }
          if (res.pagination) {
            setTotalPages(res.pagination.totalPages || 1);
            setTotalItems(res.pagination.total || 0);
          }
          setModuleDisabled(false);

          // Update active detail project if open
          setProjectForDetail((prev) => {
            if (!prev) return null;
            const updated = (res.projects || []).find((p) => p._id === prev._id);
            return updated || prev;
          });
        }
      } catch (err) {
        if (err.moduleDisabled) {
          setModuleDisabled(true);
        }
        if (!silent) setError(err.message || 'Failed to load projects');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [search, statusFilter, priorityFilter, categoryFilter, managerFilter, dateFilter, currentPage]
  );

  const fetchMISStats = useCallback(async () => {
    try {
      setMisLoading(true);
      const res = await projectApi.getProjectMISStats();
      if (res && res.success) {
        setMisStats(res);
      }
    } catch (err) {
      console.error('[Fetch MIS Stats Error]', err);
    } finally {
      setMisLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await projectApi.getProjectTemplates();
      if (res && res.success) {
        setTemplates(res.templates || []);
      }
    } catch (err) {
      console.error('[Fetch Templates Error]', err);
    }
  }, []);

  useEffect(() => {
    fetchProjects(true);
    fetchTemplates();
  }, [fetchProjects, fetchTemplates]);

  // Socket listener for real-time project events
  useEffect(() => {
    const unsub1 = socketService.on('project_created', () => {
      fetchProjects(true);
      if (viewMode === 'mis') fetchMISStats();
    });
    const unsub2 = socketService.on('project_updated', () => {
      fetchProjects(true);
      if (viewMode === 'mis') fetchMISStats();
    });
    const unsub3 = socketService.on('project_deleted', () => {
      fetchProjects(true);
      if (viewMode === 'mis') fetchMISStats();
    });

    return () => {
      if (unsub1) unsub1();
      if (unsub2) unsub2();
      if (unsub3) unsub3();
    };
  }, [fetchProjects, fetchMISStats, viewMode]);

  const createProject = async (data) => {
    try {
      setLoading(true);
      const res = await projectApi.createProject(data);
      if (res && res.success) {
        await fetchProjects();
        setIsCreateModalOpen(false);
        return res.project;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (id, data) => {
    try {
      setLoading(true);
      const res = await projectApi.updateProject(id, data);
      if (res && res.success) {
        await fetchProjects();
        setIsEditModalOpen(false);
        setSelectedProject(null);
        if (projectForDetail && projectForDetail._id === id) {
          setProjectForDetail(res.project);
        }
        return res.project;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProjectStatus = async (id, status, remarks = '') => {
    try {
      setLoading(true);
      const res = await projectApi.updateProjectStatus(id, status, remarks);
      if (res && res.success) {
        await fetchProjects();
        if (projectForDetail && projectForDetail._id === id) {
          setProjectForDetail(res.project);
        }
        return res.project;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleMilestone = async (projectId, milestoneIndex) => {
    try {
      const res = await projectApi.toggleMilestone(projectId, milestoneIndex);
      if (res && res.success) {
        await fetchProjects(true);
        if (selectedProject && selectedProject._id === projectId) {
          setSelectedProject(res.project);
        }
        if (projectForDetail && projectForDetail._id === projectId) {
          setProjectForDetail(res.project);
        }
        return res.project;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteProject = async (id) => {
    try {
      setLoading(true);
      const res = await projectApi.deleteProject(id);
      if (res && res.success) {
        await fetchProjects();
        setIsDeleteModalOpen(false);
        setSelectedProject(null);
        if (projectForDetail && projectForDetail._id === id) {
          setIsDetailModalOpen(false);
          setProjectForDetail(null);
        }
        return true;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sub-entity Actions
  const createTask = async (projectId, taskData) => {
    try {
      const res = await projectApi.createProjectTask(projectId, taskData);
      if (res && res.success) {
        await fetchProjects(true);
        if (projectForDetail && projectForDetail._id === projectId) {
          setProjectForDetail(res.project);
        }
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  const updateTaskStatus = async (projectId, taskId, status, progress) => {
    try {
      const res = await projectApi.updateProjectTaskStatus(projectId, taskId, status, progress);
      if (res && res.success) {
        await fetchProjects(true);
        if (projectForDetail && projectForDetail._id === projectId) {
          setProjectForDetail(res.project);
        }
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  const createIssue = async (projectId, issueData) => {
    try {
      const res = await projectApi.createProjectIssue(projectId, issueData);
      if (res && res.success) {
        await fetchProjects(true);
        if (projectForDetail && projectForDetail._id === projectId) {
          setProjectForDetail(res.project);
        }
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  const updateIssueStatus = async (projectId, issueId, status, resolution) => {
    try {
      const res = await projectApi.updateProjectIssueStatus(projectId, issueId, status, resolution);
      if (res && res.success) {
        await fetchProjects(true);
        if (projectForDetail && projectForDetail._id === projectId) {
          setProjectForDetail(res.project);
        }
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  const createRisk = async (projectId, riskData) => {
    try {
      const res = await projectApi.createProjectRisk(projectId, riskData);
      if (res && res.success) {
        await fetchProjects(true);
        if (projectForDetail && projectForDetail._id === projectId) {
          setProjectForDetail(res.project);
        }
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  const logTimesheet = async (projectId, timesheetData) => {
    try {
      const res = await projectApi.createTimesheet(projectId, timesheetData);
      if (res && res.success) {
        await fetchProjects(true);
        if (projectForDetail && projectForDetail._id === projectId) {
          setProjectForDetail(res.project);
        }
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  const updateTimesheetStatus = async (projectId, timesheetId, status, rejectionReason) => {
    try {
      const res = await projectApi.updateTimesheetStatus(projectId, timesheetId, status, rejectionReason);
      if (res && res.success) {
        await fetchProjects(true);
        if (projectForDetail && projectForDetail._id === projectId) {
          setProjectForDetail(res.project);
        }
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  const addComment = async (projectId, commentData) => {
    try {
      const res = await projectApi.addProjectComment(projectId, commentData);
      if (res && res.success) {
        await fetchProjects(true);
        if (projectForDetail && projectForDetail._id === projectId) {
          setProjectForDetail(res.project);
        }
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  // Modal helpers
  const openCreateModal = () => {
    setProjectToEdit(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setProjectToEdit(null);
  };

  const openEditModal = (p) => {
    setProjectToEdit(p);
    setSelectedProject(p);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setProjectToEdit(null);
  };

  const openMilestonesModal = (p) => {
    setProjectForMilestones(p);
    setSelectedProject(p);
    setIsMilestonesModalOpen(true);
  };

  const closeMilestonesModal = () => {
    setIsMilestonesModalOpen(false);
    setProjectForMilestones(null);
  };

  const openDeleteModal = (p) => {
    setProjectToDelete(p);
    setSelectedProject(p);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setProjectToDelete(null);
  };

  const openDetailModal = (p) => {
    setProjectForDetail(p);
    setSelectedProject(p);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setProjectForDetail(null);
  };

  const openTaskModal = (p) => {
    setTargetProjectForSubEntity(p || projectForDetail || projects[0]);
    setIsTaskModalOpen(true);
  };

  const openIssueModal = (p) => {
    setTargetProjectForSubEntity(p || projectForDetail || projects[0]);
    setIsIssueModalOpen(true);
  };

  const openRiskModal = (p) => {
    setTargetProjectForSubEntity(p || projectForDetail || projects[0]);
    setIsRiskModalOpen(true);
  };

  const openTimesheetModal = (p) => {
    setTargetProjectForSubEntity(p || projectForDetail || projects[0]);
    setIsTimesheetModalOpen(true);
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        stats,
        loading,
        error,
        moduleDisabled,
        viewMode,
        setViewMode,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        priorityFilter,
        setPriorityFilter,
        categoryFilter,
        setCategoryFilter,
        managerFilter,
        setManagerFilter,
        dateFilter,
        setDateFilter,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        templates,
        misStats,
        fetchMISStats,
        fetchMisStats: fetchMISStats,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        isMilestonesModalOpen,
        setIsMilestonesModalOpen,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        isDetailModalOpen,
        setIsDetailModalOpen,
        isImportModalOpen,
        setIsImportModalOpen,
        isExportModalOpen,
        setIsExportModalOpen,
        isTaskModalOpen,
        setIsTaskModalOpen,
        isIssueModalOpen,
        setIsIssueModalOpen,
        isRiskModalOpen,
        setIsRiskModalOpen,
        isTimesheetModalOpen,
        setIsTimesheetModalOpen,
        selectedProject,
        setSelectedProject,
        projectForDetail,
        setProjectForDetail,
        projectToEdit,
        setProjectToEdit,
        projectForMilestones,
        setProjectForMilestones,
        projectToDelete,
        setProjectToDelete,
        targetProjectForSubEntity,
        setTargetProjectForSubEntity,
        openCreateModal,
        closeCreateModal,
        openEditModal,
        closeEditModal,
        openMilestonesModal,
        closeMilestonesModal,
        openDeleteModal,
        closeDeleteModal,
        openDetailModal,
        closeDetailModal,
        openTaskModal,
        openIssueModal,
        openRiskModal,
        openTimesheetModal,
        fetchProjects,
        createProject,
        updateProject,
        updateProjectStatus,
        toggleMilestone,
        deleteProject,
        createTask,
        updateTaskStatus,
        createIssue,
        updateIssueStatus,
        createRisk,
        logTimesheet,
        updateTimesheetStatus,
        addComment,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

export default ProjectContext;
