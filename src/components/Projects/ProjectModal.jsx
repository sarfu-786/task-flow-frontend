import React, { useState, useEffect } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { useUserManagement } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  FolderKanban,
  Save,
  AlertCircle,
} from 'lucide-react';

export const ProjectModal = ({ isOpen, onClose, projectToEdit }) => {
  const { createProject, updateProject } = useProjects();
  const { users } = useUserManagement ? useUserManagement() : { users: [] };
  const { user: currentUser } = useAuth();

  const isEdit = !!projectToEdit;

  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    description: '',
    category: 'Web Application',
    priority: 'Medium',
    status: 'Planning',
    budget: 15000,
    currency: 'USD',
    startDate: new Date().toISOString().split('T')[0],
    targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    managerName: currentUser?.name || 'Unassigned',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (projectToEdit) {
      setFormData({
        name: projectToEdit.name || '',
        clientName: projectToEdit.clientName || '',
        description: projectToEdit.description || '',
        category: projectToEdit.category || 'Web Application',
        priority: projectToEdit.priority || 'Medium',
        status: projectToEdit.status || 'Planning',
        budget: projectToEdit.budget || 0,
        currency: projectToEdit.currency || 'USD',
        startDate: projectToEdit.startDate
          ? new Date(projectToEdit.startDate).toISOString().split('T')[0]
          : '',
        targetDate: projectToEdit.targetDate
          ? new Date(projectToEdit.targetDate).toISOString().split('T')[0]
          : '',
        managerName: projectToEdit.managerName || currentUser?.name || 'Unassigned',
      });
    } else {
      setFormData({
        name: '',
        clientName: '',
        description: '',
        category: 'Web Application',
        priority: 'Medium',
        status: 'Planning',
        budget: 15000,
        currency: 'USD',
        startDate: new Date().toISOString().split('T')[0],
        targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        managerName: currentUser?.name || 'Unassigned',
      });
    }
    setError('');
  }, [projectToEdit, currentUser, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }
    if (!formData.clientName.trim()) {
      setError('Client name is required');
      return;
    }
    if (!formData.targetDate) {
      setError('Target completion date is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      if (isEdit) {
        await updateProject(projectToEdit._id, formData);
      } else {
        // Default clean starter milestones for progress tracking
        const payload = {
          ...formData,
          milestones: [
            { title: 'Project Kickoff & Requirements Alignment', isCompleted: true },
            { title: 'Design & Architecture Validation', isCompleted: false },
            { title: 'Core Implementation & QA Testing', isCompleted: false },
            { title: 'Final Handover & Client Sign-off', isCompleted: false },
          ],
        };
        await createProject(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const eligibleManagers = (users || []).filter((u) => u.status === 'Approved');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #ffffff, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#f0fdf4',
                color: '#059669',
                border: '1px solid #dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FolderKanban size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {isEdit ? 'Edit Project' : 'Create New Project'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                {isEdit
                  ? `Updating Project Code: ${projectToEdit?.projectCode || ''}`
                  : 'Enter client and deliverable specifications to register a project.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: '#f1f5f9',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '22px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                color: '#dc2626',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Project Name & Client Name */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Project Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Cloud SaaS Architecture"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Client / Company Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                placeholder="e.g. Apex FinTech Global"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Row 2: Category, Priority, Project Manager */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  background: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Web Application">Web Application</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="Cloud Migration">Cloud Migration</option>
                <option value="Enterprise Software">Enterprise Software</option>
                <option value="System Integration">System Integration</option>
                <option value="Infrastructure & DevOps">Infrastructure & DevOps</option>
                <option value="Consulting & Audit">Consulting & Audit</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  background: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Urgent">🔴 Urgent</option>
                <option value="High">🟠 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🟢 Low</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Project Manager
              </label>
              <select
                name="managerName"
                value={formData.managerName}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  background: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Unassigned">Unassigned</option>
                {eligibleManagers.map((u) => (
                  <option key={u._id} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Budget & Target Completion Date */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Total Budget ({formData.currency})
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                min="0"
                step="500"
                placeholder="e.g. 15000"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Target Completion Date <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="date"
                name="targetDate"
                value={formData.targetDate}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* If edit mode: Status selection */}
          {isEdit && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Lifecycle Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  background: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Under Review">Under Review</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          )}

          {/* Row 4: Scope / Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Project Scope & Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Outline project goals, deliverables, and technical requirements..."
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem',
                color: '#0f172a',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '12px',
              borderTop: '1px solid #f1f5f9',
              marginTop: '4px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '9px 20px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              }}
            >
              <Save size={15} />
              <span>{submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
