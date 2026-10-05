import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useLeads } from '../../context/LeadContext';
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
  ArrowLeft,
  RefreshCw,
  X,
  FileSpreadsheet,
  AlertCircle,
  Search,
  Filter,
  Layers,
  Sparkles,
  HelpCircle,
  FileCheck,
  Check,
  ChevronRight,
  User,
  Building,
  Phone,
  Mail,
  DollarSign,
  Tag,
  Briefcase,
  MapPin,
  FileText,
} from 'lucide-react';
import { exportToExcel } from '../../services/exportUtils';

// Standard CRM Lead field definitions for Column Mapping
const LEAD_SYSTEM_FIELDS = [
  {
    key: 'name',
    label: 'Lead / Contact Name',
    required: true,
    description: 'Full name of the prospect or contact person',
    icon: User,
    aliases: ['name', 'full name', 'lead name', 'contact name', 'customer name', 'client name', 'person', 'contact'],
  },
  {
    key: 'email',
    label: 'Email Address',
    required: false,
    requiredNotice: 'Required if Phone is missing',
    description: 'Direct email address used for duplicate detection',
    icon: Mail,
    aliases: ['email', 'email address', 'e-mail', 'mail', 'email id', 'contact email'],
  },
  {
    key: 'phone',
    label: 'Phone / Mobile Number',
    required: false,
    requiredNotice: 'Required if Email is missing',
    description: 'Telephone or mobile number with country code',
    icon: Phone,
    aliases: ['phone', 'mobile', 'mobile number', 'phone number', 'cell', 'telephone', 'contact number', 'tel'],
  },
  {
    key: 'company',
    label: 'Company / Account Name',
    required: false,
    description: 'Organization, corporate or business account',
    icon: Building,
    aliases: ['company', 'company name', 'organization', 'org', 'account', 'business name', 'client', 'firm'],
  },
  {
    key: 'jobTitle',
    label: 'Job Title / Designation',
    required: false,
    description: 'Role or designation within the client organization',
    icon: Briefcase,
    aliases: ['job title', 'title', 'designation', 'role', 'position', 'job role'],
  },
  {
    key: 'source',
    label: 'Lead Source',
    required: false,
    description: 'Origin channel (e.g. Website, Referral, LinkedIn, Cold Call)',
    icon: Tag,
    aliases: ['source', 'lead source', 'source channel', 'channel', 'campaign', 'origin', 'medium'],
  },
  {
    key: 'status',
    label: 'Lead Status / Stage',
    required: false,
    description: 'Current pipeline stage (New, Contacted, Follow-Up, Qualified)',
    icon: Layers,
    aliases: ['status', 'lead status', 'stage', 'lead stage', 'pipeline stage'],
  },
  {
    key: 'priority',
    label: 'Priority Level',
    required: false,
    description: 'Urgency tier (Low, Medium, High, Urgent)',
    icon: AlertTriangle,
    aliases: ['priority', 'priority level', 'urgency', 'importance', 'tier'],
  },
  {
    key: 'estimatedValue',
    label: 'Estimated Deal Value (INR)',
    required: false,
    description: 'Expected deal value or budget in INR',
    icon: DollarSign,
    aliases: ['estimated value', 'deal value', 'value', 'amount', 'budget', 'pipeline value', 'deal size', 'estimated value (inr)', 'price'],
  },
  {
    key: 'assignedTo',
    label: 'Assigned User / Sales Rep',
    required: false,
    description: 'Responsible team member (must obey hierarchy rules)',
    icon: User,
    aliases: ['assigned to', 'assigned user', 'owner', 'agent', 'sales rep', 'representative', 'assignee'],
  },
  {
    key: 'industry',
    label: 'Industry / Domain',
    required: false,
    description: 'Client market vertical or industry domain',
    icon: Building,
    aliases: ['industry', 'domain', 'vertical', 'sector', 'business category'],
  },
  {
    key: 'city',
    label: 'City / Region',
    required: false,
    description: 'Geographic location or city',
    icon: MapPin,
    aliases: ['city', 'location', 'region', 'state', 'town'],
  },
  {
    key: 'country',
    label: 'Country',
    required: false,
    description: 'Country of prospect location',
    icon: MapPin,
    aliases: ['country', 'nation'],
  },
  {
    key: 'notes',
    label: 'Requirements / Notes',
    required: false,
    description: 'Initial customer requirements or notes',
    icon: FileText,
    aliases: ['requirement', 'notes', 'remarks', 'description', 'comments', 'requirement / notes', 'details'],
  },
];

