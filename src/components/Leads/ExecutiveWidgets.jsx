import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  TrendingUp,
  Award,
  Clock,
  Layers,
  ArrowRight,
  AlertTriangle,
  Flame,
  CheckCircle2,
  PhoneCall,
  DollarSign,
  Crown,
  Shield,
  RefreshCw,
} from 'lucide-react';

export const ExecutiveWidgets = ({ isCompact = false }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getMISAnalytics();
      if (res.success) {
        setAnalyticsData(res);
      }
    } catch (err) {
      console.error('Failed to load MIS analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const funnel = analyticsData?.widgets?.funnelGraphic || [];
  const leaderboard = analyticsData?.widgets?.activityLeaderboard || [];
  const heatmap = analyticsData?.widgets?.stageAgingHeatmap || {};
  const volumeTrends = analyticsData?.widgets?.dynamicVolumeTrends || [];

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN')}`;
  };

  return (
    <div className="executive-widgets-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            Executive LMS Analytical Grid & Graphical Widgets
          </h3>
          <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
            Real-time OLAP streaming intelligence • Funnel velocity, agent leaderboards, aging heatmaps & volume trends.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchAnalytics}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '10px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#334155',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Grid containing the 4 Major Graphical Widgets */}
      <div
        className="executive-widgets-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: isCompact ? '1fr' : 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: '20px',
        }}
      >
        {/* =========================================================================
            WIDGET 1: SALES FUNNEL FUNNEL GRAPHIC
           ========================================================================= */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '22px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ padding: '6px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb' }}>
                <Layers size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                  Sales Funnel Conversion Graphic
                </h4>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Volumetric depletion & stage leakages</span>
              </div>
            </div>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
              Real-time Active
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'center' }}>
            {funnel.map((stage, idx) => {
              const maxCount = Math.max(...funnel.map((f) => f.count), 1);
              const widthPct = Math.max(25, Math.round((stage.count / maxCount) * 100));

              return (
                <div key={stage.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                    <span style={{ color: '#334155' }}>
                      {idx + 1}. {stage.label}
                    </span>
                    <span style={{ color: stage.color }}>
                      {stage.count} leads ({stage.conversionRate}%)
                    </span>
                  </div>

                  <div
                    style={{
                      height: '28px',
                      borderRadius: '8px',
                      background: '#f1f5f9',
                      overflow: 'hidden',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${widthPct}%`,
                        background: `linear-gradient(90deg, ${stage.color}cc, ${stage.color})`,
                        borderRadius: '8px',
                        transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: '8px',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                      }}
                    >
                      {stage.count}
                    </div>

                    {stage.dropOff > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          right: '8px',
                          fontSize: '0.7rem',
                          color: '#94a3b8',
                          fontWeight: 600,
                        }}
                      >
                        ~{stage.dropOff}% leakage
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            WIDGET 2: REAL-TIME ACTIVITY LEADERBOARD
           ========================================================================= */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '22px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ padding: '6px', borderRadius: '8px', background: '#fef3c7', color: '#d97706' }}>
                <Award size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                  Real-Time Activity Leaderboard
                </h4>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Active agent outreach & won deal revenue</span>
              </div>
            </div>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
              Top Performers
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '280px' }}>
            {leaderboard.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.86rem' }}>
                No agent activity logged yet today.
              </div>
            ) : (
              leaderboard.slice(0, 5).map((agent, index) => (
                <div
                  key={agent.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: index === 0 ? '#fffbeb' : '#f8fafc',
                    border: `1px solid ${index === 0 ? '#fde68a' : '#e2e8f0'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '999px',
                        background: index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#d97706' : '#e2e8f0',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {index + 1}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{agent.name}</span>
                        {index === 0 && <Crown size={12} color="#f59e0b" />}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {agent.dispositionsLogged} dispo logged • {agent.callsMade} calls
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#059669' }}>
                      {formatCurrency(agent.wonValue)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Won Value</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* =========================================================================
            WIDGET 3: STAGE-WISE AGING HEATMAP
           ========================================================================= */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '22px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ padding: '6px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626' }}>
                <Clock size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                  Stage-wise Aging Heatmap Grid
                </h4>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Stagnancy analysis & pipeline risk velocity</span>
              </div>
            </div>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              Risk Matrix
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>STAGE</th>
                  <th style={{ padding: '8px' }}>&lt;7 DAYS</th>
                  <th style={{ padding: '8px' }}>7-14 DAYS</th>
                  <th style={{ padding: '8px' }}>14-30 DAYS</th>
                  <th style={{ padding: '8px' }}>&gt;30 DAYS (RISK)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(heatmap).map(([stageName, counts]) => (
                  <tr key={stageName} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 700, color: '#1e293b' }}>
                      {stageName}
                    </td>

                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', fontWeight: 700 }}>
                        {counts.under7}
                      </span>
                    </td>

                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', fontWeight: 700 }}>
                        {counts.days7to14}
                      </span>
                    </td>

                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', background: counts.days14to30 > 0 ? '#fffbeb' : '#f8fafc', color: counts.days14to30 > 0 ? '#d97706' : '#94a3b8', fontWeight: 700 }}>
                        {counts.days14to30}
                      </span>
                    </td>

                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', background: counts.over30 > 0 ? '#fef2f2' : '#f8fafc', color: counts.over30 > 0 ? '#dc2626' : '#94a3b8', fontWeight: 800 }}>
                        {counts.over30}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================================================
            WIDGET 4: DYNAMIC VOLUME TREND CHART
           ========================================================================= */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '22px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ padding: '6px', borderRadius: '8px', background: '#f5f3ff', color: '#7c3aed' }}>
                <TrendingUp size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                  Dynamic Volume Trend Timeline
                </h4>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Lead arrival spikes categorized by channels</span>
              </div>
            </div>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
              Multi-Channel Ingestion
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, justifyContent: 'center' }}>
            {volumeTrends.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.86rem' }}>
                No historical arrival data yet.
              </div>
            ) : (
              volumeTrends.slice(-4).map((trend) => (
                <div key={trend.period} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                    <span style={{ color: '#1e293b' }}>{trend.period}</span>
                    <span style={{ color: '#4f46e5' }}>{trend.total} Ingested Leads</span>
                  </div>

                  {/* Multi-Channel Distribution Bar */}
                  <div style={{ height: '14px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(15, ((trend['Website Direct'] || 0) / (trend.total || 1)) * 100)}%`, background: '#3b82f6' }} title="Website Direct" />
                    <div style={{ width: `${Math.max(10, ((trend['Google Ads'] || 0) / (trend.total || 1)) * 100)}%`, background: '#10b981' }} title="Google Ads" />
                    <div style={{ width: `${Math.max(10, ((trend['LinkedIn Ads'] || 0) / (trend.total || 1)) * 100)}%`, background: '#6366f1' }} title="LinkedIn Ads" />
                    <div style={{ width: `${Math.max(5, ((trend['Partner Referral'] || 0) / (trend.total || 1)) * 100)}%`, background: '#f59e0b' }} title="Referral" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '0.72rem', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '999px', background: '#3b82f6' }} /> Website</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '999px', background: '#10b981' }} /> Google Ads</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '999px', background: '#6366f1' }} /> LinkedIn</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '999px', background: '#f59e0b' }} /> Referrals</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveWidgets;
