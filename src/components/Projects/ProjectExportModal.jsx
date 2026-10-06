import React, { useState } from 'react';
import { useProjects } from '../../context/ProjectContext';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  CheckCircle2,
  Filter,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { exportToExcel, exportToCSV, printPDFReport } from '../../services/exportUtils';

export const ProjectExportModal = ({ isOpen, onClose }) => {
  const { projects } = useProjects();

  const [format, setFormat] = useState('xlsx'); // 'xlsx' | 'csv' | 'pdf'
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setExporting(true);

      let filtered = projects;
      if (statusFilter !== 'all') filtered = filtered.filter((p) => p.status === statusFilter);
      if (priorityFilter !== 'all') filtered = filtered.filter((p) => p.priority === priorityFilter);

      const columns = [
        { key: 'projectCode', label: 'Project ID' },
        { key: 'name', label: 'Project Name' },
        { key: 'clientName', label: 'Client / Account' },
        { key: 'category', label: 'Category' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Priority' },
        { key: 'progress', label: 'Progress', formatter: (val) => `${val || 0}%` },
        { key: 'budget', label: 'Total Budget', formatter: (val, item) => `${item.currency || 'USD'} ${Number(val || 0).toLocaleString()}` },
        { key: 'managerName', label: 'Project Manager' },
        { key: 'targetDate', label: 'Target Completion Date', formatter: (val) => val ? new Date(val).toISOString().slice(0, 10) : '—' },
      ];

      if (format === 'pdf') {
        printPDFReport(
          'Projects Portfolio Export',
          `Exported ${filtered.length} Projects (${statusFilter === 'all' ? 'All Statuses' : statusFilter})`,
          columns,
          filtered,
          [
            { label: 'Total Projects', value: filtered.length, color: '#2563eb' },
            { label: 'In Execution', value: filtered.filter((p) => p.status === 'In Progress').length, color: '#0284c7' },
            { label: 'Delivered', value: filtered.filter((p) => p.status === 'Completed').length, color: '#059669' },
            { label: 'Portfolio Value', value: `$${filtered.reduce((a, b) => a + (Number(b.budget) || 0), 0).toLocaleString()}`, color: '#7c3aed' },
          ]
        );
      } else if (format === 'csv') {
        exportToCSV('Projects_Portfolio_Report', filtered, columns);
      } else {
        exportToExcel('Projects_Portfolio_Report', filtered, columns, {
          sheetName: 'Projects',
          title: 'TaskFlow Pro Projects Portfolio Directory',
        });
      }

      onClose();
    } catch (err) {
      console.error('[Export Error]', err);
      alert('Failed to export projects: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          maxWidth: '540px',
          width: '100%',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          margin: '24px 0',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1.5px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #a7f3d0',
                flexShrink: 0,
              }}
            >
              <Download size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Export Project Records
              </h2>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                Download authorized project records in your preferred format
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            id="btn-close-project-export-modal"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
              e.currentTarget.style.color = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#64748b';
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Format Selection Cards */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '10px' }}>
              Select Export Format
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { id: 'xlsx', label: 'Excel (.xlsx)', desc: 'Formatted Spreadsheet', icon: FileSpreadsheet, color: '#059669', border: '#10b981', bg: '#ecfdf5' },
                { id: 'csv', label: 'CSV (.csv)', desc: 'Raw Tabular Data', icon: FileText, color: '#2563eb', border: '#3b82f6', bg: '#eff6ff' },
                { id: 'pdf', label: 'Printable PDF', desc: 'Formal Document', icon: Printer, color: '#7c3aed', border: '#8b5cf6', bg: '#faf5ff' },
              ].map((fmt) => {
                const Icon = fmt.icon;
                const isSelected = format === fmt.id;
                return (
                  <div
                    key={fmt.id}
                    onClick={() => setFormat(fmt.id)}
                    style={{
                      padding: '14px 10px',
                      borderRadius: '14px',
                      border: isSelected ? `2px solid ${fmt.border}` : '1.5px solid #e2e8f0',
                      backgroundColor: isSelected ? fmt.bg : '#ffffff',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    <Icon size={24} style={{ color: fmt.color, margin: '0 auto 6px auto' }} />
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                      {fmt.label}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      {fmt.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter Scope */}
          <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, color: '#334155' }}>
              <Filter size={15} style={{ color: '#64748b' }} />
              <span>Data Scope Filters</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                  Filter by Status
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 32px 0 12px',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#1e293b',
                      cursor: 'pointer',
                      appearance: 'none',
                      outline: 'none',
                    }}
                  >
                    <option value="all">All Statuses ({projects.length})</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Planning">Planning</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                  Filter by Priority
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 32px 0 12px',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#1e293b',
                      cursor: 'pointer',
                      appearance: 'none',
                      outline: 'none',
                    }}
                  >
                    <option value="all">All Priorities</option>
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1.5px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              height: '38px',
              padding: '0 18px',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={exporting}
            onClick={handleExport}
            style={{
              height: '38px',
              padding: '0 22px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '10px',
              backgroundColor: '#059669',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              cursor: 'pointer',
            }}
          >
            <Download size={15} />
            <span>{exporting ? 'Generating...' : 'Export Records'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectExportModal;
