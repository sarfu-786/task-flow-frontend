import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  History,
  ArrowRight,
  Filter,
  RefreshCw,
  X,
  FileCheck,
  AlertCircle,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const LeadExcelModal = ({ isOpen, onClose, defaultTab = 'import' }) => {
  const { fetchLeads, totalLeads, leads, search, statusFilter, priorityFilter, sourceFilter, assignedToFilter } = useLeads();
  const { user, isSuperAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState(defaultTab); // 'import' | 'export' | 'history'
  const [importMode, setImportMode] = useState('upsert'); // 'create' | 'update' | 'upsert'
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileBase64, setFileBase64] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success'|'error'|'info', text: '' }
  const [importResult, setImportResult] = useState(null);
  const [exportScope, setExportScope] = useState('filtered'); // 'filtered' | 'all'
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      resetImportState();
      setStatusMessage(null);
      setImportResult(null);
      if (defaultTab === 'history') {
        loadHistory();
      }
    }
  }, [isOpen, defaultTab]);

  const resetImportState = () => {
    setFile(null);
    setFileName('');
    setFileBase64('');
    setPreviewData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.getLeadExcelHistory();
      if (res && res.success) {
        setHistoryData(res.history || []);
      }
    } catch (err) {
      console.error('[LeadExcelModal] Load History Error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.xlsx')) {
      setStatusMessage({
        type: 'error',
        text: 'Invalid file format. Only Excel files (.xlsx) are supported. CSV is not accepted.',
      });
      return;
    }

    setStatusMessage(null);
    setImportResult(null);
    setFileName(selectedFile.name);
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      setFileBase64(base64);
      await fetchPreview(base64, selectedFile.name);
    };
    reader.readAsDataURL(selectedFile);
  };

  const fetchPreview = async (base64, name) => {
    try {
      setPreviewLoading(true);
      setStatusMessage(null);
      const data = await api.previewLeadExcel(base64, name);
      if (data && data.success) {
        setPreviewData(data);
        if (data.invalidRowsCount > 0) {
          setStatusMessage({
            type: 'info',
            text: `Preview parsed: ${data.validRowsCount} valid rows ready, ${data.invalidRowsCount} invalid rows will be skipped.`,
          });
        }
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to parse Excel file. Please ensure valid .xlsx structure.',
      });
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await api.downloadLeadExcelTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Lead_Import_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to download Lead Excel template.',
      });
    }
  };

  const handleExecuteImport = async () => {
    if (!previewData || !previewData.rows || previewData.rows.length === 0) return;

    try {
      setImportLoading(true);
      setStatusMessage(null);

      const payload = {
        rows: previewData.rows,
        mode: importMode,
        fileName: fileName || 'leads_import.xlsx',
      };

      const result = await api.importLeadExcel(payload);
      if (result && result.success) {
        setImportResult(result);
        setStatusMessage({
          type: 'success',
          text: result.message || 'Excel import processed successfully!',
        });
        // Refresh local leads context
        if (fetchLeads) {
          fetchLeads(true);
        }
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to complete Excel import.',
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleExecuteExport = async () => {
    try {
      setExportLoading(true);
      setStatusMessage(null);

      const exportParams = {
        scope: exportScope,
        search: exportScope === 'filtered' ? search : '',
        status: exportScope === 'filtered' ? statusFilter : 'all',
        priority: exportScope === 'filtered' ? priorityFilter : 'all',
        source: exportScope === 'filtered' ? sourceFilter : 'all',
        assignedTo: exportScope === 'filtered' ? assignedToFilter : 'all',
      };

      const blob = await api.exportLeadExcel(exportParams);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `Leads_Export_${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatusMessage({
        type: 'success',
        text: 'Excel export generated and downloaded successfully (.xlsx)',
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to export leads to Excel.',
      });
    } finally {
      setExportLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #ffffff, #f8fafc)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                border: '1.5px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)',
                flexShrink: 0,
              }}
            >
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Lead Excel Suite
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  .XLSX ONLY
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Enterprise bulk import, hierarchy-scoped export, and audit tracking
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#f1f5f9',
                padding: '4px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveTab('import');
                  setStatusMessage(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'import' ? '#ffffff' : 'transparent',
                  color: activeTab === 'import' ? '#2563eb' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'import' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Upload size={14} />
                <span>Import</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('export');
                  setStatusMessage(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'export' ? '#ffffff' : 'transparent',
                  color: activeTab === 'export' ? '#2563eb' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'export' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Download size={14} />
                <span>Export</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('history');
                  setStatusMessage(null);
                  loadHistory();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'history' ? '#ffffff' : 'transparent',
                  color: activeTab === 'history' ? '#2563eb' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'history' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <History size={14} />
                <span>History</span>
              </button>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0', margin: '0 2px' }} />

            {/* Dedicated Top-Right Cut/Close Button */}
            <button
              type="button"
              onClick={onClose}
              id="btn-close-lead-excel-modal"
              style={{
                width: '36px',
                height: '36px',
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
              aria-label="Close modal"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status Notification Banner */}
        {statusMessage && (
          <div
            style={{
              padding: '10px 24px',
              backgroundColor:
                statusMessage.type === 'success'
                  ? '#ecfdf5'
                  : statusMessage.type === 'error'
                  ? '#fef2f2'
                  : '#eff6ff',
              borderBottom: `1px solid ${
                statusMessage.type === 'success'
                  ? '#a7f3d0'
                  : statusMessage.type === 'error'
                  ? '#fecaca'
                  : '#bfdbfe'
              }`,
              color:
                statusMessage.type === 'success'
                  ? '#065f46'
                  : statusMessage.type === 'error'
                  ? '#991b1b'
                  : '#1e40af',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
            }}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={16} />
            ) : statusMessage.type === 'error' ? (
              <XCircle size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div
          style={{
            padding: '24px 28px',
            backgroundColor: '#f8fafc',
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
          }}
        >
          {/* TAB 1: IMPORT */}
          {activeTab === 'import' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Step 1 & 2: Header actions */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                  gap: '16px',
                }}
              >
                {/* Download Template Box */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', marginBottom: '2px' }}>
                      1. Download Excel Template
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Pre-formatted .xlsx with allowed fields & sample data
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="btn btn-secondary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      backgroundColor: '#f0fdf4',
                      color: '#16a34a',
                      border: '1px solid #bbf7d0',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <Download size={15} />
                    <span>Template (.xlsx)</span>
                  </button>
                </div>

                {/* Import Mode Selector */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '18px',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', marginBottom: '8px' }}>
                    2. Choose Import Mode
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { id: 'upsert', label: 'Upsert', desc: 'Create new, update existing' },
                      { id: 'create', label: 'Create Only', desc: 'Skip existing' },
                      { id: 'update', label: 'Update Only', desc: 'Only match & update' },
                    ].map((mode) => (
                      <label
                        key={mode.id}
                        style={{
                          flex: '1 1 80px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          background: importMode === mode.id ? '#eff6ff' : '#f8fafc',
                          border: `1.5px solid ${importMode === mode.id ? '#2563eb' : '#e2e8f0'}`,
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: importMode === mode.id ? 700 : 500,
                          color: importMode === mode.id ? '#1e40af' : '#475569',
                        }}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          value={mode.id}
                          checked={importMode === mode.id}
                          onChange={() => setImportMode(mode.id)}
                          style={{ margin: 0 }}
                        />
                        <span>{mode.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upload Dropzone */}
              {!previewData && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  style={{
                    backgroundColor: isDragging ? '#eff6ff' : '#ffffff',
                    border: `2px dashed ${isDragging ? '#2563eb' : '#cbd5e1'}`,
                    borderRadius: '18px',
                    padding: '36px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '16px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}
                  >
                    <Upload size={26} />
                  </div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginBottom: '4px' }}>
                    {previewLoading ? 'Parsing Excel File...' : 'Click to Upload or Drag & Drop Excel File'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Accepts <strong>.xlsx</strong> files only (Up to 10,000 leads). CSV files are strictly rejected.
                  </div>
                </div>
              )}

              {/* Import Result Summary (After Execution) */}
              {importResult && (
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '18px',
                    padding: '20px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Sparkles size={20} color="#059669" />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      Import Completed Successfully
                    </h3>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '12px',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Created</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d' }}>{importResult.createdCount || 0}</div>
                    </div>
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '12px' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>Updated</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb' }}>{importResult.updatedCount || 0}</div>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Skipped</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#475569' }}>{importResult.skippedCount || 0}</div>
                    </div>
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '12px' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>Errors</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626' }}>{importResult.errorCount || 0}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={resetImportState}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      Import Another File
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn btn-primary"
                      style={{
                        fontSize: '0.8rem',
                        padding: '8px 18px',
                        borderRadius: '8px',
                        backgroundColor: '#2563eb',
                        color: '#fff',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Close & View Pipeline
                    </button>
                  </div>
                </div>
              )}

              {/* Preview Table & Validation breakdown */}
              {previewData && !importResult && (
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '18px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileCheck size={20} color="#2563eb" />
                        <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                          Validation Preview: {fileName}
                        </h3>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                        Total: {previewData.totalRows} rows | Valid: {previewData.validRowsCount} | Invalid:{' '}
                        {previewData.invalidRowsCount}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={resetImportState}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        Change File
                      </button>
                      <button
                        type="button"
                        onClick={handleExecuteImport}
                        disabled={importLoading || previewData.validRowsCount === 0}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 18px',
                          borderRadius: '10px',
                          backgroundColor: previewData.validRowsCount > 0 ? '#2563eb' : '#94a3b8',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.84rem',
                          border: 'none',
                          cursor: previewData.validRowsCount > 0 && !importLoading ? 'pointer' : 'not-allowed',
                          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                        }}
                      >
                        {importLoading ? (
                          <>
                            <RefreshCw size={14} className="spin" />
                            <span>Importing...</span>
                          </>
                        ) : (
                          <>
                            <span>Import {previewData.validRowsCount} Valid Leads</span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Preview Rows Table */}
                  <div style={{ overflowX: 'auto', maxHeight: '320px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                          <th style={{ padding: '8px 10px', width: '50px' }}>Row</th>
                          <th style={{ padding: '8px 10px', width: '90px' }}>Status</th>
                          <th style={{ padding: '8px 10px' }}>Lead Name</th>
                          <th style={{ padding: '8px 10px' }}>Company</th>
                          <th style={{ padding: '8px 10px' }}>Phone / Email</th>
                          <th style={{ padding: '8px 10px' }}>Assigned To</th>
                          <th style={{ padding: '8px 10px' }}>Validation Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.rows && previewData.rows.slice(0, 100).map((row, idx) => {
                          const isRowValid = row.validationStatus === 'valid';
                          const isWarning = row.validationStatus === 'warning';
                          const isError = row.validationStatus === 'error';

                          return (
                            <tr
                              key={idx}
                              style={{
                                borderBottom: '1px solid #f1f5f9',
                                background: isError ? '#fef2f2' : isWarning ? '#fffbeb' : '#ffffff',
                              }}
                            >
                              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#64748b' }}>
                                #{row.rowNumber || idx + 1}
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    background: isError ? '#fee2e2' : isWarning ? '#fef3c7' : '#ecfdf5',
                                    color: isError ? '#dc2626' : isWarning ? '#d97706' : '#059669',
                                    border: `1px solid ${isError ? '#fecaca' : isWarning ? '#fde68a' : '#a7f3d0'}`,
                                  }}
                                >
                                  {isError ? 'Error' : isWarning ? 'Warning' : row.isExisting ? 'Update' : 'Create'}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>
                                {row.name || '-'}
                              </td>
                              <td style={{ padding: '8px 10px', color: '#334155' }}>
                                {row.company || '-'}
                              </td>
                              <td style={{ padding: '8px 10px', color: '#64748b' }}>
                                {row.phone || row.email || '-'}
                              </td>
                              <td style={{ padding: '8px 10px', color: '#475569' }}>
                                {row.assignedTo || 'Default (You)'}
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                {row.errors && row.errors.length > 0 ? (
                                  <div style={{ color: '#dc2626', fontWeight: 600, fontSize: '0.72rem' }}>
                                    {row.errors.join('; ')}
                                  </div>
                                ) : row.warnings && row.warnings.length > 0 ? (
                                  <div style={{ color: '#d97706', fontSize: '0.72rem' }}>
                                    {row.warnings.join('; ')}
                                  </div>
                                ) : (
                                  <div style={{ color: '#059669', fontSize: '0.72rem' }}>
                                    Ready to import
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {previewData.rows && previewData.rows.length > 100 && (
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', textAlign: 'center' }}>
                      Showing first 100 preview rows. All {previewData.totalRows} rows will be processed.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXPORT */}
          {activeTab === 'export' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '22px',
                }}
              >
                <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  Export Leads to Excel (.xlsx)
                </h3>
                <p style={{ margin: '0 0 18px', fontSize: '0.82rem', color: '#64748b' }}>
                  Download high-fidelity Excel workbook respecting role-based hierarchy permissions.
                </p>

                {/* Scope Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '14px',
                      borderRadius: '12px',
                      background: exportScope === 'filtered' ? '#eff6ff' : '#f8fafc',
                      border: `1.5px solid ${exportScope === 'filtered' ? '#2563eb' : '#e2e8f0'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="exportScope"
                      value="filtered"
                      checked={exportScope === 'filtered'}
                      onChange={() => setExportScope('filtered')}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                        Current Filtered Results
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                        Exports leads matching current search & filter criteria ({leads ? leads.length : 0} matching)
                      </div>
                    </div>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '14px',
                      borderRadius: '12px',
                      background: exportScope === 'all' ? '#eff6ff' : '#f8fafc',
                      border: `1.5px solid ${exportScope === 'all' ? '#2563eb' : '#e2e8f0'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="exportScope"
                      value="all"
                      checked={exportScope === 'all'}
                      onChange={() => setExportScope('all')}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                        All Accessible Leads
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                        Exports all leads permitted under your organizational hierarchy ({totalLeads || 0} total)
                      </div>
                    </div>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleExecuteExport}
                  disabled={exportLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 22px',
                    borderRadius: '12px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    border: 'none',
                    cursor: exportLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)',
                  }}
                >
                  {exportLoading ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      <span>Generating Excel File...</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>Download Leads (.xlsx)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: HISTORY */}
          {activeTab === 'history' && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '18px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                  Excel Activity & Audit History
                </h3>
                <button
                  type="button"
                  onClick={loadHistory}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', padding: '5px 10px', borderRadius: '8px' }}
                >
                  <RefreshCw size={12} className={historyLoading ? 'spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              {historyLoading ? (
                <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px' }} />
                  <div>Loading history records...</div>
                </div>
              ) : historyData.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                  <History size={32} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontWeight: 600, color: '#475569' }}>No Excel Import/Export logs recorded yet.</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '10px 12px' }}>Timestamp</th>
                        <th style={{ padding: '10px 12px' }}>Action</th>
                        <th style={{ padding: '10px 12px' }}>User</th>
                        <th style={{ padding: '10px 12px' }}>File / Scope</th>
                        <th style={{ padding: '10px 12px' }}>Counts</th>
                        <th style={{ padding: '10px 12px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px', color: '#64748b' }}>
                            {new Date(item.timestamp || item.createdAt).toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                background: item.action === 'IMPORT_EXCEL' ? '#eff6ff' : '#f0fdf4',
                                color: item.action === 'IMPORT_EXCEL' ? '#2563eb' : '#16a34a',
                                border: `1px solid ${item.action === 'IMPORT_EXCEL' ? '#bfdbfe' : '#bbf7d0'}`,
                              }}
                            >
                              {item.action === 'IMPORT_EXCEL' ? 'IMPORT' : 'EXPORT'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                            {item.performedBy?.name || item.user || 'System'}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#334155' }}>
                            {item.fileName || item.details?.fileName || item.scope || '.xlsx'}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#475569' }}>
                            {item.createdCount !== undefined
                              ? `Created: ${item.createdCount}, Updated: ${item.updatedCount || 0}`
                              : item.recordCount
                              ? `${item.recordCount} rows`
                              : '-'}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ color: '#059669', fontWeight: 700 }}>
                              {item.status || 'Success'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadExcelModal;
