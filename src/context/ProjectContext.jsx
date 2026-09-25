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

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMilestonesModalOpen, setIsMilestonesModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

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
    [search, statusFilter, priorityFilter, categoryFilter, managerFilter, currentPage]
  );

  useEffect(() => {
    fetchProjects(true);
  }, [fetchProjects]);

  // Socket listener for real-time project events
  useEffect(() => {
    const unsub1 = socketService.on('project_created', () => fetchProjects());
    const unsub2 = socketService.on('project_updated', () => fetchProjects());
    const unsub3 = socketService.on('project_deleted', () => fetchProjects());

    return () => {
      if (unsub1) unsub1();
      if (unsub2) unsub2();
      if (unsub3) unsub3();
    };
  }, [fetchProjects]);

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
        await fetchProjects();
        if (selectedProject && selectedProject._id === projectId) {
          setSelectedProject(res.project);
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
    <ProjectContext.Provider
      value={{
        projects,
        stats,
        loading,
        error,
        moduleDisabled,
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
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        isMilestonesModalOpen,
        setIsMilestonesModalOpen,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        selectedProject,
        setSelectedProject,
        fetchProjects,
        createProject,
        updateProject,
        toggleMilestone,
        deleteProject,
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
