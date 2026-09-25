import React, { useState } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { MetricCard } from '../ManagerDashboard/MetricCard';
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
  const { projects, stats } = useProjects();
  const { isSuperAdmin, isManager } = useAuth();

  // Active Metric Dialog: 'total' | 'in_progress' | 'completed' | 'budget' | null
  const [activeMetricDialog, setActiveMetricDialog] = useState(null);

  // Modals for CRUD and detailed operations
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [projectForMilestones, setProjectForMilestones] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);

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
            onClick={() => setIsCreateOpen(true)}
            id="btn-create-project"
          >
            <Plus size={16} />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Top 4 Interactive Curved Metrics Cards (Clicking opens dedicated popup dialog) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
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
          onClick={() => setActiveMetricDialog('in_progress')}
        />

        <MetricCard
          title="Delivered & Completed"
          value={stats.completed}
          subtitle="100% milestone sign-off (Click for details)"
          icon={CheckCircle2}
          color="#059669"
          bgLight="#ecfdf5"
          isClickable={true}
          onClick={() => setActiveMetricDialog('completed')}
        />

        <MetricCard
          title="Portfolio Budget"
          value={stats.totalBudget ? `$${stats.totalBudget.toLocaleString()}` : '$0'}
          subtitle={`Average Progress: ${stats.avgProgress || 0}% (Click for details)`}
          icon={DollarSign}
          color="#7c3aed"
          bgLight="#f5f3ff"
          isClickable={true}
          onClick={() => setActiveMetricDialog('budget')}
        />
      </div>

      {/* Dedicated Project Metric Specification Dialog Popup */}
      <ProjectMetricDetailDialog
        open={!!activeMetricDialog}
        onClose={() => setActiveMetricDialog(null)}
        metricType={activeMetricDialog || 'total'}
        onEditProject={(p) => setProjectToEdit(p)}
        onOpenMilestones={(p) => setProjectForMilestones(p)}
        onDeleteProject={(p) => setProjectToDelete(p)}
        canDelete={isSuperAdmin || isManager}
        onCreateProject={() => setIsCreateOpen(true)}
      />

      {/* CRUD & Milestone Popups */}
      <ProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        projectToEdit={null}
      />
      <ProjectModal
        isOpen={!!projectToEdit}
        onClose={() => setProjectToEdit(null)}
        projectToEdit={projectToEdit}
      />
      <MilestonesModal
        isOpen={!!projectForMilestones}
        onClose={() => setProjectForMilestones(null)}
        project={projectForMilestones}
      />
      <DeleteProjectModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        project={projectToDelete}
      />
    </div>
  );
};
