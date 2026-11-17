import React, { useRef, useState } from 'react';
import { UploadCloud, File, FileText, Image, X, AlertCircle } from 'lucide-react';

export const AttachmentUploader = ({
  attachments = [],
  setAttachments,
  maxFiles = 3,
  maxSizeMB = 5,
}) => {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleFiles = (files) => {
    setErrorMsg('');
    const fileList = Array.from(files);

    if (attachments.length + fileList.length > maxFiles) {
      setErrorMsg(`Maximum ${maxFiles} attachments allowed per ticket.`);
      return;
    }

    const validFiles = [];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    for (const file of fileList) {
      if (file.size > maxSizeBytes) {
        setErrorMsg(`"${file.name}" exceeds the ${maxSizeMB}MB file size limit.`);
        return;
      }

      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      if (!isImage && !isPdf) {
        setErrorMsg(`Only images (PNG, JPG, WEBP) and PDF files are allowed.`);
        return;
      }

      validFiles.push(file);
    }

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const item = {
          id: 'att_' + Date.now() + '_' + Math.random().toString(16).substring(2, 6),
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: e.target.result,
          uploadedAt: new Date().toISOString(),
        };
        setAttachments((prev) => [...prev, item]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemove = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        style={{
          border: `2px dashed ${dragOver ? '#2563eb' : '#cbd5e1'}`,
          background: dragOver ? '#eff6ff' : '#f8fafc',
          borderRadius: '12px',
          padding: '16px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <UploadCloud size={24} color="#64748b" />
        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>
          Drop error screenshots or PDFs here, or <span style={{ color: '#2563eb' }}>browse</span>
        </div>
        <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
          Supports PNG, JPG, WEBP, PDF (Max {maxFiles} files, up to {maxSizeMB}MB each)
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            color: '#dc2626',
            background: '#fef2f2',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid #fee2e2',
          }}
        >
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Attachment List / Thumbnails */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
          {attachments.map((att, idx) => {
            const isImg = att.type && att.type.startsWith('image/');
            return (
              <div
                key={att.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '6px 10px',
                  maxWidth: '240px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {isImg && att.dataUrl ? (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      objectFit: 'cover',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                    }}
                  >
                    <FileText size={16} />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#1e293b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={att.name}
                  >
                    {att.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    {formatFileSize(att.size)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(idx);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Remove file"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
