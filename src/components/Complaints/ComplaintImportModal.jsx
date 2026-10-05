import React, { useState, useEffect, useRef } from 'react';
import { complaintApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  History,
  ArrowRight,
  RefreshCw,
  X,
  FileCheck,
  AlertCircle,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';

export const ComplaintImportModal = ({ isOpen, onClose, onImportSuccess }) => {
  const { user } = useAuth();

  const [activeView, setActiveView] = useState('import'); // 'import' | 'history'
  const [importMode, setImportMode] = useState('upsert'); // 'create' | 'update' | 'upsert'
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileBase64, setFileBase64] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [statusMessage, setStatusMessage] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setActiveView('import');
      resetImportState();
      setStatusMessage(null);
      setImportResult(null);
    }
  }, [isOpen]);

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
      const res = await complaintApi.getComplaintExcelHistory();
      if (res && res.success) {
        const imports = (res.history || []).filter(
          (h) => h.action === 'IMPORT_EXCEL' || (h.details && h.details.includes('Import'))
        );
        setHistoryData(imports);
      }
    } catch (err) {
      console.error('[ComplaintImportModal] Load History Error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.xlsx')) {
      setStatusMessage({
        type: 'error',
        text: 'Invalid file format. Only Excel files (.xlsx) are supported. CSV files are not accepted.',
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
      const data = await complaintApi.previewComplaintExcel(base64, name);
      if (data && data.success) {
        setPreviewData(data);
        if (data.invalidRowsCount > 0) {
          setStatusMessage({
            type: 'info',
            text: `Preview parsed: ${data.validRowsCount} valid tickets ready, ${data.invalidRowsCount} invalid rows will be skipped.`,
          });
        }
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to parse Complaint Excel file. Please ensure valid .xlsx structure.',
      });
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await complaintApi.downloadComplaintExcelTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Complaint_Import_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to download Complaint Excel template.',
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
        fileName: fileName || 'complaints_import.xlsx',
      };

      const result = await complaintApi.importComplaintExcel(payload);
      if (result && result.success) {
        setImportResult(result);
        setStatusMessage({
          type: 'success',
          text: result.message || 'Complaint Excel import processed successfully!',
        });
        if (onImportSuccess) {
          onImportSuccess();
        }
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to complete Complaint Excel import.',
      });
    } finally {
      setImportLoading(false);
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
          maxWidth: '1060px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #ffffff, #eff6ff)',
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
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                border: '1.5px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
                flexShrink: 0,
              }}
            >
              <Upload size={22} />
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
                  Import Complaints from Excel
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  .xlsx Only
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                Upload `.xlsx` workbook, validate ticket schemas, preview SLA calculations, and import tickets.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Toggle History View */}
            <button
              type="button"
              onClick={() => {
                if (activeView === 'import') {
                  setActiveView('history');
                  loadHistory();
                } else {
                  setActiveView('import');
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 13px',
                borderRadius: '9px',
                backgroundColor: activeView === 'history' ? '#eff6ff' : '#f8fafc',
                color: activeView === 'history' ? '#2563eb' : '#475569',
                border: `1px solid ${activeView === 'history' ? '#bfdbfe' : '#e2e8f0'}`,
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <History size={14} />
              <span>{activeView === 'history' ? 'Back to Import' : 'Import History'}</span>
            </button>

            {/* Separator */}
            <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0', margin: '0 2px' }} />

            {/* Dedicated Top-Right Cut/Close Button */}
            <button
              type="button"
              onClick={onClose}
              id="btn-close-complaint-import-modal"
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

        {/* Modal Body */}
        <div
          style={{
            padding: '24px 28px',
            backgroundColor: '#f8fafc',
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Status Alert */}
          {statusMessage && (
            <div
              style={{
                padding: '12px 18px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor:
                  statusMessage.type === 'success'
                    ? '#ecfdf5'
                    : statusMessage.type === 'error'
                    ? '#fef2f2'
                    : '#eff6ff',
                color:
                  statusMessage.type === 'success'
                    ? '#065f46'
                    : statusMessage.type === 'error'
                    ? '#991b1b'
                    : '#1e40af',
                border: `1px solid ${
                  statusMessage.type === 'success'
                    ? '#a7f3d0'
                    : statusMessage.type === 'error'
                    ? '#fecaca'
                    : '#bfdbfe'
                }`,
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              {statusMessage.type === 'success' && <CheckCircle2 size={18} style={{ flexShrink: 0 }} />}
              {statusMessage.type === 'error' && <XCircle size={18} style={{ flexShrink: 0 }} />}
              {statusMessage.type === 'info' && <AlertCircle size={18} style={{ flexShrink: 0 }} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {activeView === 'history' ? (
            /* History View */
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    Complaint Import History Log
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Audited record of recent Complaint Excel imports and ticket creation outcomes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadHistory}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={13} className={historyLoading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              {historyLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: '#2563eb' }} />
                  <div style={{ fontSize: '0.85rem' }}>Loading import history...</div>
                </div>
              ) : historyData.length === 0 ? (
                <div
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                  }}
                >
                  No Complaint Excel imports logged yet.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Timestamp</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Action</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>User</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>File Name</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Outcome Summary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {item.timestamp ? new Date(item.timestamp).toLocaleString() : '—'}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                backgroundColor: '#eff6ff',
                                color: '#2563eb',
                              }}
                            >
                              {item.action}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>
                            {item.userName || item.user || 'System'}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#475569' }}>
                            {item.fileName || '—'}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#334155' }}>
                            {item.details || `Created: ${item.createdCount || 0}, Updated: ${item.updatedCount || 0}, Skipped: ${item.skippedCount || 0}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Main Import Workflow */
            <>
              {/* Step 1: Download Template + SLA Standards Banner */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '16px',
                }}
              >
                {/* Download Template Card */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '18px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Download size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                        1. Download Template
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        Includes Category options & SLA configuration sheet.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      border: '1.5px solid #bfdbfe',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Download size={15} />
                    <span>Download .xlsx</span>
                  </button>
                </div>

                {/* Import Mode Selection Card */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '18px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                      2. Ticket Import Mode:
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                      {importMode}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { key: 'upsert', label: 'Upsert (Create/Update)' },
                      { key: 'create', label: 'Create Only' },
                      { key: 'update', label: 'Update Only' },
                    ].map((mode) => (
                      <button
                        key={mode.key}
                        type="button"
                        onClick={() => setImportMode(mode.key)}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: importMode === mode.key ? '#2563eb' : '#f8fafc',
                          color: importMode === mode.key ? '#ffffff' : '#64748b',
                          border: `1px solid ${importMode === mode.key ? '#2563eb' : '#e2e8f0'}`,
                          transition: 'all 0.15s ease',
                          textAlign: 'center',
                        }}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 2: File Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{
                  backgroundColor: isDragging ? '#eff6ff' : '#ffffff',
                  borderRadius: '20px',
                  border: `2px dashed ${isDragging ? '#2563eb' : '#cbd5e1'}`,
                  padding: '32px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
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
                    margin: '0 auto 12px auto',
                  }}
                >
                  <FileSpreadsheet size={28} />
                </div>

                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                  {fileName ? (
                    <span style={{ color: '#2563eb' }}>Selected: {fileName}</span>
                  ) : (
                    'Click to upload or drag and drop your Complaint .xlsx file'
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Strictly Microsoft Excel OpenXML Spreadsheet (.xlsx). CSV files are rejected.
                </div>
              </div>

              {/* Step 3: Preview and Row Validation Summary */}
              {previewLoading && (
                <div
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#2563eb' }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                    Validating tickets, verifying SLA parameters & checking duplicate IDs...
                  </div>
                </div>
              )}

              {previewData && !previewLoading && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    padding: '20px',
                  }}
                >
                  {/* Summary Metric Counters */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>Total Rows Parsed</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                        {previewData.totalRows || 0}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                      }}
                    >
                      <div style={{ fontSize: '0.74rem', color: '#1e40af', fontWeight: 700 }}>Valid Tickets Ready</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
                        {previewData.validRowsCount || 0}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: (previewData.invalidRowsCount || 0) > 0 ? '#fef2f2' : '#f8fafc',
                        border: `1px solid ${(previewData.invalidRowsCount || 0) > 0 ? '#fecaca' : '#e2e8f0'}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: (previewData.invalidRowsCount || 0) > 0 ? '#991b1b' : '#64748b',
                          fontWeight: 700,
                        }}
                      >
                        Invalid (Skipped)
                      </div>
                      <div
                        style={{
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          color: (previewData.invalidRowsCount || 0) > 0 ? '#dc2626' : '#0f172a',
                          marginTop: '2px',
                        }}
                      >
                        {previewData.invalidRowsCount || 0}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: (previewData.duplicatesCount || 0) > 0 ? '#fffbeb' : '#f8fafc',
                        border: `1px solid ${(previewData.duplicatesCount || 0) > 0 ? '#fde68a' : '#e2e8f0'}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: (previewData.duplicatesCount || 0) > 0 ? '#92400e' : '#64748b',
                          fontWeight: 700,
                        }}
                      >
                        Duplicate Matches
                      </div>
                      <div
                        style={{
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          color: (previewData.duplicatesCount || 0) > 0 ? '#d97706' : '#0f172a',
                          marginTop: '2px',
                        }}
                      >
                        {previewData.duplicatesCount || 0}
                      </div>
                    </div>
                  </div>

                  {/* Preview Table with row validation flags */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                      Row-wise Ticket Validation & SLA Auto-Computation
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      Showing preview of top parsed complaint tickets
                    </div>
                  </div>

                  <div
                    style={{
                      maxHeight: '280px',
                      overflowY: 'auto',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1 }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Row</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Status</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Customer Name</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Subject</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Category</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Priority & SLA</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Assignee</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Validation Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.rows.slice(0, 50).map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              backgroundColor: !row.isValid ? '#fef2f2' : row.isDuplicate ? '#fffbeb' : '#ffffff',
                            }}
                          >
                            <td style={{ padding: '8px 12px', color: '#64748b' }}>#{row.rowIndex}</td>
                            <td style={{ padding: '8px 12px' }}>
                              {!row.isValid ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    backgroundColor: '#fee2e2',
                                    color: '#b91c1c',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  <XCircle size={11} /> Invalid
                                </span>
                              ) : row.isDuplicate ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    backgroundColor: '#fef3c7',
                                    color: '#b45309',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  <AlertTriangle size={11} /> Duplicate
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    backgroundColor: '#dbeafe',
                                    color: '#1d4ed8',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  <CheckCircle2 size={11} /> Ready
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>
                              {row.customerName || '—'}
                            </td>
                            <td style={{ padding: '8px 12px', color: '#334155' }}>
                              {row.subject || '—'}
                            </td>
                            <td style={{ padding: '8px 12px', color: '#475569' }}>
                              {row.category || 'Service'}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  backgroundColor:
                                    row.priority === 'Urgent'
                                      ? '#ffe4e6'
                                      : row.priority === 'High'
                                      ? '#ffedd5'
                                      : '#eff6ff',
                                  color:
                                    row.priority === 'Urgent'
                                      ? '#e11d48'
                                      : row.priority === 'High'
                                      ? '#c2410c'
                                      : '#1d4ed8',
                                }}
                              >
                                <Zap size={10} />
                                {row.priority || 'Medium'} ({row.slaDeadlineHours || 24}h)
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px', color: '#475569' }}>
                              {row.assignedTo || 'Logged-in User'}
                            </td>
                            <td style={{ padding: '8px 12px', color: !row.isValid ? '#b91c1c' : row.isDuplicate ? '#b45309' : '#059669', fontSize: '0.74rem' }}>
                              {row.errors && row.errors.length > 0
                                ? row.errors.join(', ')
                                : row.isDuplicate
                                ? `Matches existing ticket (${row.duplicateReason || 'Ticket ID match'})`
                                : 'All validation rules passed'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Step 4: Execute Import Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={resetImportState}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #e2e8f0',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                      }}
                    >
                      Clear File
                    </button>

                    <button
                      type="button"
                      disabled={importLoading || (previewData.validRowsCount || 0) === 0}
                      onClick={handleExecuteImport}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 22px',
                        borderRadius: '10px',
                        backgroundColor: (previewData.validRowsCount || 0) > 0 ? '#2563eb' : '#94a3b8',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        cursor: (previewData.validRowsCount || 0) > 0 ? 'pointer' : 'not-allowed',
                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {importLoading ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Importing Tickets...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          <span>Commit Import ({previewData.validRowsCount || 0} Tickets)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Import Outcome Card */}
              {importResult && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1.5px solid #bfdbfe',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                        Complaint Import Completed
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {importResult.message || 'Complaint tickets have been synchronized and SLAs configured.'}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '10px',
                    }}
                  >
                    <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Total Processed</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{importResult.totalProcessed || 0}</div>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: '#ecfdf5', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#065f46', fontWeight: 700 }}>Created New</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>{importResult.createdCount || 0}</div>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: '#eff6ff', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: 700 }}>Updated Existing</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2563eb' }}>{importResult.updatedCount || 0}</div>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: '#fffbeb', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 700 }}>Skipped / Errors</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#d97706' }}>{importResult.skippedCount || 0}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintImportModal;
