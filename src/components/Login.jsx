import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { prewarmBackend } from '../services/api';
import { ForgotPassword } from './ForgotPassword';
import officeBgImg from '../assets/login_office_bg.jpg';
import laptopHeroImg from '../assets/login_devices_dissolved.png';
import {
  LogIn,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Users,
  BarChart3,
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
      className="tfp-login-wrapper"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(238, 245, 254, 0.76) 0%, rgba(249, 251, 255, 0.65) 40%, rgba(237, 244, 254, 0.72) 75%, rgba(220, 236, 254, 0.80) 100%), url(${officeBgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <style>{`
        .tfp-login-wrapper {
          min-height: 100vh;
          min-height: 100dvh;
          width: 100vw;
          max-width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 20px;
          position: relative;
          overflow-y: auto;
          overflow-x: hidden;
          box-sizing: border-box;
        }
        .tfp-login-grid {
          width: 100%;
          max-width: 1280px;
          display: grid;
          grid-template-columns: minmax(360px, 465px) minmax(440px, 1fr);
          gap: 54px;
          align-items: center;
          position: relative;
          z-index: 1;
        }
        .tfp-login-card {
          background: #ffffff;
          border-radius: 32px;
          padding: 36px 36px 26px;
          box-shadow: 0 30px 80px -15px rgba(29, 104, 247, 0.20), 0 4px 25px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(226, 232, 240, 0.9);
          width: 100%;
          max-width: 465px;
          margin: 0 auto;
          box-sizing: border-box;
          position: relative;
        }
        .tfp-login-hero {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 4px 0;
          position: relative;
        }
        @media (max-width: 980px) {
          .tfp-login-grid {
            grid-template-columns: 1fr;
            max-width: 500px;
            gap: 24px;
          }
          .tfp-login-hero {
            display: none;
          }
        }
        @media (max-width: 480px) {
          .tfp-login-wrapper {
            padding: 16px 12px;
          }
          .tfp-login-card {
            border-radius: 22px;
            padding: 24px 18px 20px;
          }
        }
        @media (max-width: 360px) {
          .tfp-login-wrapper {
            padding: 10px 8px;
          }
          .tfp-login-card {
            border-radius: 18px;
            padding: 20px 14px 16px;
          }
        }
      `}</style>
      {/* Seamless Ambient Background Office Lighting */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '900px',
          height: '900px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(29, 104, 247, 0.12) 0%, rgba(147, 197, 253, 0.06) 50%, rgba(255, 255, 255, 0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-5%',
          width: '650px',
          height: '650px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(255, 255, 255, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Two-Column Container */}
      <div className="tfp-login-grid">
        {/* ============================================================ */}
        {/* COLUMN 1 (LEFT): Prominent, Large Hero Login Card            */}
        {/* ============================================================ */}
        <div className="tfp-login-card">
          {/* Top Brand Logo & Tagline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '15px',
                background: 'linear-gradient(135deg, #1d68f7, #1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 8px 22px rgba(29, 104, 247, 0.32)',
                flexShrink: 0,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="16" height="18" x="4" y="3" rx="3" />
                <line x1="8" x2="16" y1="8" y2="8" />
                <line x1="8" x2="16" y1="12" y2="12" />
                <line x1="8" x2="12" y1="16" y2="16" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, letterSpacing: '-0.4px' }}>
                Task<span style={{ color: '#1d68f7' }}>Flow</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                Enterprise Modular System
              </div>
            </div>
          </div>

          {/* Welcome Heading */}
          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 850,
              color: '#0f172a',
              margin: '0 0 4px 0',
              letterSpacing: '-0.6px',
              lineHeight: 1.2,
            }}
          >
            Welcome Back
          </h1>
          <p
            style={{
              fontSize: '0.90rem',
              color: '#64748b',
              margin: '0 0 18px 0',
              lineHeight: 1.4,
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
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                color: '#047857',
                fontSize: '0.84rem',
                fontWeight: 500,
                marginBottom: '14px',
              }}
            >
              <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
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
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '9px',
                color: '#92400e',
                fontSize: '0.84rem',
                marginBottom: '14px',
              }}
            >
              <ShieldAlert size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, color: '#78350f', marginBottom: '1px', fontSize: '0.84rem' }}>
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
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                color: '#dc2626',
                fontSize: '0.84rem',
                fontWeight: 500,
                marginBottom: '14px',
              }}
            >
              <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
              <span>{generalError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Email Address Field (Strictly NO Username wording) */}
            <div style={{ marginBottom: '14px' }}>
              <label
                htmlFor="login-email"
                style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  color: '#1e293b',
                  marginBottom: '6px',
                }}
              >
                Email Address <span style={{ color: '#ef4444' }}>*</span>
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
                  <Mail size={17} />
                </div>
                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: '' }));
                    }
                    if (generalError) setGeneralError('');
                  }}
                  disabled={isLoading}
                  autoComplete="email"
                  style={{
                    width: '100%',
                    height: '46px',
                    paddingLeft: '44px',
                    paddingRight: '14px',
                    borderRadius: '14px',
                    border: `1.5px solid ${fieldErrors.email ? '#ef4444' : '#e2e8f0'}`,
                    background: '#ffffff',
                    fontSize: '0.92rem',
                    color: '#0f172a',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    if (!fieldErrors.email) {
                      e.target.style.borderColor = '#1d68f7';
                      e.target.style.boxShadow = '0 0 0 3px rgba(29, 104, 247, 0.12)';
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
                <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px', fontWeight: 500 }}>
                  {fieldErrors.email}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '8px' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  color: '#1e293b',
                  marginBottom: '6px',
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
                  <Lock size={17} />
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
                    height: '46px',
                    paddingLeft: '44px',
                    paddingRight: '44px',
                    borderRadius: '14px',
                    border: `1.5px solid ${fieldErrors.password ? '#ef4444' : '#e2e8f0'}`,
                    background: '#ffffff',
                    fontSize: '0.92rem',
                    color: '#0f172a',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    if (!fieldErrors.password) {
                      e.target.style.borderColor = '#1d68f7';
                      e.target.style.boxShadow = '0 0 0 3px rgba(29, 104, 247, 0.12)';
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
                <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px', fontWeight: 500 }}>
                  {fieldErrors.password}
                </div>
              )}
            </div>

            {/* Forgot Password Link */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#1d68f7',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
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
                gap: '9px',
                boxShadow: '0 10px 24px rgba(29, 104, 247, 0.35)',
                transition: 'all 0.2s ease',
                opacity: isLoading ? 0.8 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(29, 104, 247, 0.42)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 24px rgba(29, 104, 247, 0.35)';
                }
              }}
            >
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.35)',
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
              margin: '14px 0',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span
              style={{
                padding: '0 12px',
                color: '#94a3b8',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.6px',
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
              fontSize: '0.84rem',
              color: '#475569',
              marginBottom: '14px',
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
                fontSize: '0.84rem',
              }}
            >
              Register
            </button>
          </div>

          {/* Card Bottom Footer: Secure & Reliable Trust Banner */}
          <div
            style={{
              paddingTop: '12px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#1d68f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a', lineHeight: 1.2 }}>
                Secure & Reliable
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', lineHeight: 1.3 }}>
                Your data is protected with enterprise-grade security.
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* COLUMN 2 (RIGHT): Cohesive Hero Scene (No Boxy Boundaries)   */}
        {/* ============================================================ */}
        <div
          className="tfp-login-hero"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '4px 0',
            position: 'relative',
          }}
        >
          {/* Top Blue Accent Line */}
          <div
            style={{
              width: '38px',
              height: '4px',
              background: '#1d68f7',
              borderRadius: '999px',
              marginBottom: '10px',
            }}
          />

          {/* Big Hero Heading */}
          <h1
            style={{
              fontSize: 'clamp(2.0rem, 3.0vw, 2.7rem)',
              fontWeight: 900,
              color: '#0f172a',
              lineHeight: 1.12,
              margin: '0 0 8px 0',
              letterSpacing: '-0.8px',
            }}
          >
            Work Smarter<br />
            <span style={{ color: '#1d68f7' }}>Together</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '0.88rem',
              lineHeight: 1.5,
              color: '#64748b',
              margin: '0 0 16px 0',
              maxWidth: '480px',
            }}
          >
            Plan, track and manage tasks, projects, leads, complaints, and team hierarchy with real-time speed.
          </p>

          {/* 3 Feature Badges in a Horizontal Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '14px',
            }}
          >
            {/* Feature 1: Ultra-Fast Workflow */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#eff6ff',
                  color: '#1d68f7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 8px rgba(29, 104, 247, 0.12)',
                }}
              >
                <Zap size={18} />
              </div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.84rem' }}>
                Ultra-Fast Workflow
              </div>
              <div style={{ color: '#64748b', fontSize: '0.72rem', lineHeight: 1.3 }}>
                Instant zero-lag navigation and data sync
              </div>
            </div>

            {/* Feature 2: Hierarchy & Team Visibility */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 8px rgba(16, 185, 129, 0.12)',
                }}
              >
                <Users size={18} />
              </div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.84rem' }}>
                Hierarchy & Team Visibility
              </div>
              <div style={{ color: '#64748b', fontSize: '0.72rem', lineHeight: 1.3 }}>
                Role-scoped management and live collaboration
              </div>
            </div>

            {/* Feature 3: Enterprise Modules */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#fff7ed',
                  color: '#f97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 8px rgba(249, 115, 22, 0.12)',
                }}
              >
                <BarChart3 size={18} />
              </div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.84rem' }}>
                Enterprise Modules
              </div>
              <div style={{ color: '#64748b', fontSize: '0.72rem', lineHeight: 1.3 }}>
                CRM Leads, SLA Complaints, and Project Delivery
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* Seamless Dissolved Laptop & Phone (Bottom-Right Anchored)    */}
          {/* ============================================================ */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '660px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              marginTop: '4px',
              transform: 'translate(3%, 3%)',
            }}
          >
            <img
              src={laptopHeroImg}
              alt="TaskFlow Enterprise Devices"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '315px',
                objectFit: 'contain',
                display: 'block',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
