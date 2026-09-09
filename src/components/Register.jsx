import React, { useState, useEffect } from 'react';
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
  Briefcase,
  LogIn,
} from 'lucide-react';

const DEPARTMENT_OPTIONS = [
  'Internet Work',
  'Documentation',
  'Backend',
  'Social Media',
  'Sells',
];

export const Register = ({ onSwitchToLogin }) => {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Internet Work');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-remove success message after 4 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

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

    if (!department) {
      errors.department = 'Please select your department';
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
    const res = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      role: 'User',
      department: department.trim(),
    });
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage('Registration submitted! Your account is pending manager approval. Redirecting to login...');
      setTimeout(() => {
        if (onSwitchToLogin) {
          onSwitchToLogin({
            prefillEmail: email.trim(),
            initialRole: 'user',
            successMessage: 'Registration submitted! Your account is pending manager approval before you can login.',
          });
        }
      }, 2000);
    } else {
      setGeneralError(res.message || 'Registration failed. Please check your inputs.');
    }
  };

  return (
    <div className="login-page-wrapper">
      <div
        className="login-card"
        style={{
          maxWidth: '540px',
          width: '100%',
          padding: '36px 36px 32px',
          borderRadius: '24px',
          boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.1), 0 0 1px 1px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Header Block */}
        <div className="login-header-block" style={{ marginBottom: '20px' }}>
          <div
            className="login-icon-box"
            style={{
              background: 'linear-gradient(135deg, #059669, #10b981)',
              boxShadow: '0 6px 18px rgba(5, 150, 105, 0.28)',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
            }}
          >
            <UserPlus size={30} color="#ffffff" />
          </div>
          <h1 className="login-title" style={{ fontSize: '1.65rem', marginBottom: '4px' }}>Create Your Account</h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Welcome to TaskFlow Pro. Register below or sign in to your existing account.
          </p>
        </div>

        {/* Top Switch Tabs: Register vs Sign In */}
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
            style={{
              padding: '10px 14px',
              borderRadius: '9px',
              border: 'none',
              background: '#059669',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'default',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
            }}
          >
            <UserPlus size={16} />
            <span>Register Account</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchToLogin && onSwitchToLogin()}
            style={{
              padding: '10px 14px',
              borderRadius: '9px',
              border: 'none',
              background: 'transparent',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <LogIn size={16} />
            <span>Sign In / Login</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
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
              marginBottom: '20px',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <CheckCircle2 size={18} color="#059669" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {generalError && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: '20px', borderRadius: '12px' }}>
            <AlertCircle size={18} />
            <span>{generalError}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Row 1: Full Name & Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            {/* Full Name */}
            <div className="form-group" style={{ marginBottom: 0 }}>
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
                  placeholder="Enter your full name"
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
            <div className="form-group" style={{ marginBottom: 0 }}>
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
                  placeholder="Enter your email address"
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
          </div>

          {/* Department Selection */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" htmlFor="register-department">
              Department <span className="required">*</span>
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
                  pointerEvents: 'none',
                }}
              >
                <Briefcase size={16} />
              </div>
              <select
                id="register-department"
                className="form-control select-filter"
                style={{ paddingLeft: '38px' }}
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  if (fieldErrors.department) setFieldErrors((prev) => ({ ...prev, department: '' }));
                }}
                disabled={isLoading || !!successMessage}
              >
                {DEPARTMENT_OPTIONS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            {fieldErrors.department && <span className="form-error-msg">{fieldErrors.department}</span>}
          </div>

          {/* Row 2: Password & Confirm Password */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
            {/* Password */}
            <div className="form-group" style={{ marginBottom: 0 }}>
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
                  style={{ paddingLeft: '38px', paddingRight: '36px' }}
                  placeholder="Enter your password"
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
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: showPassword ? '#059669' : '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && <span className="form-error-msg">{fieldErrors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div className="form-group" style={{ marginBottom: 0 }}>
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
                  style={{ paddingLeft: '38px', paddingRight: '36px' }}
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
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: showConfirmPassword ? '#059669' : '#94a3b8',
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
          </div>

          {/* Submit Button */}
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
          <span>Already registered with TaskFlow Pro? </span>
          <button
            type="button"
            onClick={() => onSwitchToLogin && onSwitchToLogin()}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#059669',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
              fontSize: '0.875rem',
            }}
          >
            Sign In here (Manager & Employee)
          </button>
        </div>
      </div>
    </div>
  );
};
