import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ForgotPassword } from './ForgotPassword';
import {
  LogIn,
  Lock,
  Mail,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  Shield,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

export const Login = ({ onSwitchToRegister, initialEmail = '', initialRole = 'manager', initialSuccessMsg = '' }) => {
  const { login } = useAuth();

  // Forgot password view toggle
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Role portal tab: 'manager' | 'user'
  const [loginRole, setLoginRole] = useState(initialRole === 'user' ? 'user' : 'manager');

  // Input states separated so employee email is NEVER prefilled or shown in manager portal
  const [managerInput, setManagerInput] = useState('');
  const [userInput, setUserInput] = useState(initialRole === 'user' ? initialEmail : '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [approvalWarning, setApprovalWarning] = useState('');
  const [successBanner, setSuccessBanner] = useState(initialSuccessMsg);

  useEffect(() => {
    if (initialEmail && initialRole === 'user') {
      setUserInput(initialEmail);
    }
    if (initialRole) {
      setLoginRole(initialRole === 'user' ? 'user' : 'manager');
    }
    if (initialSuccessMsg) {
      setSuccessBanner(initialSuccessMsg);
    }
  }, [initialEmail, initialRole, initialSuccessMsg]);

  // Auto-remove success banner after 4 seconds
  useEffect(() => {
    if (successBanner) {
      const timer = setTimeout(() => {
        setSuccessBanner('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successBanner]);

  const currentIdentifier = loginRole === 'manager' ? managerInput : userInput;

  const validate = () => {
    const errors = {};
    if (!currentIdentifier.trim()) {
      errors.usernameOrEmail = 'Username or email address is required';
    }
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
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
    const res = await login(currentIdentifier.trim(), password);
    setIsLoading(false);

    if (!res.success) {
      if (res.status === 403 || res.approvalStatus) {
        setApprovalWarning(res.message);
      } else {
        // Generic error message: don't specify whether email or password was wrong
        setGeneralError('Invalid email/username or password. Please check your credentials.');
      }
    }
  };

  if (showForgotPassword) {
    return (
      <ForgotPassword
        onBackToLogin={() => setShowForgotPassword(false)}
        onSuccessReset={({ email, message }) => {
          if (email) {
            setUserInput(email);
          }
          setShowForgotPassword(false);
          if (message) setSuccessBanner(message);
        }}
      />
    );
  }

  return (
    <div className="login-page-wrapper">
      <div
        className="login-card"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '36px 36px 32px',
          borderRadius: '24px',
          boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.1), 0 0 1px 1px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Header Block */}
        <div className="login-header-block" style={{ marginBottom: '22px' }}>
          <div
            className="login-icon-box"
            style={{
              background:
                loginRole === 'manager'
                  ? 'linear-gradient(135deg, #2563eb, #3b82f6)'
                  : 'linear-gradient(135deg, #059669, #10b981)',
              boxShadow:
                loginRole === 'manager'
                  ? '0 6px 18px rgba(37, 99, 235, 0.28)'
                  : '0 6px 18px rgba(5, 150, 105, 0.28)',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
            }}
          >
            {loginRole === 'manager' ? (
              <ShieldCheck size={30} color="#ffffff" />
            ) : (
              <User size={30} color="#ffffff" />
            )}
          </div>
          <h1 className="login-title" style={{ fontSize: '1.65rem', marginBottom: 0 }}>
            {loginRole === 'manager' ? 'Manager Portal' : 'Employee Login'}
          </h1>
        </div>

        {/* Dual Role Toggle Switch Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            background: '#f1f5f9',
            padding: '5px',
            borderRadius: '12px',
            marginBottom: '22px',
            border: '1px solid #e2e8f0',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setLoginRole('manager');
              setGeneralError('');
              setSuccessBanner(''); // Ensure registration msg is only shown on user tab
            }}
            style={{
              padding: '10px 14px',
              borderRadius: '9px',
              border: 'none',
              background: loginRole === 'manager' ? '#2563eb' : 'transparent',
              color: loginRole === 'manager' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow:
                loginRole === 'manager' ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none',
            }}
          >
            <Shield size={16} />
            <span>Manager Portal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginRole('user');
              setGeneralError('');
            }}
            style={{
              padding: '10px 14px',
              borderRadius: '9px',
              border: 'none',
              background: loginRole === 'user' ? '#059669' : 'transparent',
              color: loginRole === 'user' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow:
                loginRole === 'user' ? '0 2px 6px rgba(5, 150, 105, 0.25)' : 'none',
            }}
          >
            <User size={16} />
            <span>User Portal</span>
          </button>
        </div>

        {/* Success Banner (e.g. After Registration) - ONLY shown on Employee/User tab */}
        {loginRole === 'user' && successBanner && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#047857',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '18px',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <CheckCircle2 size={18} color="#059669" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Manager Approval Warning Banner */}
        {approvalWarning && (
          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '12px',
              padding: '13px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              color: '#92400e',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '18px',
              animation: 'fadeIn 0.3s ease',
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

        {/* Error Alert */}
        {generalError && (
          <div
            className="alert alert-danger"
            role="alert"
            style={{ marginBottom: '18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <AlertCircle size={18} />
            <span>{generalError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
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
                placeholder={
                  loginRole === 'manager'
                    ? 'Enter manager username or email'
                    : 'Enter employee username or email'
                }
                value={loginRole === 'manager' ? managerInput : userInput}
                onChange={(e) => {
                  const val = e.target.value;
                  if (loginRole === 'manager') {
                    setManagerInput(val);
                  } else {
                    setUserInput(val);
                  }
                  if (fieldErrors.usernameOrEmail) {
                    setFieldErrors((prev) => ({ ...prev, usernameOrEmail: '' }));
                  }
                }}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
            {fieldErrors.usernameOrEmail && (
              <span className="form-error-msg">{fieldErrors.usernameOrEmail}</span>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
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
                style={{ paddingLeft: '38px', paddingRight: '42px' }}
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }
                }}
                disabled={isLoading}
                autoComplete="current-password"
              />

              {/* Show / Hide Eye Button */}
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
                  color: showPassword ? (loginRole === 'manager' ? '#2563eb' : '#059669') : '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
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
                  color: loginRole === 'manager' ? '#2563eb' : '#059669',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'none',
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

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '12px',
              background:
                loginRole === 'manager'
                  ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                  : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              borderColor: loginRole === 'manager' ? '#1d4ed8' : '#047857',
              boxShadow:
                loginRole === 'manager'
                  ? '0 3px 12px rgba(37, 99, 235, 0.3)'
                  : '0 3px 12px rgba(5, 150, 105, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>
                  Sign In to {loginRole === 'manager' ? 'Manager Portal' : 'Employee Workspace'}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Register CTA Link - Accessible from both Manager and Employee portals */}
        <div
          style={{
            marginTop: '22px',
            paddingTop: '18px',
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#475569',
          }}
        >
          <span>Need to create a new user account? </span>
          <button
            type="button"
            onClick={() => onSwitchToRegister && onSwitchToRegister('user')}
            style={{
              background: 'transparent',
              border: 'none',
              color: loginRole === 'manager' ? '#2563eb' : '#059669',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
              fontSize: '0.875rem',
            }}
          >
            Go to Registration Page
          </button>
        </div>
      </div>
    </div>
  );
};
