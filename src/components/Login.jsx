import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ForgotPassword } from './ForgotPassword';
import {
  LogIn,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  Building2,
} from 'lucide-react';

export const Login = ({ onSwitchToRegister, initialEmail = '', initialSuccessMsg = '' }) => {
  const { login } = useAuth();

  // Forgot password view toggle
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Form Inputs
  const [usernameOrEmail, setUsernameOrEmail] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validation & Error Handling
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [approvalWarning, setApprovalWarning] = useState('');
  const [successBanner, setSuccessBanner] = useState(initialSuccessMsg || '');

  useEffect(() => {
    if (initialEmail) {
      setUsernameOrEmail(initialEmail);
    }
    if (initialSuccessMsg) {
      setSuccessBanner(initialSuccessMsg);
    }
  }, [initialEmail, initialSuccessMsg]);

  // Auto-remove success banner after 5 seconds
  useEffect(() => {
    if (successBanner) {
      const timer = setTimeout(() => {
        setSuccessBanner('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successBanner]);

  const validate = () => {
    const errors = {};
    if (!usernameOrEmail.trim()) {
      errors.usernameOrEmail = 'Username or email address is required';
    }
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 4) {
      errors.password = 'Password must be at least 4 characters long';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setApprovalWarning('');
    setSuccessBanner('');

    if (!validate()) return;

    setIsLoading(true);
    const res = await login(usernameOrEmail.trim(), password);
    setIsLoading(false);

    if (!res.success) {
      if (res.status === 403 || res.approvalStatus) {
        setApprovalWarning(res.message);
      } else {
        setGeneralError(res.message || 'Invalid username/email or password. Please verify your credentials.');
      }
    }
  };

  if (showForgotPassword) {
    return (
      <ForgotPassword
        onBackToLogin={() => setShowForgotPassword(false)}
        onSuccessReset={({ email, message }) => {
          if (email) {
            setUsernameOrEmail(email);
          }
          setShowForgotPassword(false);
          if (message) setSuccessBanner(message);
        }}
      />
    );
  }

  return (
    <div className="login-page-wrapper">
      <div className="login-card">
        {/* Top Enterprise Logo & Header */}
        <div className="login-header-block">
          <div className="login-icon-box">
            <Building2 size={28} color="#ffffff" />
          </div>
          <h1 className="login-title">Sign In</h1>
          <p className="login-subtitle">
            Hierarchy-Based Task & Employee Management System
          </p>
        </div>

        {/* Success Banner */}
        {successBanner && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#047857',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '18px',
            }}
          >
            <CheckCircle2 size={18} color="#059669" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Account Approval Warning Banner */}
        {approvalWarning && (
          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              color: '#92400e',
              fontSize: '0.875rem',
              marginBottom: '18px',
            }}
          >
            <ShieldAlert size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, color: '#78350f', marginBottom: '2px' }}>
                Account Pending Approval
              </div>
              <span>{approvalWarning}</span>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {generalError && (
          <div
            className="alert alert-danger"
            role="alert"
            style={{ marginBottom: '18px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <AlertCircle size={18} />
            <span>{generalError}</span>
          </div>
        )}

        {/* Official Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Username / Email Field */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="usernameOrEmail">
              Username or Email <span className="required">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Mail size={16} />
              </div>
              <input
                id="usernameOrEmail"
                type="text"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                placeholder="Enter username or email address"
                value={usernameOrEmail}
                onChange={(e) => {
                  setUsernameOrEmail(e.target.value);
                  if (fieldErrors.usernameOrEmail) {
                    setFieldErrors((prev) => ({ ...prev, usernameOrEmail: '' }));
                  }
                  if (generalError) setGeneralError('');
                }}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
            {fieldErrors.usernameOrEmail && (
              <span className="form-error-msg">{fieldErrors.usernameOrEmail}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group" style={{ marginBottom: '22px' }}>
            <label className="form-label" htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Lock size={16} />
              </div>

              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingLeft: '38px', paddingRight: '40px' }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }
                  if (generalError) setGeneralError('');
                }}
                disabled={isLoading}
                autoComplete="current-password"
              />

              {/* Show / Hide Eye Toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: showPassword ? '#2563eb' : '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="form-error-msg">{fieldErrors.password}</span>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <KeyRound size={13} />
                <span>Forgot password?</span>
              </button>
            </div>
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Register Option */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>Need an employee account? </span>
          <button
            type="button"
            onClick={() => onSwitchToRegister && onSwitchToRegister('user')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#2563eb',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '0 2px',
              fontSize: '0.85rem',
            }}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
};