export const LeadImportModal = ({ isOpen, onClose }) => {
  const { fetchLeads } = useLeads();
  const { user } = useAuth();

  // Wizard Steps: 1 = Upload, 2 = Map Columns, 3 = Validate & Preview, 4 = Results
  const [step, setStep] = useState(1);
  const [activeView, setActiveView] = useState('wizard'); // 'wizard' | 'history'

  // File state
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileBase64, setFileBase64] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Column mapping state
  const [detectedHeaders, setDetectedHeaders] = useState([]);
  const [sampleRawRows, setSampleRawRows] = useState([]);
  const [mapping, setMapping] = useState({});

  // Preview & Validation state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [importMode, setImportMode] = useState('skip_duplicates'); // 'skip_duplicates' | 'upsert'
  const [previewFilter, setPreviewFilter] = useState('all'); // 'all' | 'valid' | 'duplicate' | 'error'
  const [previewSearch, setPreviewSearch] = useState('');

  // Import execution & progress state
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, percentage: 0, text: '' });
  const [importResult, setImportResult] = useState(null);

  // History state
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  // Notifications / Alert message
  const [statusMessage, setStatusMessage] = useState(null);

  const fileInputRef = useRef(null);

  // Reset state whenever modal opens or closes
  useEffect(() => {
    if (isOpen) {
      resetModalState();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const resetModalState = () => {
    setStep(1);
    setActiveView('wizard');
    setFile(null);
    setFileName('');
    setFileBase64('');
    setFileSize('');
    setDetectedHeaders([]);
    setSampleRawRows([]);
    setMapping({});
    setPreviewData(null);
    setPreviewLoading(false);
    setImportLoading(false);
    setImportResult(null);
    setImportMode('skip_duplicates');
    setPreviewFilter('all');
    setPreviewSearch('');
    setStatusMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  // 1. Download Sample Templates
  const handleDownloadTemplate = async (format = 'xlsx') => {
    try {
      setStatusMessage(null);
      const blob = await api.downloadLeadExcelTemplate(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'csv' ? 'Lead_Import_Template.csv' : 'Lead_Import_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || `Failed to download ${format.toUpperCase()} template.`,
      });
    }
  };

  // 2. Load Import History
  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.getLeadExcelHistory();
      if (res && res.success) {
        const imports = (res.history || []).filter(
          (h) => h.action === 'IMPORT_EXCEL' || (h.details && h.details.toLowerCase().includes('import'))
        );
        setHistoryData(imports);
      }
    } catch (err) {
      console.error('[LeadImportModal] Load History Error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 3. File Selection & Drag & Drop Handling
  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    const lowerName = selectedFile.name.toLowerCase();
    const isSupported = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv');

    if (!isSupported) {
      setStatusMessage({
        type: 'error',
        text: 'Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.',
      });
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setStatusMessage({
        type: 'error',
        text: 'File size exceeds maximum allowable limit of 15MB.',
      });
      return;
    }

    setStatusMessage(null);
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileSize((selectedFile.size / 1024).toFixed(1) + ' KB');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      setFileBase64(base64);
      await parseFileHeadersAndAdvance(base64, selectedFile.name);
    };
    reader.readAsDataURL(selectedFile);
  };

  // 4. Initial File Parsing for Header Detection & Initial Auto-Mapping
  const parseFileHeadersAndAdvance = async (base64, name) => {
    try {
      setPreviewLoading(true);
      setStatusMessage(null);

      const res = await api.previewLeadExcel(base64, name, null);
      if (res && res.success) {
        const headers = res.headers || [];
        setDetectedHeaders(headers);
        setSampleRawRows(res.rawRows || []);

        // Auto-guess best column mappings
        const initialMapping = {};
        LEAD_SYSTEM_FIELDS.forEach((field) => {
          let matchedHeader = '';
          for (const alias of field.aliases) {
            const found = headers.find((h) => h.toLowerCase().trim() === alias || h.toLowerCase().trim().replace(/[^a-z0-9]/g, '') === alias.replace(/[^a-z0-9]/g, ''));
            if (found) {
              matchedHeader = found;
              break;
            }
          }
          if (!matchedHeader) {
            // Secondary fuzzy check
            for (const alias of field.aliases) {
              const found = headers.find((h) => h.toLowerCase().includes(alias));
              if (found) {
                matchedHeader = found;
                break;
              }
            }
          }
          initialMapping[field.key] = matchedHeader || '';
        });

        setMapping(initialMapping);
        setStep(2); // Advance to Column Mapping Step
      } else {
        setStatusMessage({
          type: 'error',
          text: res?.message || 'Failed to inspect file structure. Ensure valid columns.',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to parse file. Please verify format and contents.',
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // 5. Run Full Validation with Configured Column Mapping
  const handleValidateAndPreview = async () => {
    // Check mandatory mapping: Name is required, and either Email or Phone must be mapped
    if (!mapping.name) {
      setStatusMessage({
        type: 'error',
        text: 'Please map the "Lead / Contact Name" field before continuing.',
      });
      return;
    }
    if (!mapping.email && !mapping.phone) {
      setStatusMessage({
        type: 'error',
        text: 'Please map at least "Email Address" or "Phone Number" to identify leads.',
      });
      return;
    }

    try {
      setPreviewLoading(true);
      setStatusMessage(null);

      const res = await api.previewLeadExcel(fileBase64, fileName, mapping);
      if (res && res.success) {
        setPreviewData(res);
        setStep(3); // Advance to Validate & Preview Step
      } else {
        setStatusMessage({
          type: 'error',
          text: res?.message || 'Validation failed. Please check your mapping.',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Validation failed: ' + err.message,
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // 6. Execute Final Batch Import with Non-Blocking Progress
  const handleExecuteImport = async () => {
    if (!previewData || !previewData.rows || previewData.rows.length === 0) return;

    // Filter rows to import: only valid rows
    const rowsToImport = previewData.rows.filter((r) => r.isValid);

    if (rowsToImport.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'No valid lead records available to import. Please correct mappings.',
      });
      return;
    }

    try {
      setImportLoading(true);
      setStatusMessage(null);
      setImportProgress({
        current: 0,
        total: rowsToImport.length,
        percentage: 0,
        text: `Preparing batch import of ${rowsToImport.length} leads...`,
      });

      // Split into batches of 250 records to prevent HTTP timeouts and allow smooth progress
      const BATCH_SIZE = 250;
      const totalBatches = Math.ceil(rowsToImport.length / BATCH_SIZE);
      let totalCreated = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;
      const allErrors = [];

      for (let b = 0; b < totalBatches; b++) {
        const chunk = rowsToImport.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
        const currentProcessed = Math.min((b + 1) * BATCH_SIZE, rowsToImport.length);
        const percentage = Math.round((currentProcessed / rowsToImport.length) * 100);

        setImportProgress({
          current: currentProcessed,
          total: rowsToImport.length,
          percentage,
          text: `Processing batch ${b + 1} of ${totalBatches} (${currentProcessed} / ${rowsToImport.length} leads)...`,
        });

        const payload = {
          rows: chunk,
          mode: importMode,
          fileName: fileName || 'leads_import.xlsx',
        };

        const result = await api.importLeadExcel(payload);
        if (result && result.success) {
          totalCreated += result.createdCount || 0;
          totalUpdated += result.updatedCount || 0;
          totalSkipped += result.skippedCount || 0;
          if (Array.isArray(result.errors)) {
            allErrors.push(...result.errors);
          }
        } else {
          allErrors.push(result?.message || `Batch ${b + 1} failed`);
        }

        // Small yield to let React render progress UI
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Final results summary
      const finalResult = {
        success: true,
        message: `Import processed: ${totalCreated} created, ${totalUpdated} updated, ${totalSkipped} skipped.`,
        createdCount: totalCreated,
        updatedCount: totalUpdated,
        skippedCount: totalSkipped,
        failedCount: (previewData.invalidCount || 0) + allErrors.length,
        errors: allErrors,
        totalAttempted: previewData.totalRows,
      };

      setImportResult(finalResult);
      setStep(4); // Advance to Results Step

      if (fetchLeads) {
        fetchLeads(true);
      }
    } catch (err) {
      console.error('[Import Execution Error]', err);
      setStatusMessage({
        type: 'error',
        text: 'Import error: ' + (err.message || 'Failed to complete import'),
      });
    } finally {
      setImportLoading(false);
    }
  };

  // 7. Download Error Report
  const handleDownloadErrorReport = () => {
    if (!previewData || !previewData.rows) return;

    const failedAndSkipped = previewData.rows.filter((r) => !r.isValid || r.isDuplicate);
    if (failedAndSkipped.length === 0) {
      alert('No errors or skipped records to export.');
      return;
    }

    const reportRows = failedAndSkipped.map((r) => ({
      'Row Number': r.rowIndex,
      'Validation Status': r.isValid ? (r.isDuplicate ? 'DUPLICATE' : 'VALID') : 'INVALID',
      'Lead Name': r.name || '—',
      'Company': r.company || '—',
      'Email': r.email || '—',
      'Phone': r.phone || '—',
      'Issues / Rejection Reason': [...(r.errors || []), ...(r.warnings || [])].join(' | ') || 'None',
    }));

    exportToExcel(
      `Lead_Import_Error_Report_${new Date().toISOString().slice(0, 10)}`,
      reportRows,
      [
        { key: 'Row Number', label: 'Row Number' },
        { key: 'Validation Status', label: 'Validation Status' },
        { key: 'Lead Name', label: 'Lead Name' },
        { key: 'Company', label: 'Company' },
        { key: 'Email', label: 'Email' },
        { key: 'Phone', label: 'Phone' },
        { key: 'Issues / Rejection Reason', label: 'Issues / Rejection Reason' },
      ],
      { sheetName: 'Import Errors' }
    );
  };

  if (!isOpen) return null;

  // Filtered preview rows
  const allPreviewRows = previewData?.rows || [];
  const filteredPreviewRows = allPreviewRows.filter((r) => {
    if (previewFilter === 'valid' && (!r.isValid || r.isDuplicate)) return false;
    if (previewFilter === 'duplicate' && !r.isDuplicate) return false;
    if (previewFilter === 'error' && r.isValid) return false;

    if (previewSearch.trim()) {
      const q = previewSearch.trim().toLowerCase();
      const matchName = (r.name || '').toLowerCase().includes(q);
      const matchCompany = (r.company || '').toLowerCase().includes(q);
      const matchEmail = (r.email || '').toLowerCase().includes(q);
      const matchPhone = (r.phone || '').toLowerCase().includes(q);
      const matchNotes = (r.notes || '').toLowerCase().includes(q);
      const matchErrors = (r.errors || []).join(' ').toLowerCase().includes(q);
      if (!matchName && !matchCompany && !matchEmail && !matchPhone && !matchNotes && !matchErrors) {
        return false;
      }
    }
    return true;
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.68)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={handleClose}
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
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #ffffff, #f0fdf4)',
            flexWrap: 'wrap',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
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
              <Upload size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.18rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Bulk Lead Import
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 9px',
                    borderRadius: '999px',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  .xlsx, .xls, .csv
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Upload multiple prospects, map columns, validate data & duplicates, and import into Lead Management.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* View History Log Toggle */}
            <button
              type="button"
              onClick={() => {
                if (activeView === 'wizard') {
                  setActiveView('history');
                  loadHistory();
                } else {
                  setActiveView('wizard');
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: activeView === 'history' ? '#ecfdf5' : '#f8fafc',
                color: activeView === 'history' ? '#059669' : '#475569',
                border: `1px solid ${activeView === 'history' ? '#a7f3d0' : '#e2e8f0'}`,
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <History size={14} />
              <span>{activeView === 'history' ? 'Back to Import' : 'Import History'}</span>
            </button>

            {/* Separator */}
            <div style={{ width: '1px', height: '22px', backgroundColor: '#e2e8f0', margin: '0 2px' }} />

            {/* Top Close Button */}
            <button
              type="button"
              onClick={handleClose}
              id="btn-close-lead-import-modal"
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
              aria-label="Close modal"
              title="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Step Wizard Progress Header (Only in Wizard View) */}
        {activeView === 'wizard' && (
          <div
            style={{
              padding: '12px 24px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              flexWrap: 'wrap',
            }}
          >
            {[
              { num: 1, label: 'Upload File' },
              { num: 2, label: 'Map Columns' },
              { num: 3, label: 'Validate & Preview' },
              { num: 4, label: 'Import Results' },
            ].map((s, index, arr) => {
              const isActive = step === s.num;
              const isPast = step > s.num;

              return (
                <React.Fragment key={s.num}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: isActive ? '#eff6ff' : isPast ? '#ecfdf5' : 'transparent',
                      border: `1px solid ${isActive ? '#bfdbfe' : isPast ? '#a7f3d0' : 'transparent'}`,
                      color: isActive ? '#1d4ed8' : isPast ? '#059669' : '#94a3b8',
                      fontSize: '0.78rem',
                      fontWeight: isActive || isPast ? 700 : 500,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: isActive ? '#2563eb' : isPast ? '#059669' : '#e2e8f0',
                        color: isActive || isPast ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                      }}
                    >
                      {isPast ? <Check size={12} strokeWidth={3} /> : s.num}
                    </div>
                    <span>{s.label}</span>
                  </div>

                  {index < arr.length - 1 && (
                    <ChevronRight size={14} color="#cbd5e1" style={{ margin: '0 2px' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Modal Body */}
        <div
          style={{
            padding: '22px 24px',
            backgroundColor: '#f8fafc',
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Status Message Alert */}
          {statusMessage && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
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
                fontSize: '0.84rem',
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
            /* ========================================================= */
            /* HISTORY LOG VIEW                                          */
            /* ========================================================= */
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                    Audited Lead Import History
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                    Historical log of all bulk Excel/CSV lead import operations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadHistory}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
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
                <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: '#059669' }} />
                  <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>Loading import history records...</div>
                </div>
              ) : historyData.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                  <History size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                  <div style={{ fontWeight: 700, color: '#475569' }}>No past imports recorded yet.</div>
                  <div style={{ fontSize: '0.78rem', marginTop: '2px' }}>
                    Import operations executed via Excel or CSV will appear here.
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '10px 12px' }}>TIMESTAMP</th>
                        <th style={{ padding: '10px 12px' }}>FILE NAME</th>
                        <th style={{ padding: '10px 12px' }}>PERFORMED BY</th>
                        <th style={{ padding: '10px 12px' }}>OUTCOME / SUMMARY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((h, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {new Date(h.timestamp || h.createdAt).toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1e293b' }}>
                            {h.filename || h.fileName || 'leads_import.xlsx'}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#334155' }}>
                            {h.performedBy || h.user?.name || user?.name || 'System'}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#059669', fontWeight: 600 }}>
                            {h.delta || h.details || 'Import Completed'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : step === 1 ? (
            /* ========================================================= */
            /* STEP 1: UPLOAD FILE & SAMPLE TEMPLATE                     */
            /* ========================================================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Drag & Drop Upload Zone */}
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
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{
                  border: `2px dashed ${isDragging ? '#059669' : '#cbd5e1'}`,
                  borderRadius: '20px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  backgroundColor: isDragging ? '#ecfdf5' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isDragging ? '0 8px 24px rgba(5, 150, 105, 0.12)' : 'none',
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,.xls,.csv"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    border: '1.5px solid #a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px auto',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.15)',
                  }}
                >
                  <FileSpreadsheet size={30} />
                </div>

                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                  {previewLoading ? 'Inspecting File Structure...' : 'Choose File or Drag & Drop Here'}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', maxWidth: '460px', margin: '0 auto 14px auto' }}>
                  Select your spreadsheet or CSV prospect list. Supports 1,000+ records with custom column mapping.
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={previewLoading}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      backgroundColor: '#059669',
                      border: 'none',
                      color: '#ffffff',
                      boxShadow: '0 3px 10px rgba(5, 150, 105, 0.25)',
                    }}
                  >
                    {previewLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Reading columns...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        <span>Browse File</span>
                      </>
                    )}
                  </button>
                </div>

                <div style={{ marginTop: '14px', fontSize: '0.72rem', color: '#94a3b8' }}>
                  Supported formats: <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong> • Max file size: <strong>15MB</strong>
                </div>
              </div>

              {/* Sample Templates Card & Helper Tips */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                  gap: '12px',
                }}
              >
                {/* Download Sample Template Box */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Download size={16} color="#059669" />
                      <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a' }}>
                        Need a Sample Template?
                      </div>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.4, marginBottom: '12px' }}>
                      Download our pre-formatted spreadsheet template with sample rows and column definitions.
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('xlsx')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#ecfdf5',
                        color: '#059669',
                        border: '1px solid #a7f3d0',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <FileSpreadsheet size={13} />
                      <span>Excel (.xlsx)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('csv')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#f8fafc',
                        color: '#334155',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Download size={13} />
                      <span>CSV (.csv)</span>
                    </button>
                  </div>
                </div>

                {/* Import Workflow Guide */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#334155' }}>
                    <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0 }} />
                    <span><strong>Automated Column Mapping:</strong> Custom headers are auto-detected.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#334155' }}>
                    <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0 }} />
                    <span><strong>Duplicate Prevention:</strong> Prevents creating duplicates by email/phone.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#334155' }}>
                    <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0 }} />
                    <span><strong>Hierarchy Enforced:</strong> Auto-assigns according to team reporting rules.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : step === 2 ? (
            /* ========================================================= */
            /* STEP 2: COLUMN MAPPING                                    */
            /* ========================================================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* File Info Card */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileSpreadsheet size={20} color="#059669" />
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>{fileName}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {fileSize} • {detectedHeaders.length} Columns Detected • Ready for Mapping
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <ArrowLeft size={12} />
                  <span>Choose Another File</span>
                </button>
              </div>

              {/* Column Mapping Table */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                    Match File Columns to CRM Lead Fields
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                    Review the automatically matched columns below and adjust dropdown selections if required.
                  </div>
                </div>

                <div style={{ maxHeight: '42vh', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '10px 14px', width: '38%' }}>LEAD MANAGEMENT FIELD</th>
                        <th style={{ padding: '10px 14px', width: '34%' }}>IMPORTED FILE COLUMN</th>
                        <th style={{ padding: '10px 14px', width: '28%' }}>SAMPLE VALUE (ROW 1)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {LEAD_SYSTEM_FIELDS.map((f) => {
                        const Icon = f.icon;
                        const mappedCol = mapping[f.key] || '';
                        const sampleVal = sampleRawRows[0] && mappedCol ? sampleRawRows[0][mappedCol] : '';

                        return (
                          <tr key={f.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                  style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '6px',
                                    backgroundColor: f.required ? '#eff6ff' : '#f1f5f9',
                                    color: f.required ? '#2563eb' : '#64748b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  <Icon size={14} />
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: '#1e293b' }}>
                                    {f.label} {f.required && <span style={{ color: '#dc2626' }}>*</span>}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                    {f.requiredNotice ? (
                                      <span style={{ color: '#d97706' }}>{f.requiredNotice}</span>
                                    ) : (
                                      f.description
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '10px 14px' }}>
                              <select
                                value={mapping[f.key] || ''}
                                onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  borderRadius: '8px',
                                  border: `1.5px solid ${mapping[f.key] ? '#059669' : f.required ? '#fca5a5' : '#cbd5e1'}`,
                                  backgroundColor: mapping[f.key] ? '#f0fdf4' : '#ffffff',
                                  color: mapping[f.key] ? '#065f46' : '#334155',
                                  fontSize: '0.78rem',
                                  fontWeight: mapping[f.key] ? 700 : 500,
                                  cursor: 'pointer',
                                  outline: 'none',
                                }}
                              >
                                <option value="">-- Do Not Import / Skip --</option>
                                {detectedHeaders.map((header) => (
                                  <option key={header} value={header}>
                                    {header}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td style={{ padding: '10px 14px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  maxWidth: '220px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  color: sampleVal !== undefined && sampleVal !== '' ? '#0f172a' : '#94a3b8',
                                  fontSize: '0.76rem',
                                  fontStyle: sampleVal ? 'normal' : 'italic',
                                }}
                                title={String(sampleVal || '')}
                              >
                                {sampleVal !== undefined && sampleVal !== '' ? String(sampleVal) : 'No data / Unmapped'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Action Area */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-secondary"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleValidateAndPreview}
                  disabled={previewLoading}
                  className="btn btn-primary"
                  style={{
                    padding: '9px 20px',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    backgroundColor: '#059669',
                    border: 'none',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                  }}
                >
                  {previewLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Validating Rows...</span>
                    </>
                  ) : (
                    <>
                      <span>Next: Validate & Preview</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : step === 3 ? (
            /* ========================================================= */
            /* STEP 3: VALIDATE & PREVIEW                                */
            /* ========================================================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Summary Metrics Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))',
                  gap: '10px',
                }}
              >
                {/* Total Found */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Total Records
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {previewData?.totalRows || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Records in uploaded file</div>
                </div>

                {/* Valid */}
                <div
                  style={{
                    backgroundColor: '#ecfdf5',
                    borderRadius: '12px',
                    border: '1px solid #a7f3d0',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>
                    Valid Records
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                    {previewData?.validCount || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#047857' }}>Ready for import</div>
                </div>

                {/* Duplicates */}
                <div
                  style={{
                    backgroundColor: '#fffbeb',
                    borderRadius: '12px',
                    border: '1px solid #fde68a',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>
                    Duplicates
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
                    {previewData?.duplicateCount || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#b45309' }}>Matching existing leads</div>
                </div>

                {/* Invalid / Errors */}
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    borderRadius: '12px',
                    border: '1px solid #fecaca',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                    Invalid Records
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
                    {previewData?.invalidCount || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#b91c1c' }}>Failed validation / skipped</div>
                </div>

                {/* Missing Required Data */}
                <div
                  style={{
                    backgroundColor: '#fff7ed',
                    borderRadius: '12px',
                    border: '1px solid #fed7aa',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9a3412', textTransform: 'uppercase' }}>
                    Missing Data
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ea580c', marginTop: '2px' }}>
                    {previewData?.missingRequiredCount || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#c2410c' }}>Missing name or contact</div>
                </div>
              </div>

              {/* Duplicate Handling Mode & Filter Bar */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                {/* Duplicate Policy Selection */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                    Duplicate Handling:
                  </span>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      color: importMode === 'skip_duplicates' ? '#059669' : '#64748b',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'skip_duplicates'}
                      onChange={() => setImportMode('skip_duplicates')}
                    />
                    <span>Skip Duplicates (Recommended)</span>
                  </label>

                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      color: importMode === 'upsert' ? '#2563eb' : '#64748b',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'upsert'}
                      onChange={() => setImportMode('upsert')}
                    />
                    <span>Update / Upsert Existing Leads</span>
                  </label>
                </div>

                {/* Filter and Search Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <Search
                      size={14}
                      color="#94a3b8"
                      style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type="text"
                      placeholder="Search preview rows..."
                      value={previewSearch}
                      onChange={(e) => setPreviewSearch(e.target.value)}
                      style={{
                        padding: '5px 10px 5px 30px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.76rem',
                        outline: 'none',
                        width: '180px',
                      }}
                    />
                  </div>

                  {/* Filter Pills */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#f1f5f9',
                      padding: '2px',
                      borderRadius: '8px',
                    }}
                  >
                    {[
                      { key: 'all', label: `All (${previewData?.totalRows || 0})` },
                      { key: 'valid', label: `Valid (${previewData?.validCount || 0})` },
                      { key: 'duplicate', label: `Duplicates (${previewData?.duplicateCount || 0})` },
                      { key: 'error', label: `Errors (${previewData?.invalidCount || 0})` },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setPreviewFilter(tab.key)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '0.72rem',
                          fontWeight: previewFilter === tab.key ? 700 : 500,
                          backgroundColor: previewFilter === tab.key ? '#ffffff' : 'transparent',
                          color: previewFilter === tab.key ? '#059669' : '#64748b',
                          cursor: 'pointer',
                          boxShadow: previewFilter === tab.key ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                }}
              >
                <div style={{ maxHeight: '38vh', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '8px 12px', width: '50px' }}>ROW</th>
                        <th style={{ padding: '8px 12px', width: '90px' }}>STATUS</th>
                        <th style={{ padding: '8px 12px' }}>LEAD NAME</th>
                        <th style={{ padding: '8px 12px' }}>COMPANY</th>
                        <th style={{ padding: '8px 12px' }}>CONTACT INFO</th>
                        <th style={{ padding: '8px 12px' }}>STAGE / SOURCE</th>
                        <th style={{ padding: '8px 12px' }}>VALUE</th>
                        <th style={{ padding: '8px 12px' }}>ASSIGNED TO</th>
                        <th style={{ padding: '8px 12px', minWidth: '180px' }}>VALIDATION NOTES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPreviewRows.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                            No rows matching the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPreviewRows.map((r) => {
                          const isInvalid = !r.isValid;
                          const isDup = r.isDuplicate;

                          return (
                            <tr
                              key={r.rowIndex}
                              style={{
                                borderBottom: '1px solid #f1f5f9',
                                backgroundColor: isInvalid ? '#fff5f5' : isDup ? '#fffdf0' : '#ffffff',
                              }}
                            >
                              {/* Row # */}
                              <td style={{ padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>
                                #{r.rowIndex}
                              </td>

                              {/* Status Badge */}
                              <td style={{ padding: '8px 12px' }}>
                                {isInvalid ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      padding: '2px 7px',
                                      borderRadius: '6px',
                                      backgroundColor: '#fee2e2',
                                      color: '#dc2626',
                                      fontSize: '0.68rem',
                                      fontWeight: 800,
                                    }}
                                  >
                                    <XCircle size={10} />
                                    INVALID
                                  </span>
                                ) : isDup ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      padding: '2px 7px',
                                      borderRadius: '6px',
                                      backgroundColor: '#fef3c7',
                                      color: '#d97706',
                                      fontSize: '0.68rem',
                                      fontWeight: 800,
                                    }}
                                  >
                                    <AlertTriangle size={10} />
                                    DUPLICATE
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      padding: '2px 7px',
                                      borderRadius: '6px',
                                      backgroundColor: '#ecfdf5',
                                      color: '#059669',
                                      fontSize: '0.68rem',
                                      fontWeight: 800,
                                    }}
                                  >
                                    <CheckCircle2 size={10} />
                                    VALID
                                  </span>
                                )}
                              </td>

                              {/* Lead Name */}
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f172a' }}>
                                {r.name || <span style={{ color: '#dc2626', fontStyle: 'italic' }}>[Missing Name]</span>}
                              </td>

                              {/* Company */}
                              <td style={{ padding: '8px 12px', color: '#334155' }}>
                                {r.company || '—'}
                              </td>

                              {/* Contact */}
                              <td style={{ padding: '8px 12px' }}>
                                <div style={{ color: '#0f172a', fontWeight: 500 }}>{r.email || 'No email'}</div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{r.phone || 'No phone'}</div>
                              </td>

                              {/* Stage / Source */}
                              <td style={{ padding: '8px 12px' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: '#f1f5f9',
                                    color: '#475569',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  {r.status || 'New'}
                                </span>
                                <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                                  {r.source || 'Website'}
                                </div>
                              </td>

                              {/* Value */}
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: '#059669' }}>
                                ₹{Number(r.estimatedValue || 0).toLocaleString()}
                              </td>

                              {/* Assigned To */}
                              <td style={{ padding: '8px 12px', color: '#334155' }}>
                                {r.assignedTo || 'Default (You)'}
                              </td>

                              {/* Validation Feedback */}
                              <td style={{ padding: '8px 12px' }}>
                                {r.errors && r.errors.length > 0 ? (
                                  <div style={{ color: '#dc2626', fontSize: '0.72rem', fontWeight: 600 }}>
                                    {r.errors.join(' • ')}
                                  </div>
                                ) : r.warnings && r.warnings.length > 0 ? (
                                  <div style={{ color: '#d97706', fontSize: '0.72rem', fontWeight: 600 }}>
                                    {r.warnings.join(' • ')}
                                  </div>
                                ) : (
                                  <div style={{ color: '#059669', fontSize: '0.72rem' }}>Ready to import</div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '6px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn btn-secondary"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Column Mapping</span>
                </button>

                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={importLoading || (previewData?.validCount || 0) === 0}
                  className="btn btn-primary"
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    backgroundColor: '#059669',
                    border: 'none',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
                    cursor: (previewData?.validCount || 0) === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {importLoading ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Importing Leads...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={15} />
                      <span>
                        Import Leads ({previewData?.validCount || 0} Valid Records)
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Non-blocking Import Progress Bar (during batching) */}
              {importLoading && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #bfdbfe',
                    padding: '14px',
                    marginTop: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#1e40af', marginBottom: '6px' }}>
                    <span>{importProgress.text}</span>
                    <span>{importProgress.percentage}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#eff6ff', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${importProgress.percentage}%`,
                        backgroundColor: '#2563eb',
                        borderRadius: '999px',
                        transition: 'width 0.2s ease',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ========================================================= */
            /* STEP 4: IMPORT RESULTS & ERROR REPORT DOWNLOAD            */
            /* ========================================================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', padding: '10px 0' }}>
              {/* Success Result Icon & Badge */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  border: '2px solid #a7f3d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 20px rgba(5, 150, 105, 0.2)',
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Import Completed Successfully
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                  The lead dataset was verified and imported according to your configured rules.
                </p>
              </div>

              {/* Result Metrics Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                  gap: '12px',
                  width: '100%',
                  maxWidth: '680px',
                }}
              >
                {/* Successfully Imported */}
                <div
                  style={{
                    backgroundColor: '#ecfdf5',
                    borderRadius: '14px',
                    border: '1.5px solid #a7f3d0',
                    padding: '16px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#065f46', textTransform: 'uppercase' }}>
                    Successfully Imported
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                    {(importResult?.createdCount || 0) + (importResult?.updatedCount || 0)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#047857', marginTop: '2px' }}>
                    {importResult?.createdCount || 0} Created • {importResult?.updatedCount || 0} Updated
                  </div>
                </div>

                {/* Skipped / Duplicates */}
                <div
                  style={{
                    backgroundColor: '#fffbeb',
                    borderRadius: '14px',
                    border: '1.5px solid #fde68a',
                    padding: '16px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>
                    Skipped / Duplicates
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
                    {importResult?.skippedCount || 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#b45309', marginTop: '2px' }}>
                    Duplicates prevented
                  </div>
                </div>

                {/* Failed / Invalid */}
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    borderRadius: '14px',
                    border: '1.5px solid #fecaca',
                    padding: '16px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>
                    Failed / Invalid
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                    {importResult?.failedCount || 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#b91c1c', marginTop: '2px' }}>
                    Invalid syntax/missing data
                  </div>
                </div>
              </div>

              {/* Actions Box */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                  marginTop: '10px',
                }}
              >
                {/* Download Error Report button */}
                {((importResult?.skippedCount || 0) > 0 || (importResult?.failedCount || 0) > 0) && (
                  <button
                    type="button"
                    onClick={handleDownloadErrorReport}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 18px',
                      borderRadius: '10px',
                      backgroundColor: '#ffffff',
                      color: '#b91c1c',
                      border: '1.5px solid #fecaca',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(185, 28, 28, 0.08)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Download size={14} />
                    <span>Download Error Report</span>
                  </button>
                )}

                {/* Done / View Leads */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 24px',
                    borderRadius: '10px',
                    backgroundColor: '#059669',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
                    cursor: 'pointer',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Done / View Leads in CRM</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadImportModal;
