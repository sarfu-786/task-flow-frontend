import React, { useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { MetricCard } from '../ManagerDashboard/MetricCard';
import { ComplaintModal } from './ComplaintModal';
import { ResolveComplaintModal } from './ResolveComplaintModal';
import { DeleteComplaintModal } from './DeleteComplaintModal';
import { ComplaintDetailModal } from './ComplaintDetailModal';
import { ComplaintMetricDetailDialog } from './ComplaintMetricDetailDialog';
import {
  AlertCircle,
  Plus,
  Clock,
  CheckCircle2,
  Flame,
  Crown,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';

export const ComplaintSection = () => {
  const { stats } = useComplaints();
  const { isSuperAdmin, isManager } = useAuth();

  // Active Metric Popup Dialog: 'total' | 'urgent' | 'sla_risk' | 'resolved' | null
  const [activeMetricDialog, setActiveMetricDialog] = useState(null);

  // Modals for CRUD and detailed operations
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [complaintToEdit, setComplaintToEdit] = useState(null);
  const [complaintToResolve, setComplaintToResolve] = useState(null);
  const [complaintToDelete, setComplaintToDelete] = useState(null);
  const [complaintToView, setComplaintToView] = useState(null);

  return (
    <div className="page-container fade-in" style={{ paddingBottom: '32px' }}>
      {/* Section Header */}
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
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.12)',
            }}
          >
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="section-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                Complaint & SLA Management
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fee2e2',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#dc2626',
                    animation: 'pulse 1.5s infinite',
                  }}
                />
                Live SLA Monitoring
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

        {/* Header Right Action: Log Complaint */}
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
            id="btn-log-complaint"
          >
            <Plus size={16} />
            <span>Log Complaint</span>
          </button>
        </div>
      </div>

      {/* Top 4 Interactive Curved Metrics Cards (Clicking opens related popup dialog) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <MetricCard
          title="Total Complaints"
          value={stats.total}
          subtitle="All organization tickets (Click to view details)"
          icon={AlertCircle}
          color="#2563eb"
          bgLight="#eff6ff"
          isClickable={true}
          onClick={() => setActiveMetricDialog('total')}
        />

        <MetricCard
          title="Urgent Escalations"
          value={stats.urgent}
          subtitle="4-hour rapid SLA target (Click to view details)"
          icon={Flame}
          color="#dc2626"
          bgLight="#fee2e2"
          isClickable={true}
          onClick={() => setActiveMetricDialog('urgent')}
        />

        <MetricCard
          title="SLA Breached / At Risk"
          value={(stats.slaBreached || 0) + (stats.slaAtRisk || 0)}
          subtitle={`${stats.slaBreached || 0} breached, ${stats.slaAtRisk || 0} at risk (Click to view details)`}
          icon={Clock}
          color="#d97706"
          bgLight="#fef3c7"
          isClickable={true}
          onClick={() => setActiveMetricDialog('sla_risk')}
        />

        <MetricCard
          title="Resolved & Met SLA"
          value={stats.resolved}
          subtitle={`${stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 100}% resolution rate (Click to view details)`}
          icon={CheckCircle2}
          color="#059669"
          bgLight="#ecfdf5"
          isClickable={true}
          onClick={() => setActiveMetricDialog('resolved')}
        />
      </div>

      {/* Dedicated Metric Specification Scrollable Popup Dialog */}
      <ComplaintMetricDetailDialog
        open={!!activeMetricDialog}
        onClose={() => setActiveMetricDialog(null)}
        metricType={activeMetricDialog || 'total'}
        onViewTicket={(t) => {
          setActiveMetricDialog(null);
          setComplaintToView(t);
        }}
        onEditTicket={(t) => {
          setActiveMetricDialog(null);
          setComplaintToEdit(t);
        }}
        onResolveTicket={(t) => {
          setActiveMetricDialog(null);
          setComplaintToResolve(t);
        }}
        onDeleteTicket={(t) => {
          setActiveMetricDialog(null);
          setComplaintToDelete(t);
        }}
        canDelete={isSuperAdmin || isManager}
        onCreateTicket={() => {
          setActiveMetricDialog(null);
          setIsCreateOpen(true);
        }}
      />

      {/* CRUD & View Top-Up Modals */}
      <ComplaintModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        complaintToEdit={null}
      />
      <ComplaintModal
        isOpen={!!complaintToEdit}
        onClose={() => setComplaintToEdit(null)}
        complaintToEdit={complaintToEdit}
      />
      <ResolveComplaintModal
        isOpen={!!complaintToResolve}
        onClose={() => setComplaintToResolve(null)}
        complaint={complaintToResolve}
      />
      <DeleteComplaintModal
        isOpen={!!complaintToDelete}
        onClose={() => setComplaintToDelete(null)}
        complaint={complaintToDelete}
      />
      <ComplaintDetailModal
        isOpen={!!complaintToView}
        onClose={() => setComplaintToView(null)}
        complaint={complaintToView}
        onEdit={(c) => setComplaintToEdit(c)}
        onResolve={(c) => setComplaintToResolve(c)}
        onDelete={(c) => setComplaintToDelete(c)}
        canDelete={isSuperAdmin || isManager}
      />
    </div>
  );
};

export default ComplaintSection;
