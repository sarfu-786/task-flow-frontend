import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
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
} from 'lucide-react';

export const UserProfile = () => {
  const { user, updateUserProfile } = useAuth();
  const { tasks } = useTasks();

  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-remove feedback message after 3.5 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const userIdentifier = (user?.name || '').toLowerCase().trim();
  const userUsername = (user?.username || '').toLowerCase().trim();
  const userId = (user?._id || user?.id || '').toString();

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const myTasks = safeTasks.filter((t) => {
    if (!t) return false;
    const tAssigned = (t.assignedTo || '').toLowerCase().trim();
    const tUser = t.user ? t.user.toString() : '';
    return (
      (userIdentifier && tAssigned === userIdentifier) ||
      (userUsername && tAssigned === userUsername) ||
      (userId && tUser === userId) ||
      tAssigned === 'current user'
    );
  });

  const completedCount = myTasks.filter((t) => t.status === 'Completed').length;
  const inProgressCount = myTasks.filter((t) => t.status === 'In Progress').length;
  const todoCount = myTasks.filter((t) => t.status === 'To Do').length;

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Active Member';

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 2MB');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result;
      try {
        if (userId) {
          await api.updateUser(userId, { avatar: base64Image });
        }
        updateUserProfile({ avatar: base64Image });
        setSuccessMsg('Profile photo updated successfully!');
      } catch (err) {
        console.error('Failed to update avatar:', err);
        setErrorMsg(err.message || 'Failed to update profile photo.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read image file');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    if (!user?.avatar) return;
    setIsUploading(true);
    setErrorMsg('');
    try {
      if (userId) {
        await api.updateUser(userId, { avatar: '' });
      }
      updateUserProfile({ avatar: '' });
      setSuccessMsg('Profile photo removed.');
    } catch (err) {
      console.error('Failed to remove avatar:', err);
      setErrorMsg(err.message || 'Failed to remove profile photo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '4px' }}>
        <div>
          <h2 className="section-title">My Profile Details</h2>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            {/* Avatar with Camera Button Overlay */}
            <div style={{ position: 'relative', width: '92px', height: '92px' }}>
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
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {user?.name || 'Employee'}
                </h3>
                <span
                  style={{
                    fontSize: '0.78rem',
                    padding: '3px 12px',
                    borderRadius: '9999px',
                    background: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                    fontWeight: 600,
                  }}
                >
                  {user?.role || 'Team Member'}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 12px 0' }}>
                @{user?.username} • {user?.email}
              </p>

              {/* Profile Image Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
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
                    onClick={handleRemovePhoto}
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
            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={13} />
                Full Name
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', display: 'block' }}>
                {user?.name}
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={13} />
                Email Address
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', display: 'block' }}>
                {user?.email}
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={13} />
                Department
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', display: 'block' }}>
                {user?.department || 'Internet Work'}
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} />
                Member Since
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', display: 'block' }}>
                {joinedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Work Summary Card inside profile */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
            Work Summary Overview
          </h4>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
            }}
          >
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '14px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 600 }}>Total Assigned</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1d4ed8', display: 'block', marginTop: '2px' }}>{myTasks.length}</span>
            </div>

            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '14px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>Tasks Completed</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#059669', display: 'block', marginTop: '2px' }}>{completedCount}</span>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '14px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>In Progress</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#d97706', display: 'block', marginTop: '2px' }}>{inProgressCount}</span>
            </div>

            <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '14px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: '#6d28d9', fontWeight: 600 }}>To Do (Pending)</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#7c3aed', display: 'block', marginTop: '2px' }}>{todoCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
