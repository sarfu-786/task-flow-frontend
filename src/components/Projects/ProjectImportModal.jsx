import React, { useState } from 'react';
import { useProjects } from '../../context/ProjectContext';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Layers,
  Sparkles,
  Download,
  ChevronDown,
} from 'lucide-react';
import { exportToExcel } from '../../services/exportUtils';

export const ProjectImportModal = ({ isOpen, onClose }) => {
  const { previewProjectExcel, importProjectExcel, fetchProjects } = useProjects();

  const [step, setStep] = useState(1); // 1: Upload, 2: Mapping, 3: Preview, 4: Results
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState('');
  const [headers, setHeaders] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);

  // Field mappings (TaskFlow field -> File column header)
  const [mapping, setMapping] = useState({
    name: '',
    clientName: '',
    category: '',
    budget: '',
    targetDate: '',
    priority: '',
    managerName: '',
    description: '',
  });

  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [importSummary, setImportSummary] = useState(null);

  if (!isOpen) return null;

  const resetModal = () => {
    setStep(1);
    setFile(null);
    setFileName('');
    setFileData('');
    setHeaders([]);
    setAllRows([]);
    setPreviewRows([]);
    setMapping({
      name: '',
      clientName: '',
      category: '',
      budget: '',
      targetDate: '',
      priority: '',
      managerName: '',
      description: '',
    });
    setError('');
    setImportSummary(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setError('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = event.target.result;
        setFileData(base64);

        const res = await previewProjectExcel(base64, selectedFile.name);
        if (res && res.success) {
          setHeaders(res.headers || []);
          setAllRows(res.allRows || []);
          setPreviewRows(res.previewRows || []);

          // Auto-guess mapping
          const autoMap = { ...mapping };
          (res.headers || []).forEach((h) => {
            const lower = h.toLowerCase().trim();
            if (lower.includes('project') || lower === 'name' || lower.includes('title')) autoMap.name = h;
            if (lower.includes('client') || lower.includes('company') || lower.includes('account')) autoMap.clientName = h;
            if (lower.includes('budget') || lower.includes('cost') || lower.includes('amount') || lower.includes('value')) autoMap.budget = h;
            if (lower.includes('date') || lower.includes('target') || lower.includes('deadline') || lower.includes('end')) autoMap.targetDate = h;
            if (lower.includes('manager') || lower.includes('owner') || lower.includes('lead')) autoMap.managerName = h;
            if (lower.includes('priority')) autoMap.priority = h;
            if (lower.includes('category') || lower.includes('domain') || lower.includes('type')) autoMap.category = h;
            if (lower.includes('description') || lower.includes('scope') || lower.includes('summary')) autoMap.description = h;
          });
          setMapping(autoMap);
          setStep(2);
        } else {
          setError(res?.message || 'Could not parse Excel/CSV structure');
        }
      } catch (err) {
        console.error('[Import Parse Error]', err);
        setError('Failed to parse file: ' + err.message);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDownloadTemplate = () => {
    const templateRows = [
      {
        'Project Name': 'Cloud Infrastructure Migration',
        'Client / Account Name': 'Acme Global Ltd',
        'Total Budget': 35000,
        'Target Completion Date': new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        'Project Manager': 'Sarah Connor',
        Priority: 'High',
        'Category / Domain': 'Cloud Migration',
        'Scope Description': 'Migrate on-premise compute cluster to AWS GovCloud',
      },
      {
        'Project Name': 'Mobile CRM Native Application',
        'Client / Account Name': 'Nexus Retail Corp',
        'Total Budget': 24000,
        'Target Completion Date': new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        'Project Manager': 'Alex Rivera',
        Priority: 'Medium',
        'Category / Domain': 'Mobile Development',
        'Scope Description': 'iOS and Android field operations application',
      },
    ];

    exportToExcel('Projects_Import_Template', templateRows, [
      { key: 'Project Name', label: 'Project Name' },
      { key: 'Client / Account Name', label: 'Client / Account Name' },
      { key: 'Total Budget', label: 'Total Budget' },
      { key: 'Target Completion Date', label: 'Target Completion Date' },
      { key: 'Project Manager', label: 'Project Manager' },
      { key: 'Priority', label: 'Priority' },
      { key: 'Category / Domain', label: 'Category / Domain' },
      { key: 'Scope Description', label: 'Scope Description' },
    ], {
      sheetName: 'Import Template',
      title: 'TaskFlow Pro Projects Import Template',
    });
  };

  const handleExecuteImport = async () => {
    if (!mapping.name || !mapping.clientName) {
      setError('Please map both Project Name and Client Name before importing.');
      setStep(2);
      return;
    }

    try {
      setImporting(true);
      setError('');

      const res = await importProjectExcel(fileData, fileName, mapping);
      if (res && res.success) {
        setImportSummary(res.summary || {
          totalRows: allRows.length,
          imported: res.imported || allRows.length,
          failed: 0,
          duplicates: 0,
        });
        setStep(4);
        if (fetchProjects) fetchProjects();
      } else {
        setError(res?.message || 'Import failed');
      }
    } catch (err) {
      console.error('[Import Execution Error]', err);
      setError('Import process failed: ' + err.message);
    } finally {
      setImporting(false);
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
          maxWidth: '680px',
          width: '100%',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
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
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #bfdbfe',
                flexShrink: 0,
              }}
            >
              <Upload size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Import Project Records
              </h2>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                Batch import project records via Excel (.xlsx / .xls) or CSV
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Stepper Wizard Bar */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#f8fafc',
            borderBottom: '1.5px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            fontWeight: 700,
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          {[
            { num: 1, label: 'Upload File' },
            { num: 2, label: 'Field Mapping' },
            { num: 3, label: 'Data Preview' },
            { num: 4, label: 'Import Summary' },
          ].map((s) => {
            const isCurrent = step === s.num;
            const isDone = step > s.num;
            return (
              <div
                key={s.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  color: isCurrent ? '#2563eb' : isDone ? '#059669' : '#94a3b8',
                }}
              >
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor: isCurrent ? '#2563eb' : isDone ? '#ecfdf5' : '#e2e8f0',
                    color: isCurrent ? '#ffffff' : isDone ? '#059669' : '#64748b',
                    border: isDone ? '1px solid #a7f3d0' : 'none',
                  }}
                >
                  {isDone ? '✓' : s.num}
                </span>
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '10px',
                color: '#dc2626',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Upload */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center', padding: '16px 0' }}>
              <div
                onClick={() => document.getElementById('project-file-input').click()}
                style={{
                  width: '100%',
                  maxWidth: '480px',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '20px',
                  padding: '36px 20px',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
              >
                <input
                  type="file"
                  id="project-file-input"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <FileSpreadsheet size={44} style={{ color: '#2563eb', margin: '0 auto 12px auto' }} />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  Click to select spreadsheet or drag and drop
                </h3>
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  Supports Microsoft Excel (.xlsx / .xls) and CSV spreadsheet files
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>Need the standard import format?</span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  style={{
                    height: '34px',
                    padding: '0 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#2563eb',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Download size={14} />
                  <span>Download Sample Template</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Field Mapping */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                  Map Spreadsheet Columns to Project Attributes
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  File: <strong style={{ color: '#0f172a' }}>{fileName}</strong> ({allRows.length} rows detected)
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1.5px solid #e2e8f0' }}>
                {[
                  { key: 'name', label: 'Project Name', required: true },
                  { key: 'clientName', label: 'Client / Account Name', required: true },
                  { key: 'budget', label: 'Total Budget (USD / INR)', required: false },
                  { key: 'targetDate', label: 'Target Completion Date', required: false },
                  { key: 'managerName', label: 'Project Manager', required: false },
                  { key: 'priority', label: 'Priority', required: false },
                  { key: 'category', label: 'Category / Domain', required: false },
                  { key: 'description', label: 'Scope Description', required: false },
                ].map((field) => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '4px' }}>
                      {field.label} {field.required && <span style={{ color: '#dc2626' }}>*</span>}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={mapping[field.key] || ''}
                        onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
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
                        <option value="">-- Do not import / Auto --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Preview Data */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                  Preview First {previewRows.length} Records
                </h4>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                  Total {allRows.length} projects ready to import
                </span>
              </div>

              <div style={{ overflowX: 'auto', border: '1.5px solid #e2e8f0', borderRadius: '14px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontWeight: 800, fontSize: '11px' }}>
                    <tr>
                      <th style={{ padding: '10px 14px' }}>#</th>
                      <th style={{ padding: '10px 14px' }}>Project Name</th>
                      <th style={{ padding: '10px 14px' }}>Client</th>
                      <th style={{ padding: '10px 14px' }}>Budget</th>
                      <th style={{ padding: '10px 14px' }}>Target Date</th>
                      <th style={{ padding: '10px 14px' }}>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{idx + 1}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>
                          {r[mapping.name] || r.name || r['Project Name'] || '—'}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#334155' }}>
                          {r[mapping.clientName] || r.clientName || r['Client Name'] || '—'}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 800, color: '#059669' }}>
                          ${Number(r[mapping.budget] || r.budget || r['Total Budget'] || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#64748b' }}>
                          {r[mapping.targetDate] || r.targetDate || r['Target Completion Date'] || '—'}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#334155' }}>
                            {r[mapping.priority] || r.priority || 'Medium'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: Results */}
          {step === 4 && importSummary && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  Import Process Completed!
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Successfully imported project portfolio records into your permitted workspace
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', width: '100%', maxWidth: '440px', paddingTop: '10px' }}>
                <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Total Rows</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    {importSummary.totalRows || 0}
                  </p>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#059669' }}>Imported</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#059669' }}>
                    {importSummary.imported || 0}
                  </p>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Failed / Skipped</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#475569' }}>
                    {importSummary.failed || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1.5px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            {step > 1 && step < 4 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                style={{
                  height: '38px',
                  padding: '0 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {step < 4 && (
              <button
                type="button"
                onClick={handleClose}
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
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(3)}
                style={{
                  height: '38px',
                  padding: '0 20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  cursor: 'pointer',
                }}
              >
                <span>Continue to Preview</span>
                <ArrowRight size={15} />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                disabled={importing}
                onClick={handleExecuteImport}
                style={{
                  height: '38px',
                  padding: '0 22px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  cursor: 'pointer',
                }}
              >
                <Upload size={15} />
                <span>{importing ? 'Importing Records...' : 'Execute Import'}</span>
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                onClick={handleClose}
                style={{
                  height: '38px',
                  padding: '0 24px',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectImportModal;
