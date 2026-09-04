import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUserManagement } from '../../context/UserContext';
import { api } from '../../services/api';
import {
  User,
  Mail,
  Building,
  Shield,
  Calendar,
  CheckCircle2,
  Clock,
  Briefcase,
  KeyRound,
  ShieldCheck,
  Award,
  Camera,
  Upload,
  Trash2,
  AlertCircle,
  Loader2,
  Edit2,
  X,
  Save,
  Eye,
  EyeOff,
  Lock,
  AtSign,
} from 'lucide-react';

export const UserProfile = () => {
  const { user, updateUserProfile, updateProfile } = useAuth();
  
  // Safe access to UserContext if mounted inside UserProvider
  let fetchUsers = null;
  try {
    const userMgmt = useUserManagement();
    fetchUsers = userMgmt?.fetchUsers;
  } catch {
    // optional outside of UserProvider
  }

  const fileInputRef = useRef(null);
  const modalFileInputRef = useRef(null);

  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    department: 'Internet Work',
    avatar: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Auto-remove feedback message after 4 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isEditModalOpen) {
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
  }, [isEditModalOpen]);

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Active Member';

  // Open Edit Profile Modal
  const handleOpenEditModal = () => {
    setFormData({
      name: user?.name || '',
      username: user?.username || '',
      email: user?.email || '',
      department: user?.department || 'Internet Work',
      avatar: user?.avatar || '',
      newPassword: '',
      confirmPassword: '',
    });
    setFormErrors({});
    setModalError('');
    setShowPasswordSection(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    if (!isSubmitting) {
      setIsEditModalOpen(false);
      setModalError('');
      setFormErrors({});
    }
  };

  // Helper for image compression
  const processImageFile = (file, callback) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setModalError('Selected image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 280;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        callback(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Quick Avatar Upload from Profile Card
  const handleQuickImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg('');

    processImageFile(file, async (base64Image) => {
      try {
        if (updateProfile) {
          const res = await updateProfile({ avatar: base64Image });
          if (!res.success) throw new Error(res.message);
        } else {
          if (userId) await api.updateUser(userId, { avatar: base64Image });
          updateUserProfile({ avatar: base64Image });
        }
        if (fetchUsers) fetchUsers();
        setSuccessMsg('Profile photo updated successfully!');
      } catch (err) {
        console.error('Failed to update avatar:', err);
        setErrorMsg(err.message || 'Failed to update profile photo.');
      } finally {
        setIsUploading(false);
      }
    });
  };

  const handleQuickRemovePhoto = async () => {
    if (!user?.avatar) return;
    setIsUploading(true);
    setErrorMsg('');
    try {
      if (updateProfile) {
        const res = await updateProfile({ avatar: '' });
        if (!res.success) throw new Error(res.message);
      } else {
        if (userId) await api.updateUser(userId, { avatar: '' });
        updateUserProfile({ avatar: '' });
      }
      if (fetchUsers) fetchUsers();
      setSuccessMsg('Profile photo removed.');
    } catch (err) {
      console.error('Failed to remove avatar:', err);
      setErrorMsg(err.message || 'Failed to remove profile photo.');
    } finally {
      setIsUploading(false);
    }
  };

  // Validate Edit Profile Form
  const validateForm = () => {
    const errs = {};
    if (!formData.name || !formData.name.trim()) {
      errs.name = 'Full name is required';
    }

    if (!formData.username || !formData.username.trim()) {
      errs.username = 'Username is required';
    } else if (formData.username.trim().length < 2) {
      errs.username = 'Username must be at least 2 characters long';
    }

    if (!formData.email || !formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email address';
    }

    if (showPasswordSection && formData.newPassword) {
      if (formData.newPassword.length < 4) {
        errs.newPassword = 'Password must be at least 4 characters long';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        errs.confirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Profile Changes
  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
        department: formData.department.trim(),
        avatar: formData.avatar,
      };

      if (showPasswordSection && formData.newPassword && formData.newPassword.trim()) {
        payload.newPassword = formData.newPassword.trim();
      }

      let res;
      if (updateProfile) {
        res = await updateProfile(payload);
      } else {
        res = await api.updateUser(userId, payload);
        if (res.success && res.user) {
          updateUserProfile(res.user);
        }
      }

      if (!res.success) {
        setModalError(res.message || 'Failed to update profile details.');
      } else {
        if (fetchUsers) {
          fetchUsers();
        }
        setIsEditModalOpen(false);
        setSuccessMsg('Your profile details have been updated successfully!');
      }
    } catch (err) {
      console.error('Submit profile error:', err);
      setModalError(err.message || 'An error occurred while saving profile changes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div
        className="section-header"
        style={{
          marginBottom: '4px',
        }}
      >
        <div>
          <h2 className="section-title">My Profile Details</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            View and manage your account information, role, credentials, and settings.
          </p>
        </div>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '12px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#047857',
            fontSize: '0.9rem',
            fontWeight: 500,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <CheckCircle2 size={18} color="#059669" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="alert alert-danger" role="alert" style={{ borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Profile Details Card */}
      <div
        className="card"
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Top Profile Banner Row with Photo Upload */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px',
            paddingBottom: '24px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
            {/* Avatar with Camera Button Overlay */}
            <div style={{ position: 'relative', width: '92px', height: '92px', flexShrink: 0 }}>
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  style={{
                    width: '92px',
                    height: '92px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #2563eb',
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '92px',
                    height: '92px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '2.2rem',
                    fontWeight: 700,
                    border: '3px solid #e2e8f0',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User size={38} />}
                </div>
              )}

              {/* Upload Spinner Overlay */}
              {isUploading && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              )}

              {/* Quick Camera Action Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: '2px solid #ffffff',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  transition: 'transform 0.15s ease',
                }}
                title="Upload new profile photo"
              >
                <Camera size={14} />
              </button>
            </div>

            {/* Profile Name & Controls */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {user?.name || 'Employee'}
                </h3>
                <span
                  style={{
                    fontSize: '0.78rem',
                    padding: '3px 12px',
                    borderRadius: '9999px',
                    background: user?.role === 'Manager' ? '#eff6ff' : '#ecfdf5',
                    color: user?.role === 'Manager' ? '#1d4ed8' : '#047857',
                    border: `1px solid ${user?.role === 'Manager' ? '#bfdbfe' : '#a7f3d0'}`,
                    fontWeight: 600,
                  }}
                >
                  {user?.role || 'Team Member'}
                </span>

                {/* Edit Button beside user name */}
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    color: '#1e293b',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease',
                  }}
                  id="btn-edit-profile-main"
                  title="Edit profile details"
                >
                  <Edit2 size={13} />
                  <span>Edit</span>
                </button>
              </div>

              {/* Email & Username line with safe word break to prevent overflow */}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '6px 0 12px 0', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.4 }}>
                @{user?.username} • <span style={{ color: 'var(--text-secondary)' }}>{user?.email}</span>
              </p>

              {/* Profile Image Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleQuickImageUpload}
                  disabled={isUploading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Upload size={14} />
                  <span>{user?.avatar ? 'Change Photo' : 'Upload Photo'}</span>
                </button>

                {user?.avatar && (
                  <button
                    type="button"
                    onClick={handleQuickRemovePhoto}
                    disabled={isUploading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: '#fff1f2',
                      border: '1px solid #fecdd3',
                      color: '#e11d48',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={18} color="#059669" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Account Verified & Active
            </span>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
            Account & Organization Details
          </h4>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
            }}
          >
            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={13} />
                Full Name
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', display: 'block', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {user?.name}
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AtSign size={13} />
                Username
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', display: 'block', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                @{user?.username}
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={13} />
                Email Address
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', display: 'block', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {user?.email}
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={13} />
                Department
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', display: 'block', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {user?.department || 'Internet Work'}
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} />
                Member Since
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', display: 'block', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {joinedDate}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Edit Profile Details Modal */}
      {isEditModalOpen && (
        <div className="modal-backdrop" onClick={handleCloseEditModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '560px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                  }}
                >
                  <Edit2 size={18} />
                </div>
                <div>
                  <h3 className="modal-title">Edit Profile Details</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Update your account credentials and personal details
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={handleCloseEditModal}
                disabled={isSubmitting}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitProfile} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 140px)', padding: '24px' }}>
                {modalError && (
                  <div className="alert alert-danger" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* Profile Photo Upload Section */}
                <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <label className="form-label" style={{ marginBottom: '10px', display: 'block', fontWeight: 600 }}>
                    Profile Photo
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {formData.avatar ? (
                      <img
                        src={formData.avatar}
                        alt="Profile Preview"
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #2563eb',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '1.4rem',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        {formData.name ? formData.name.charAt(0).toUpperCase() : <User size={26} />}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="file"
                        ref={modalFileInputRef}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            processImageFile(file, (base64) => {
                              setFormData((prev) => ({ ...prev, avatar: base64 }));
                            });
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => modalFileInputRef.current?.click()}
                        style={{
                          padding: '6px 14px',
                          fontSize: '0.82rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Upload size={14} />
                        <span>Choose Photo from Device</span>
                      </button>

                      {formData.avatar && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, avatar: '' }))}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            padding: 0,
                          }}
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" htmlFor="edit-name">
                    Full Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                    placeholder="e.g. Sarfaraz Khan"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                    }}
                    required
                  />
                  {formErrors.name && <span className="form-error-msg" style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{formErrors.name}</span>}
                </div>

                {/* Username */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" htmlFor="edit-username">
                    Username <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>@</span>
                    <input
                      id="edit-username"
                      type="text"
                      className={`form-control ${formErrors.username ? 'is-invalid' : ''}`}
                      style={{ paddingLeft: '30px' }}
                      placeholder="e.g. sarfaraz01"
                      value={formData.username}
                      onChange={(e) => {
                        setFormData({ ...formData, username: e.target.value });
                        if (formErrors.username) setFormErrors({ ...formErrors, username: '' });
                      }}
                      required
                    />
                  </div>
                  {formErrors.username && <span className="form-error-msg" style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{formErrors.username}</span>}
                </div>

                {/* Email Address */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" htmlFor="edit-email">
                    Email Address <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    id="edit-email"
                    type="email"
                    className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                    placeholder="e.g. sarfaraz@example.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                    }}
                    required
                  />
                  {formErrors.email && <span className="form-error-msg" style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{formErrors.email}</span>}
                </div>

                {/* Department */}
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label" htmlFor="edit-department">
                    Department
                  </label>
                  <select
                    id="edit-department"
                    className="form-control select-filter"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="Internet Work">Internet Work</option>
                    <option value="Documentation">Documentation</option>
                    <option value="Backend">Backend</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                {/* Collapsible Change Password Section */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 0',
                    }}
                  >
                    <Lock size={15} />
                    <span>{showPasswordSection ? 'Hide Change Password' : 'Change Password (Optional)'}</span>
                  </button>

                  {showPasswordSection && (
                    <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      {/* New Password */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" htmlFor="edit-new-password" style={{ fontSize: '0.82rem' }}>
                          New Password
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            id="edit-new-password"
                            type={showPassword ? 'text' : 'password'}
                            className="form-control"
                            style={{ paddingRight: '40px' }}
                            placeholder="Min 4 characters"
                            value={formData.newPassword}
                            onChange={(e) => {
                              setFormData({ ...formData, newPassword: e.target.value });
                              if (formErrors.newPassword) setFormErrors({ ...formErrors, newPassword: '' });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                              position: 'absolute',
                              right: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px',
                            }}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {formErrors.newPassword && (
                          <span className="form-error-msg" style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                            {formErrors.newPassword}
                          </span>
                        )}
                      </div>

                      {/* Confirm New Password */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" htmlFor="edit-confirm-password" style={{ fontSize: '0.82rem' }}>
                          Confirm New Password
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            id="edit-confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            className="form-control"
                            style={{ paddingRight: '40px' }}
                            placeholder="Re-enter new password"
                            value={formData.confirmPassword}
                            onChange={(e) => {
                              setFormData({ ...formData, confirmPassword: e.target.value });
                              if (formErrors.confirmPassword) setFormErrors({ ...formErrors, confirmPassword: '' });
                            }}
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
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px',
                            }}
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {formErrors.confirmPassword && (
                          <span className="form-error-msg" style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                            {formErrors.confirmPassword}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '16px 24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseEditModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  id="btn-save-profile"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
