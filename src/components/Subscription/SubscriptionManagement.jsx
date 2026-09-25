import React, { useState } from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import {
  Layers,
  CreditCard,
  Users,
  Target,
  AlertCircle,
  FolderKanban,
  CheckCircle2,
  Shield,
  Zap,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Clock,
  Sparkles,
  Info,
  Calendar,
  CheckSquare,
  HelpCircle,
} from 'lucide-react';

export const SubscriptionManagement = () => {
  const {
    subscription,
    activeModules,
    userSeats,
    currency,
    totalAnnualBilling,
    breakdown,
    catalog,
    loading,
    error,
    toggleModule,
    updateSeats,
    setCurrency,
  } = useSubscription();

  const { isSuperAdmin, isManager } = useAuth();

  const [seatInput, setSeatInput] = useState(userSeats || 12);
  const [isUpdatingSeats, setIsUpdatingSeats] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSeatChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setSeatInput(isNaN(val) ? 1 : Math.max(1, val));
  };

  const handleSaveSeats = async () => {
    try {
      setIsUpdatingSeats(true);
      setSuccessMessage('');
      setErrorMessage('');
      await updateSeats(seatInput);
      setSuccessMessage(`User seat count successfully updated to ${seatInput} seats.`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update seats');
    } finally {
      setIsUpdatingSeats(false);
    }
  };

  const handleToggle = async (moduleId) => {
    if (!isSuperAdmin && !isManager) {
      setErrorMessage('Only Super Admin or Managers can configure client module subscriptions.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    try {
      setSuccessMessage('');
      setErrorMessage('');
      await toggleModule(moduleId);
      const isNowActive = !activeModules.includes(moduleId);
      setSuccessMessage(
        `${catalog[moduleId]?.name || moduleId} has been ${isNowActive ? 'activated' : 'deactivated'}. Pricing updated.`
      );
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to toggle module');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  return (
    <div className="page-container fade-in">
      {/* Page Header */}
      <div className="section-header-modern">
        <div className="section-header-left">
          <div className="section-icon-badge" style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }}>
            <Layers size={22} color="#2563eb" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="section-title">Module Subscriptions & Annual Pricing</h1>
              <span className="badge-official" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>
                Annual Billing Cycle
              </span>
            </div>
            <p className="section-subtitle">
              Configure activated client modules and manage annual per-user seat pricing calculations.
            </p>
          </div>
        </div>

        <div className="section-header-right">
          {/* Currency Toggle */}
          <div className="currency-toggle-group">
            <button
              type="button"
              className={`currency-btn ${currency === 'USD' ? 'active' : ''}`}
              onClick={() => setCurrency('USD')}
            >
              $ USD
            </button>
            <button
              type="button"
              className={`currency-btn ${currency === 'INR' ? 'active' : ''}`}
              onClick={() => setCurrency('INR')}
            >
              ₹ INR
            </button>
          </div>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMessage && (
        <div className="alert-official-success fade-in">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="alert-official-error fade-in">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Annual Pricing Summary Cockpit */}
      <div className="billing-summary-grid">
        {/* Total Annual Card */}
        <div className="card-official-metric highlight-blue">
          <div className="metric-header">
            <span className="metric-label">Total Annual Billing</span>
            <div className="metric-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div className="metric-main-value">
            {currencySymbol}
            {totalAnnualBilling?.toLocaleString()}
            <span className="metric-period"> / year</span>
          </div>
          <div className="metric-formula-note">
            Formula: <strong>{activeModules.length} Modules</strong> × <strong>{userSeats} Users</strong> × Annual Rate
          </div>
        </div>

        {/* Active Modules Card */}
        <div className="card-official-metric">
          <div className="metric-header">
            <span className="metric-label">Activated Modules</span>
            <div className="metric-icon-wrap" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <CheckSquare size={18} />
            </div>
          </div>
          <div className="metric-main-value">
            {activeModules.length}
            <span className="metric-sub-count"> / 4 available</span>
          </div>
          <div className="metric-badges-row">
            {activeModules.map((m) => (
              <span key={m} className="module-pill-tag">
                {m === 'leads' ? 'Leads' : m === 'complaints' ? 'Complaints' : m === 'tasks' ? 'Tasks' : 'Projects'}
              </span>
            ))}
          </div>
        </div>

        {/* User Seats Card */}
        <div className="card-official-metric">
          <div className="metric-header">
            <span className="metric-label">User Seats Purchased</span>
            <div className="metric-icon-wrap" style={{ background: '#f8fafc', color: '#475569' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="metric-seats-input-wrap">
            <input
              type="number"
              min="1"
              max="500"
              value={seatInput}
              onChange={handleSeatChange}
              className="seats-number-input"
              disabled={!isSuperAdmin && !isManager}
            />
            {(isSuperAdmin || isManager) && (
              <button
                type="button"
                className="btn-official-primary btn-sm"
                onClick={handleSaveSeats}
                disabled={isUpdatingSeats || seatInput === userSeats}
              >
                {isUpdatingSeats ? 'Updating...' : 'Update Seats'}
              </button>
            )}
          </div>
          <span className="metric-seats-hint">Billed annually across all selected modules</span>
        </div>
      </div>

      {/* 4 Core Modules Pricing & Activation Catalog */}
      <div className="section-subheading-wrap">
        <div>
          <h2 className="section-subheading">Core Modules & Pricing Catalog</h2>
          <p className="text-muted-sm">
            Enable or disable modules for your organization. Pricing recalculates instantly.
          </p>
        </div>
      </div>

      <div className="module-cards-grid">
        {Object.entries(catalog).map(([modKey, mod]) => {
          const isSelected = activeModules.includes(modKey);
          const unitPrice = currency === 'INR' ? mod.annualPriceINR : mod.annualPriceUSD;
          const lineTotal = unitPrice * userSeats;

          return (
            <div
              key={modKey}
              className={`module-pricing-card ${isSelected ? 'is-active' : 'is-inactive'}`}
            >
              {/* Card Header & Switch */}
              <div className="module-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    className="module-icon-box"
                    style={{
                      background: isSelected ? `${mod.color}15` : '#f1f5f9',
                      color: isSelected ? mod.color : '#64748b',
                      border: `1px solid ${isSelected ? `${mod.color}40` : '#e2e8f0'}`,
                    }}
                  >
                    {modKey === 'leads' && <Target size={20} />}
                    {modKey === 'complaints' && <AlertCircle size={20} />}
                    {modKey === 'tasks' && <CheckSquare size={20} />}
                    {modKey === 'projects' && <FolderKanban size={20} />}
                  </div>
                  <div>
                    <h3 className="module-name">{mod.name}</h3>
                    <span className="module-slug-tag">module: {modKey}</span>
                  </div>
                </div>

                {/* Module Toggle Switch */}
                <label className="switch-toggle" title={`Toggle ${mod.name}`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(modKey)}
                    disabled={!isSuperAdmin && !isManager}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              {/* Description */}
              <p className="module-desc">{mod.description}</p>

              {/* Price Calculation Box */}
              <div className="module-price-box">
                <div className="price-main-line">
                  <span className="price-amount">
                    {currencySymbol}
                    {unitPrice.toLocaleString()}
                  </span>
                  <span className="price-unit"> / user / year</span>
                </div>
                {isSelected ? (
                  <div className="price-calculation-line">
                    {currencySymbol}
                    {unitPrice} × {userSeats} users ={' '}
                    <strong>
                      {currencySymbol}
                      {lineTotal.toLocaleString()} / yr
                    </strong>
                  </div>
                ) : (
                  <div className="price-disabled-line">Module Disabled (Not charged)</div>
                )}
              </div>

              {/* Feature Highlights */}
              <div className="module-features-list">
                <span className="features-title">Included Features:</span>
                <ul>
                  {mod.features.map((feat, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={14} color={isSelected ? '#16a34a' : '#94a3b8'} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Footer Status */}
              <div className="module-card-footer">
                <span
                  className={`status-pill ${
                    isSelected ? 'status-pill-success' : 'status-pill-muted'
                  }`}
                >
                  <span className="status-dot"></span>
                  {isSelected ? 'Active & Accessible' : 'Disabled & Hidden'}
                </span>
                <span className="text-muted-xs">
                  {isSelected ? 'Visible in Navigation' : 'Hidden from Sidebar'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Itemized Annual Billing Breakdown Table */}
      <div className="itemized-breakdown-card">
        <div className="breakdown-header">
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              Annual Subscription Invoice Breakdown
            </h3>
            <p className="text-muted-sm" style={{ margin: 0 }}>
              Calculated for {subscription.organizationName || 'TaskFlow Enterprise Client'}
            </p>
          </div>
          <div className="breakdown-meta">
            <span className="renewal-date-pill">
              <Calendar size={13} />
              Renewal Date: {new Date(subscription.renewalDate || Date.now()).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table-official">
            <thead>
              <tr>
                <th>Module</th>
                <th>Status</th>
                <th>Annual Unit Rate</th>
                <th>User Seats</th>
                <th style={{ textAlign: 'right' }}>Annual Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((item) => (
                <tr key={item.moduleId} className={item.isSelected ? '' : 'row-disabled'}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: item.isSelected ? item.color : '#cbd5e1',
                        }}
                      ></span>
                      <div>
                        <strong style={{ color: '#0f172a' }}>{item.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.description}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge-official ${item.isSelected ? 'badge-green' : 'badge-gray'}`}>
                      {item.isSelected ? 'Activated' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    {currencySymbol}
                    {item.unitPrice?.toLocaleString()} / user
                  </td>
                  <td>{item.userSeats} seats</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: item.isSelected ? '#0f172a' : '#94a3b8' }}>
                    {currencySymbol}
                    {item.lineTotal?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="table-total-row">
                <td colSpan="4" style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.95rem' }}>
                  Total Estimated Annual Billing:
                </td>
                <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.2rem', color: '#2563eb' }}>
                  {currencySymbol}
                  {totalAnnualBilling?.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="breakdown-footer-notes">
          <Info size={14} color="#64748b" />
          <span>
            Annual billing is charged upfront. Adding user seats or activating additional modules during your
            annual term will be prorated automatically.
          </span>
        </div>
      </div>
    </div>
  );
};
