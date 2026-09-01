import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Shield,
  ShieldCheck,
} from 'lucide-react';

export const Register = ({ onSwitchToLogin, initialRole = 'user' }) => {
  const { register } = useAuth();

  // Dual role state: 'manager' | 'user'
  const [registerRole, setRegisterRole] = useState(initialRole === 'manager' ? 'manager' : 'user');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validate = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = 'Full name is required';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      errors.email = 'Please provide a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 4) {
      errors.password = 'Password must be at least 4 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setSuccessMessage('');

    if (!validate()) return;

    setIsLoading(true);
    const targetRole = registerRole === 'manager' ? 'Manager' : 'User';
    const targetDept = registerRole === 'manager' ? 'Management' : 'Operations';

    const res = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      role: targetRole,
      department: targetDept,
    });
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage(res.message || 'Account created successfully! Redirecting to login...');
      setTimeout(() => {
        if (onSwitchToLogin) {
          onSwitchToLogin({
            prefillEmail: email.trim(),
            initialRole: registerRole,
            successMessage: `Account created successfully as ${targetRole}! Please sign in with your credentials.`,
          });
        }
      }, 1500);
    } else {
      setGeneralError(res.message || 'Registration failed. Please check your inputs.');
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card" style={{ maxWidth: '460px', width: '100%' }}>
        {/* Header Block */}
        <div className="login-header-block">
          <div
            className="login-icon-box"
            style={{
              background:
                registerRole === 'manager'
                  ? 'linear-gradient(135deg, #2563eb, #3b82f6)'
                  : 'linear-gradient(135deg, #059669, #10b981)',
              boxShadow:
                registerRole === 'manager'
                  ? '0 4px 14px rgba(37, 99, 235, 0.25)'
                  : '0 4px 14px rgba(5, 150, 105, 0.25)',
            }}
          >
            {registerRole === 'manager' ? (
              <ShieldCheck size={28} color="#ffffff" />
            ) : (
              <UserPlus size={28} color="#ffffff" />
            )}
          </div>
          <h1 className="login-title">
            {registerRole === 'manager' ? 'Manager Registration' : 'Employee Registration'}
          </h1>
          <p className="login-subtitle">
            {registerRole === 'manager'
              ? 'Register as an executive manager to oversee employees, track workloads, and assign tasks'
              : 'Register as a team member to access your personal workspace and assigned tasks'}
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
              setRegisterRole('manager');
              setGeneralError('');
            }}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: 'none',
              background: registerRole === 'manager' ? '#2563eb' : 'transparent',
              color: registerRole === 'manager' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow:
                registerRole === 'manager' ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none',
            }}
          >
            <Shield size={16} />
            <span>Manager Portal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRegisterRole('user');
              setGeneralError('');
            }}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: 'none',
              background: registerRole === 'user' ? '#059669' : 'transparent',
              color: registerRole === 'user' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow:
                registerRole === 'user' ? '0 2px 6px rgba(5, 150, 105, 0.25)' : 'none',
            }}
          >
            <User size={16} />
            <span>User Portal</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
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
              marginBottom: '20px',
            }}
          >
            <CheckCircle2 size={18} color="#059669" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {generalError && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: '20px' }}>
            <AlertCircle size={18} />
            <span>{generalError}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="register-name">
              Full Name <span className="required">*</span>
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
                <User size={16} />
              </div>
              <input
                id="register-name"
                type="text"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                placeholder="Enter your full name (e.g. Alex Morgan)"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                }}
                disabled={isLoading || !!successMessage}
                autoComplete="name"
              />
            </div>
            {fieldErrors.name && <span className="form-error-msg">{fieldErrors.name}</span>}
          </div>

          {/* Email Address */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="register-email">
              Email Address <span className="required">*</span>
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
                id="register-email"
                type="email"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                placeholder="name@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                }}
                disabled={isLoading || !!successMessage}
                autoComplete="email"
              />
            </div>
            {fieldErrors.email && <span className="form-error-msg">{fieldErrors.email}</span>}
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="register-password">
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
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingLeft: '38px', paddingRight: '42px' }}
                placeholder="Create a password (min. 4 characters)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                }}
                disabled={isLoading || !!successMessage}
                autoComplete="new-password"
              />
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
            {fieldErrors.password && <span className="form-error-msg">{fieldErrors.password}</span>}
          </div>

          {/* Confirm Password */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="register-confirm-password">
              Confirm Password <span className="required">*</span>
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
                id="register-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingLeft: '38px', paddingRight: '42px' }}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }
                }}
                disabled={isLoading || !!successMessage}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: showConfirmPassword ? '#2563eb' : '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <span className="form-error-msg">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              borderColor: '#1d4ed8',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 600,
            }}
            disabled={isLoading || !!successMessage}
          >
            {isLoading ? (
              <span>Registering Account...</span>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Register & Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Switch to Login Link */}
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
          <span>Already have an account? </span>
          <button
            type="button"
            onClick={() => onSwitchToLogin && onSwitchToLogin()}
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
            Sign In here
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
          <span>Official TaskFlow Pro Enterprise System</span>
        </div>
      </div>
    </div>
  );
};
