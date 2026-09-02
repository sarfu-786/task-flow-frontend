import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';

export const ForgotPassword = ({ onBackToLogin, onSuccessReset }) => {
  // Steps: 'email' | 'otp' | 'reset' | 'success'
  const [step, setStep] = useState('email');

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [popupOtp, setPopupOtp] = useState('');
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Auto-remove error / success messages after 4 seconds
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!usernameOrEmail.trim()) {
      setFieldErrors({ usernameOrEmail: 'Username or email address is required' });
      return;
    }
    setFieldErrors({});
    setIsLoading(true);

    try {
      const res = await api.forgotPassword(usernameOrEmail.trim());
      setIsLoading(false);
      if (res.success && res.otp) {
        setPopupOtp(res.otp);
        setShowOtpPopup(true);
        setStep('otp');
        setSuccessMsg('Reset OTP generated! See the verification popup below.');
      } else {
        setErrorMsg(res.message || 'Failed to generate OTP');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Failed to request OTP. Please verify your username/email.');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!otp.trim()) {
      setFieldErrors({ otp: 'Please enter the 6-digit OTP' });
      return;
    }
    if (otp.trim().length !== 6) {
      setFieldErrors({ otp: 'OTP must be exactly 6 digits' });
      return;
    }
    setFieldErrors({});
    setIsLoading(true);

    try {
      const res = await api.verifyOtp(usernameOrEmail.trim(), otp.trim());
      setIsLoading(false);
      if (res.success) {
        setStep('reset');
        setShowOtpPopup(false);
        setSuccessMsg('OTP verified! Please create your new password.');
      } else {
        setErrorMsg(res.message || 'Invalid OTP');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Invalid OTP. Please check the OTP code and try again.');
    }
  };

  // Step 3: Save New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const errors = {};

    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 4) {
      errors.newPassword = 'Password must be at least 4 characters long';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsLoading(true);

    try {
      const res = await api.resetPassword(usernameOrEmail.trim(), otp.trim(), newPassword);
      setIsLoading(false);
      if (res.success) {
        setStep('success');
        setSuccessMsg('Password has been reset successfully!');
        setTimeout(() => {
          if (onSuccessReset) {
            onSuccessReset({
              email: usernameOrEmail.trim(),
              message: 'Password reset successful! Please log in with your new password.',
            });
          } else if (onBackToLogin) {
            onBackToLogin();
          }
        }, 2200);
      } else {
        setErrorMsg(res.message || 'Failed to reset password');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Failed to reset password. Please try again.');
    }
  };

  const handleCopyOtp = () => {
    navigator.clipboard.writeText(popupOtp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const handleAutoFillOtp = () => {
    setOtp(popupOtp);
    if (fieldErrors.otp) setFieldErrors((prev) => ({ ...prev, otp: '' }));
  };

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
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              boxShadow: '0 6px 18px rgba(79, 70, 229, 0.28)',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
            }}
          >
            <KeyRound size={28} color="#ffffff" />
          </div>
          <h1 className="login-title" style={{ fontSize: '1.6rem', marginBottom: 0 }}>Reset Password</h1>
        </div>

        {/* Live OTP Pop-up Banner */}
        {showOtpPopup && popupOtp && (
          <div
            style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              border: '2px dashed #3b82f6',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.15)',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#2563eb" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e40af' }}>
                  Verification OTP Pop-up
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  background: '#2563eb',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                Valid for 10 min
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid #bfdbfe',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Your Reset Code:</span>
                <span style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '4px', color: '#1e3a8a' }}>
                  {popupOtp}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleAutoFillOtp}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  title="Auto-fill OTP into input"
                >
                  <span>Auto-fill</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyOtp}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {copiedOtp ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                  <span>{copiedOtp ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
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
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div
            className="alert alert-danger"
            role="alert"
            style={{ marginBottom: '18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Enter Email / Username */}
        {step === 'email' && (
          <form onSubmit={handleRequestOtp} noValidate>
            <div className="form-group" style={{ marginBottom: '22px' }}>
              <label className="form-label" htmlFor="forgot-email">
                Username or Email Address <span className="required">*</span>
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
                  id="forgot-email"
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Enter your registered username or email"
                  value={usernameOrEmail}
                  onChange={(e) => {
                    setUsernameOrEmail(e.target.value);
                    if (fieldErrors.usernameOrEmail) setFieldErrors((prev) => ({ ...prev, usernameOrEmail: '' }));
                  }}
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
              {fieldErrors.usernameOrEmail && (
                <span className="form-error-msg">{fieldErrors.usernameOrEmail}</span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                borderColor: '#4338ca',
                boxShadow: '0 3px 12px rgba(79, 70, 229, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 600,
                fontSize: '0.95rem',
              }}
              disabled={isLoading}
            >
              {isLoading ? <span>Generating OTP...</span> : <span>Send Reset OTP Code</span>}
            </button>
          </form>
        )}

        {/* STEP 2: Enter & Verify OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} noValidate>
            <div className="form-group" style={{ marginBottom: '22px' }}>
              <label className="form-label" htmlFor="forgot-otp">
                Enter 6-Digit OTP Code <span className="required">*</span>
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
                  <ShieldCheck size={16} />
                </div>
                <input
                  id="forgot-otp"
                  type="text"
                  maxLength={6}
                  className="form-control"
                  style={{
                    paddingLeft: '38px',
                    letterSpacing: '4px',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                  }}
                  placeholder="------"
                  value={otp}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                    setOtp(cleanVal);
                    if (fieldErrors.otp) setFieldErrors((prev) => ({ ...prev, otp: '' }));
                  }}
                  disabled={isLoading}
                  autoComplete="one-time-code"
                />
              </div>
              {fieldErrors.otp && <span className="form-error-msg">{fieldErrors.otp}</span>}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '12px', borderRadius: '12px' }}
                onClick={() => setStep('email')}
                disabled={isLoading}
              >
                Change Email
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                  borderColor: '#4338ca',
                  fontWeight: 600,
                }}
                disabled={isLoading}
              >
                {isLoading ? <span>Verifying OTP...</span> : <span>Verify OTP Code</span>}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Create & Confirm New Password */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} noValidate>
            {/* Create New Password */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" htmlFor="reset-new-password">
                Create your new password <span className="required">*</span>
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
                  id="reset-new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{ paddingLeft: '38px', paddingRight: '38px' }}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (fieldErrors.newPassword) setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
                  }}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: showNewPassword ? '#4f46e5' : '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.newPassword && <span className="form-error-msg">{fieldErrors.newPassword}</span>}
            </div>

            {/* Confirm New Password */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" htmlFor="reset-confirm-password">
                Confirm your new password <span className="required">*</span>
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
                  id="reset-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{ paddingLeft: '38px', paddingRight: '38px' }}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: showConfirmPassword ? '#4f46e5' : '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <span className="form-error-msg">{fieldErrors.confirmPassword}</span>
              )}
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                borderColor: '#047857',
                boxShadow: '0 3px 12px rgba(5, 150, 105, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 600,
                fontSize: '0.95rem',
              }}
              disabled={isLoading}
            >
              {isLoading ? <span>Saving New Password...</span> : <span>Save & Reset Password</span>}
            </button>
          </form>
        )}

        {/* STEP 4: Success State */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '2px solid #a7f3d0',
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Password Reset Complete!
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '20px' }}>
              Your new password has been securely updated. Redirecting to login...
            </p>
          </div>
        )}

        {/* Back to Sign In Link */}
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
          <button
            type="button"
            onClick={() => onBackToLogin && onBackToLogin()}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#4f46e5',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: 0,
              fontSize: '0.875rem',
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
