import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Building,
  Key,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Lock,
} from 'lucide-react';

const DEPARTMENTS = [
  'Internet Work',
  'Documentation',
  'Social Media',
  'Backend Work',
  'Operations',
  'Executive Leadership',
  'Design & Media',
];

export const MyProfileModal = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();

  const isSuperAdmin = user && user.role === 'Super Admin';
  const isManager = user && ['Manager', 'Executive', 'Administrator'].includes(user.role);

  // View Mode: 'profile' or 'change-password'
  const [viewMode, setViewMode] = useState('profile');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    department: 'Internet Work',
    newPassword: '',
    confirmPassword: '',
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Sync initial user data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        department: user.department || 'Internet Work',
        newPassword: '',
        confirmPassword: '',
      });
      setViewMode('profile');
      setSuccessMessage('');
      setErrorMessage('');
      setFieldErrors({});
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  // Validation
  const validateProfileForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!formData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 4) {
      errors.newPassword = 'Password must be at least 4 characters long';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit profile details update
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateProfileForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        department: formData.department,
      };

      const res = await updateProfile(payload);
      if (res && res.success) {
        setSuccessMessage(res.message || 'Profile updated successfully!');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3500);
      } else {
        setErrorMessage(res?.message || 'Failed to update profile.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit password change
  const handleUpdatePassword = async (e) => {
    if (e) e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validatePasswordForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim() || user.name,
        username: formData.username.trim() || user.username,
        email: (formData.email.trim() || user.email).toLowerCase(),
        department: formData.department || user.department,
        newPassword: formData.newPassword.trim(),
      };

      const res = await updateProfile(payload);
      if (res && res.success) {
        setSuccessMessage('Password changed successfully!');
        setFormData((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
        setTimeout(() => {
          setViewMode('profile');
          setSuccessMessage('');
        }, 1500);
      } else {
        setErrorMessage(res?.message || 'Failed to change password.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          position: 'relative',
          animation: 'scaleIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Clean Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            zIndex: 10,
            background: '#f1f5f9',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e2e8f0';
            e.currentTarget.style.color = '#0f172a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.color = '#64748b';
          }}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Modal Body */}
        <div
          style={{
            padding: '28px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Notification Alerts */}
          {successMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#065f46',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <CheckCircle2 size={18} color="#059669" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <AlertCircle size={18} color="#dc2626" />
              <span>{errorMessage}</span>
            </div>
          )}

          {viewMode === 'profile' ? (
            /* Main Profile View */
            <>
              {/* User Hero Profile Summary Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* Clean Initial Letter Avatar */}
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: isSuperAdmin ? '#fef3c7' : isManager ? '#eff6ff' : '#ecfdf5',
                      color: isSuperAdmin ? '#b45309' : isManager ? '#1d4ed8' : '#047857',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${isSuperAdmin ? '#fde68a' : isManager ? '#bfdbfe' : '#a7f3d0'}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      flexShrink: 0,
                    }}
                  >
                    {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                  </div>

                  {/* Identity & Badges */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                        {formData.name || user.name}
                      </h4>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: isSuperAdmin ? '#fef3c7' : isManager ? '#eff6ff' : '#ecfdf5',
                          color: isSuperAdmin ? '#b45309' : isManager ? '#1d4ed8' : '#047857',
                          border: `1px solid ${isSuperAdmin ? '#fde68a' : isManager ? '#bfdbfe' : '#a7f3d0'}`,
                        }}
                      >
                        {user.role}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                      @{formData.username || user.username} • {formData.email || user.email}
                    </div>
                  </div>
                </div>

                {/* Change Password CTA Button */}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setViewMode('change-password');
                    setSuccessMessage('');
                    setErrorMessage('');
                    setFieldErrors({});
                  }}
                  style={{
                    fontSize: '0.82rem',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#ffffff',
                    borderColor: '#cbd5e1',
                    fontWeight: 600,
                    color: '#2563eb',
                  }}
                >
                  <Key size={14} />
                  <span>Change Password</span>
                </button>
              </div>

              {/* Edit Profile Form */}
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  {/* Full Name */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                      Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-input ${fieldErrors.name ? 'is-invalid' : ''}`}
                      value={formData.name}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, name: e.target.value }));
                        if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      placeholder="e.g. Sarfaraj Ahmad"
                      style={{ width: '100%', padding: '9px 12px', fontSize: '0.875rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                    {fieldErrors.name && (
                      <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '2px', display: 'block' }}>
                        {fieldErrors.name}
                      </span>
                    )}
                  </div>

                  {/* Username */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                      Username <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-input ${fieldErrors.username ? 'is-invalid' : ''}`}
                      value={formData.username}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, username: e.target.value }));
                        if (fieldErrors.username) setFieldErrors((prev) => ({ ...prev, username: '' }));
                      }}
                      placeholder="e.g. sarfraj"
                      style={{ width: '100%', padding: '9px 12px', fontSize: '0.875rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                    {fieldErrors.username && (
                      <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '2px', display: 'block' }}>
                        {fieldErrors.username}
                      </span>
                    )}
                  </div>

                  {/* Email Address */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                      Email Address <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      className={`form-input ${fieldErrors.email ? 'is-invalid' : ''}`}
                      value={formData.email}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, email: e.target.value }));
                        if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      placeholder="e.g. name@organization.com"
                      style={{ width: '100%', padding: '9px 12px', fontSize: '0.875rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                    {fieldErrors.email && (
                      <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '2px', display: 'block' }}>
                        {fieldErrors.email}
                      </span>
                    )}
                  </div>

                  {/* Department */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                      Assigned Department
                    </label>
                    <select
                      className="form-input"
                      value={formData.department}
                      onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', fontSize: '0.875rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 20px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div
                          style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid rgba(255,255,255,0.4)',
                            borderTopColor: '#ffffff',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                          }}
                        />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={15} />
                        <span>Save Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Dedicated Change Password View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Lock size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                      Change Password
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                      Set a secure new password for your account
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setViewMode('profile');
                    setSuccessMessage('');
                    setErrorMessage('');
                    setFieldErrors({});
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
              </div>

              <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* New Password */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                    New Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className={`form-input ${fieldErrors.newPassword ? 'is-invalid' : ''}`}
                      value={formData.newPassword}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, newPassword: e.target.value }));
                        if (fieldErrors.newPassword) setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
                      }}
                      placeholder="Enter new password (min. 4 characters)"
                      style={{ width: '100%', padding: '9px 36px 9px 12px', fontSize: '0.875rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b',
                        padding: '2px',
                      }}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.newPassword && (
                    <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '2px', display: 'block' }}>
                      {fieldErrors.newPassword}
                    </span>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                    Confirm New Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`form-input ${fieldErrors.confirmPassword ? 'is-invalid' : ''}`}
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }));
                        if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }}
                      placeholder="Confirm your new password"
                      style={{ width: '100%', padding: '9px 36px 9px 12px', fontSize: '0.875rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b',
                        padding: '2px',
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '2px', display: 'block' }}>
                      {fieldErrors.confirmPassword}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setViewMode('profile');
                      setSuccessMessage('');
                      setErrorMessage('');
                      setFieldErrors({});
                    }}
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 20px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div
                          style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid rgba(255,255,255,0.4)',
                            borderTopColor: '#ffffff',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                          }}
                        />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Key size={15} />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
