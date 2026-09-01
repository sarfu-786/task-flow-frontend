import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
  UserPlus,
} from 'lucide-react';

export const Login = ({ onSwitchToRegister, initialEmail = '', initialRole = 'manager', initialSuccessMsg = '' }) => {
  const { login, error: authError } = useAuth();

  // Role portal tab: 'manager' | 'user'
  const [loginRole, setLoginRole] = useState(initialRole === 'user' ? 'user' : 'manager');

  // Input states
  const [usernameOrEmail, setUsernameOrEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [successBanner, setSuccessBanner] = useState(initialSuccessMsg);

  useEffect(() => {
    if (initialEmail) {
      setUsernameOrEmail(initialEmail);
    }
    if (initialRole) {
      setLoginRole(initialRole === 'user' ? 'user' : 'manager');
    }
    if (initialSuccessMsg) {
      setSuccessBanner(initialSuccessMsg);
    }
  }, [initialEmail, initialRole, initialSuccessMsg]);

  const validate = () => {
    const errors = {};
    if (!usernameOrEmail.trim()) {
      errors.usernameOrEmail = 'Username or email address is required';
    }
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 4) {
      errors.password = 'Password must be at least 4 characters';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setSuccessBanner('');
    if (!validate()) return;

    setIsLoading(true);
    const res = await login(usernameOrEmail, password);
    setIsLoading(false);

    if (!res.success) {
      setGeneralError(res.message || 'Invalid username/email or password');
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card" style={{ maxWidth: '440px', width: '100%' }}>
        {/* Header Block */}
        <div className="login-header-block">
          <div
            className="login-icon-box"
            style={{
              background:
                loginRole === 'manager'
                  ? 'linear-gradient(135deg, #2563eb, #3b82f6)'
                  : 'linear-gradient(135deg, #059669, #10b981)',
              boxShadow:
                loginRole === 'manager'
                  ? '0 4px 14px rgba(37, 99, 235, 0.25)'
                  : '0 4px 14px rgba(5, 150, 105, 0.25)',
            }}
          >
            {loginRole === 'manager' ? (
              <ShieldCheck size={28} color="#ffffff" />
            ) : (
              <User size={28} color="#ffffff" />
            )}
          </div>
          <h1 className="login-title">
            {loginRole === 'manager' ? 'Manager Portal' : 'Employee Login'}
          </h1>
          <p className="login-subtitle">
            {loginRole === 'manager'
              ? 'Access team oversight, workload allocation, and manager inbox'
              : 'Access your assigned tasks, work progress, and performance summary'}
          </p>
        </div>

        {/* Dual Role Toggle Switch Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            background: '#f1f5f9',
            padding: '5px',
            borderRadius: '10px',
            marginBottom: '24px',
            border: '1px solid #e2e8f0',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setLoginRole('manager');
              setGeneralError('');
            }}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
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
              padding: '9px 12px',
              borderRadius: '8px',
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

        {/* Success Banner (e.g. After Registration) */}
        {successBanner && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
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

        {/* Error Alert */}
        {(generalError || authError) && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: '18px' }}>
            <AlertCircle size={18} />
            <span>{generalError || authError}</span>
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
                value={usernameOrEmail}
                onChange={(e) => {
                  setUsernameOrEmail(e.target.value);
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
                  color: showPassword ? '#2563eb' : '#94a3b8',
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
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              background:
                loginRole === 'manager'
                  ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                  : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              borderColor: loginRole === 'manager' ? '#1d4ed8' : '#047857',
              boxShadow:
                loginRole === 'manager'
                  ? '0 2px 8px rgba(37, 99, 235, 0.3)'
                  : '0 2px 8px rgba(5, 150, 105, 0.3)',
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

        {/* Register CTA Link */}
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
          <span>New to TaskFlow Pro? </span>
          <button
            type="button"
            onClick={() => onSwitchToRegister && onSwitchToRegister(loginRole)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#2563eb',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
              fontSize: '0.875rem',
            }}
          >
            Register / Create Account
          </button>
        </div>

        <div
          style={{
            marginTop: '16px',
            textAlign: 'center',
            fontSize: '0.78rem',
            color: '#64748b',
          }}
        >
          <span>Secured Role-Based Authentication • TaskFlow Pro Enterprise</span>
        </div>
      </div>
    </div>
  );
};
