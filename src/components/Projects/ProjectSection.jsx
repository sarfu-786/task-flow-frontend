import React, { useState } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { MetricCard } from '../ManagerDashboard/MetricCard';
import { ProjectTable } from './ProjectTable';
import { ProjectDetailModal } from './ProjectDetailModal';
import { ProjectModal } from './ProjectModal';
import { MilestonesModal } from './MilestonesModal';
import { DeleteProjectModal } from './DeleteProjectModal';
import { ProjectMetricDetailDialog } from './ProjectMetricDetailDialog';
import {
  FolderKanban,
  Plus,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  Crown,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';

export const ProjectSection = () => {
  const {
    projects,
    stats,
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
    projectForDetail,
    setProjectForDetail,
    projectToEdit,
    setProjectToEdit,
    projectForMilestones,
    setProjectForMilestones,
    projectToDelete,
    setProjectToDelete,
    openCreateModal,
    openEditModal,
    openMilestonesModal,
    openDeleteModal,
    openDetailModal,
  } = useProjects();

  const { isSuperAdmin, isManager } = useAuth();

  // Active Metric Dialog: 'total' | 'in_progress' | 'completed' | 'budget' | null
  const [activeMetricDialog, setActiveMetricDialog] = useState(null);

  return (
    <div className="page-container fade-in" style={{ paddingBottom: '32px' }}>
      {/* Header */}
      <div
        className="section-header-modern"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="section-header-left" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            className="section-icon-badge"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: '#f0fdf4',
              color: '#059669',
              border: '1px solid #dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.12)',
            }}
          >
            <FolderKanban size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="section-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                Projects Management
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f0fdf4',
                  color: '#059669',
                  border: '1px solid #dcfce7',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                }}
              >
                Deliverables Tracking
              </span>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  background: isSuperAdmin ? '#fef3c7' : isManager ? '#eff6ff' : '#ecfdf5',
                  color: isSuperAdmin ? '#b45309' : isManager ? '#1d4ed8' : '#047857',
                  border: `1px solid ${isSuperAdmin ? '#fde68a' : isManager ? '#bfdbfe' : '#a7f3d0'}`,
                }}
              >
                {isSuperAdmin ? <Crown size={12} /> : isManager ? <ShieldCheck size={12} /> : <Briefcase size={12} />}
                {isSuperAdmin
                  ? 'Full Organization Access'
                  : isManager
                    ? 'Department Scope'
                    : 'Personal Scope'}
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Action: Create Project */}
        <div className="section-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary btn-curvy-action"
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onClick={() => {
              if (openCreateModal) openCreateModal();
              else setIsCreateModalOpen(true);
            }}
            id="btn-create-project"
          >
            <Plus size={16} />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Top 4 Interactive Curved Metrics Cards (Clicking opens dedicated popup dialog) */}
      <div
        className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <MetricCard
          title="Total Projects"
          value={stats.total}
          subtitle="Active client deliverables (Click for details)"
          icon={FolderKanban}
          color="#2563eb"
          bgLight="#eff6ff"
          isClickable={true}
          showBadge={false}
          onClick={() => setActiveMetricDialog('total')}
        />

        <MetricCard
          title="In Execution"
          value={stats.inProgress}
          subtitle="Active sprints & development (Click for details)"
          icon={TrendingUp}
          color="#0284c7"
          bgLight="#f0f9ff"
          isClickable={true}
          showBadge={false}
          onClick={() => setActiveMetricDialog('in_progress')}
        />

        <MetricCard
          title="Delivered"
          value={stats.completed}
          subtitle="100% milestone sign-off (Click for details)"
          icon={CheckCircle2}
          color="#059669"
          bgLight="#ecfdf5"
          isClickable={true}
          showBadge={false}
          onClick={() => setActiveMetricDialog('completed')}
        />

        <MetricCard
          title="Portfolio Value"
          value={stats.totalBudget ? `$${stats.totalBudget.toLocaleString()}` : '$0'}
          subtitle={`Average Progress: ${stats.avgProgress || 0}% (Click for details)`}
          icon={DollarSign}
          color="#7c3aed"
          bgLight="#f5f3ff"
          isClickable={true}
          showBadge={false}
          onClick={() => setActiveMetricDialog('budget')}
        />
      </div>

      {/* Projects Directory & Management Section (Table + Search/Filters + Pagination) */}
      <div style={{ marginBottom: '24px' }}>
        <ProjectTable
          onViewProject={(p) => {
            if (openDetailModal) openDetailModal(p);
            else {
              setProjectForDetail(p);
              setIsDetailModalOpen(true);
            }
          }}
          onEditProject={(p) => {
            if (openEditModal) openEditModal(p);
            else {
              setProjectToEdit(p);
              setIsEditModalOpen(true);
            }
          }}
          onOpenMilestones={(p) => {
            if (openMilestonesModal) openMilestonesModal(p);
            else {
              setProjectForMilestones(p);
              setIsMilestonesModalOpen(true);
            }
          }}
          onDeleteProject={(p) => {
            if (openDeleteModal) openDeleteModal(p);
            else {
              setProjectToDelete(p);
              setIsDeleteModalOpen(true);
            }
          }}
          canDelete={isSuperAdmin || isManager}
        />
      </div>

      {/* Dedicated Project Metric Specification Dialog Popup */}
      <ProjectMetricDetailDialog
        open={!!activeMetricDialog}
        onClose={() => setActiveMetricDialog(null)}
        metricType={activeMetricDialog || 'total'}
        onEditProject={(p) => {
          if (openEditModal) openEditModal(p);
          else {
            setProjectToEdit(p);
            setIsEditModalOpen(true);
          }
        }}
        onOpenMilestones={(p) => {
          if (openMilestonesModal) openMilestonesModal(p);
          else {
            setProjectForMilestones(p);
            setIsMilestonesModalOpen(true);
          }
        }}
        onDeleteProject={(p) => {
          if (openDeleteModal) openDeleteModal(p);
          else {
            setProjectToDelete(p);
            setIsDeleteModalOpen(true);
          }
        }}
        canDelete={isSuperAdmin || isManager}
        onCreateProject={() => {
          if (openCreateModal) openCreateModal();
          else setIsCreateModalOpen(true);
        }}
      />

      {/* Complete Project Detail View Modal */}
      <ProjectDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setProjectForDetail(null);
        }}
        project={projectForDetail}
        onEdit={(p) => {
          if (openEditModal) openEditModal(p);
          else {
            setProjectToEdit(p);
            setIsEditModalOpen(true);
          }
        }}
        onOpenMilestones={(p) => {
          if (openMilestonesModal) openMilestonesModal(p);
          else {
            setProjectForMilestones(p);
            setIsMilestonesModalOpen(true);
          }
        }}
        onDelete={(p) => {
          if (openDeleteModal) openDeleteModal(p);
          else {
            setProjectToDelete(p);
            setIsDeleteModalOpen(true);
          }
        }}
      />

      {/* Project Create & Edit Modal */}
      <ProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projectToEdit={null}
      />
      <ProjectModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setProjectToEdit(null);
        }}
        projectToEdit={projectToEdit}
      />

      {/* Milestones Modal */}
      <MilestonesModal
        isOpen={isMilestonesModalOpen}
        onClose={() => {
          setIsMilestonesModalOpen(false);
          setProjectForMilestones(null);
        }}
        project={projectForMilestones}
      />

      {/* Delete Project Modal */}
      <DeleteProjectModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProjectToDelete(null);
        }}
        project={projectToDelete}
      />
    </div>
  );
};

export default ProjectSection;
