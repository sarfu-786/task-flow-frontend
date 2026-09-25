import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { prewarmBackend } from '../services/api';
import { ForgotPassword } from './ForgotPassword';
import {
  LogIn,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Users,
  BarChart3,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export const Login = ({ onSwitchToRegister, initialEmail = '', initialSuccessMsg = '' }) => {
  const { login } = useAuth();

  // Forgot password view toggle
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Form Inputs
  const [email, setEmail] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validation & Error Handling
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [approvalWarning, setApprovalWarning] = useState('');
  const [successBanner, setSuccessBanner] = useState(initialSuccessMsg || '');

  // Pre-warm backend immediately on login component mount
  useEffect(() => {
    prewarmBackend();
  }, []);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
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
    if (!email.trim()) {
      errors.email = 'Email address is required';
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
    const res = await login(email.trim(), password);
    setIsLoading(false);

    if (!res.success) {
      if (res.status === 403 || res.approvalStatus) {
        setApprovalWarning(res.message);
      } else {
        setGeneralError(res.message || 'Invalid email or password. Please verify your credentials.');
      }
    }
  };

  if (showForgotPassword) {
    return (
      <ForgotPassword
        onBackToLogin={() => setShowForgotPassword(false)}
        onSuccessReset={({ email: resetEmail, message }) => {
          if (resetEmail) {
            setEmail(resetEmail);
          }
          setShowForgotPassword(false);
          if (message) setSuccessBanner(message);
        }}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f0f6ff 50%, #e8f0fe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative ambient background blur shapes */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, rgba(255, 255, 255, 0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '-5%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.06) 0%, rgba(255, 255, 255, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '1120px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '40px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Left Side: Brand & Feature Highlights */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '20px 16px',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="16" height="18" x="4" y="3" rx="3" />
                <line x1="8" x2="16" y1="8" y2="8" />
                <line x1="8" x2="16" y1="12" y2="12" />
                <line x1="8" x2="12" y1="16" y2="16" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                Task<span style={{ color: '#2563eb' }}>Flow</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                Enterprise Modular System
              </div>
            </div>
          </div>

          {/* Accent Line */}
          <div
            style={{
              width: '38px',
              height: '3.5px',
              background: '#2563eb',
              borderRadius: '999px',
              margin: '12px 0 24px 0',
            }}
          />

          {/* Heading */}
          <h1
            style={{
              fontSize: 'clamp(2.2rem, 4vw, 3rem)',
              fontWeight: 850,
              color: '#0f172a',
              lineHeight: 1.15,
              margin: '0 0 16px 0',
              letterSpacing: '-0.8px',
            }}
          >
            Work Smarter<br />
            <span style={{ color: '#2563eb' }}>Together</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.6,
              color: '#64748b',
              margin: '0 0 32px 0',
              maxWidth: '440px',
            }}
          >
            Plan, track and manage tasks, projects, leads, complaints, and team hierarchy with real-time speed.
          </p>

          {/* Feature List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '36px' }}>
            {/* Feature 1 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)',
                }}
              >
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.96rem' }}>
                  Ultra-Fast Workflow
                </div>
                <div style={{ color: '#64748b', fontSize: '0.84rem' }}>
                  Instant zero-lag navigation and data sync
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)',
                }}
              >
                <Users size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.96rem' }}>
                  Hierarchy & Team Visibility
                </div>
                <div style={{ color: '#64748b', fontSize: '0.84rem' }}>
                  Role-scoped management and live collaboration
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#fff7ed',
                  color: '#f97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(249, 115, 22, 0.08)',
                }}
              >
                <BarChart3 size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.96rem' }}>
                  Enterprise Modules
                </div>
                <div style={{ color: '#64748b', fontSize: '0.84rem' }}>
                  CRM Leads, SLA Complaints, and Project Delivery
                </div>
              </div>
            </div>
          </div>

          {/* Quote note */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: 'auto', paddingTop: '10px' }}>
            <Sparkles size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: '1.4' }}>
              Designed for high-performance teams.<br />
              Secure, resilient, and always connected.
            </div>
          </div>
        </div>

        {/* Right Side: Floating Login Card */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '470px',
              background: '#ffffff',
              borderRadius: '32px',
              padding: '38px 34px 32px',
              boxShadow: '0 25px 60px -15px rgba(37, 99, 235, 0.12), 0 0 1px 1px rgba(226, 232, 240, 0.9)',
              position: 'relative',
            }}
          >
            {/* Top Logo Icon */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                margin: '0 auto 16px',
                boxShadow: '0 10px 20px rgba(37, 99, 235, 0.25)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="16" height="18" x="4" y="3" rx="3" />
                <line x1="8" x2="16" y1="8" y2="8" />
                <line x1="8" x2="16" y1="12" y2="12" />
                <line x1="8" x2="12" y1="16" y2="16" />
              </svg>
            </div>

            {/* Header Text */}
            <h2
              style={{
                textAlign: 'center',
                fontSize: '1.65rem',
                fontWeight: 800,
                color: '#0f172a',
                margin: '0 0 6px 0',
                letterSpacing: '-0.5px',
              }}
            >
              Welcome Back
            </h2>
            <p
              style={{
                textAlign: 'center',
                fontSize: '0.9rem',
                color: '#64748b',
                margin: '0 0 20px 0',
              }}
            >
              Sign in to your TaskFlow account
            </p>


            {/* Success Banner */}
            {successBanner && (
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
                  fontSize: '0.86rem',
                  fontWeight: 500,
                  marginBottom: '18px',
                }}
              >
                <CheckCircle2 size={18} color="#059669" />
                <span>{successBanner}</span>
              </div>
            )}

            {/* Account Approval Warning */}
            {approvalWarning && (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  color: '#92400e',
                  fontSize: '0.86rem',
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

            {/* General Error Banner */}
            {generalError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#dc2626',
                  fontSize: '0.86rem',
                  fontWeight: 500,
                  marginBottom: '18px',
                }}
              >
                <AlertCircle size={18} color="#dc2626" />
                <span>{generalError}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} noValidate>
              {/* Email Address */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="login-email"
                  style={{
                    display: 'block',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    color: '#0f172a',
                    marginBottom: '7px',
                  }}
                >
                  Email Address / Username <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <Mail size={18} />
                  </div>
                  <input
                    id="login-email"
                    type="text"
                    placeholder="Enter email or username"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: '' }));
                      }
                      if (generalError) setGeneralError('');
                    }}
                    disabled={isLoading}
                    autoComplete="username"
                    style={{
                      width: '100%',
                      height: '45px',
                      paddingLeft: '42px',
                      paddingRight: '14px',
                      borderRadius: '12px',
                      border: `1.5px solid ${fieldErrors.email ? '#ef4444' : '#e2e8f0'}`,
                      background: '#ffffff',
                      fontSize: '0.92rem',
                      color: '#0f172a',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={(e) => {
                      if (!fieldErrors.email) {
                        e.target.style.borderColor = '#2563eb';
                        e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                      }
                    }}
                    onBlur={(e) => {
                      if (!fieldErrors.email) {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  />
                </div>
                {fieldErrors.email && (
                  <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '5px', fontWeight: 500 }}>
                    {fieldErrors.email}
                  </div>
                )}
              </div>

              {/* Password */}
              <div style={{ marginBottom: '12px' }}>
                <label
                  htmlFor="password"
                  style={{
                    display: 'block',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    color: '#0f172a',
                    marginBottom: '7px',
                  }}
                >
                  Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
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
                    style={{
                      width: '100%',
                      height: '45px',
                      paddingLeft: '42px',
                      paddingRight: '42px',
                      borderRadius: '12px',
                      border: `1.5px solid ${fieldErrors.password ? '#ef4444' : '#e2e8f0'}`,
                      background: '#ffffff',
                      fontSize: '0.92rem',
                      color: '#0f172a',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={(e) => {
                      if (!fieldErrors.password) {
                        e.target.style.borderColor = '#2563eb';
                        e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                      }
                    }}
                    onBlur={(e) => {
                      if (!fieldErrors.password) {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  />
                  {/* Eye Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
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
                  <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '5px', fontWeight: 500 }}>
                    {fieldErrors.password}
                  </div>
                )}
              </div>

              {/* Forgot Password Link */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #1d68f7, #1d4ed8)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 22px rgba(29, 104, 247, 0.35)',
                  transition: 'all 0.2s ease',
                  opacity: isLoading ? 0.8 : 1,
                }}
              >
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        border: '2.5px solid rgba(255, 255, 255, 0.3)',
                        borderTopColor: '#ffffff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* OR Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '20px 0',
              }}
            >
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span
                style={{
                  padding: '0 12px',
                  color: '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                }}
              >
                OR
              </span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            {/* Register Link */}
            <div
              style={{
                textAlign: 'center',
                fontSize: '0.88rem',
                color: '#475569',
              }}
            >
              <span>Don’t have an account? </span>
              <button
                type="button"
                onClick={() => onSwitchToRegister && onSwitchToRegister('user')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#1d68f7',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                  fontSize: '0.88rem',
                }}
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
