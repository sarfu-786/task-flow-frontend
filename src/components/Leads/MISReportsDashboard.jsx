import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { exportToExcel } from '../../services/exportUtils';
import {
  FileSpreadsheet,
  Download,
  Layers,
  Award,
  PieChart,
  AlertTriangle,
  DollarSign,
  RefreshCw,
} from 'lucide-react';

const MIS_REPORTS_MENU = [
  {
    id: 'MIS-01',
    title: 'Funnel & Cycle Time',
    subtitle: 'Conversion rate & days spent per stage',
    icon: Layers,
    color: '#2563eb',
  },
  {
    id: 'MIS-02',
    title: 'Agent Performance',
    subtitle: 'Calls, dispositions & deals won per agent',
    icon: Award,
    color: '#059669',
  },
  {
    id: 'MIS-03',
    title: 'Call Outcomes & Dispositions',
    subtitle: 'Call results breakdown across sources',
    icon: PieChart,
    color: '#d97706',
  },
  {
    id: 'MIS-04',
    title: 'Pipeline Aging & Risk',
    subtitle: 'Inactive deals & at-risk revenue',
    icon: AlertTriangle,
    color: '#dc2626',
  },
  {
    id: 'MIS-05',
    title: 'Lead Source ROI & Revenue',
    subtitle: 'Acquisition cost vs closed revenue by channel',
    icon: DollarSign,
    color: '#7c3aed',
  },
];

export const MISReportsDashboard = () => {
  const [selectedReportId, setSelectedReportId] = useState('MIS-01');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async (reportId) => {
    setLoading(true);
    try {
      const res = await api.getMISReport(reportId);
      if (res && res.success) {
        setReportData(res);
      }
    } catch (err) {
      console.error('Failed to load MIS report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedReportId);
  }, [selectedReportId]);

  const activeReportConfig = MIS_REPORTS_MENU.find((r) => r.id === selectedReportId) || MIS_REPORTS_MENU[0];

  const handleExportExcel = () => {
    if (!reportData) {
      alert('Report data is still loading. Please wait a moment.');
      return;
    }

    if (selectedReportId === 'MIS-01') {
      const stages = reportData?.metrics?.stageBreakdown || [];
      const columns = [
        { key: 'name', label: 'Stage' },
        { key: 'count', label: 'Active Leads / Deals' },
        { key: 'avgDays', label: 'Avg Days in Stage', formatter: (val) => `${val} Days` },
        { key: 'conversionRate', label: 'Stage Conversion Rate', formatter: (val) => `${val}%` },
      ];
      exportToExcel('Funnel_Cycle_Time_Report', stages, columns, {
        sheetName: 'Funnel Velocity',
      });
    } else if (selectedReportId === 'MIS-02') {
      const agents = reportData?.metrics?.agents || [];
      const columns = [
        { key: 'agentName', label: 'Agent / Representative' },
        { key: 'role', label: 'Role' },
        { key: 'leadsManaged', label: 'Leads Assigned' },
        { key: 'callsMade', label: 'Calls Made' },
        { key: 'dispositionsLogged', label: 'Dispositions Logged' },
        { key: 'wonConversionValue', label: 'Won Value (INR)', formatter: (val) => Number(val || 0) },
        { key: 'conversionRatio', label: 'Conversion Ratio', formatter: (val) => `${val || 0}%` },
      ];
      exportToExcel('Agent_Performance_Report', agents, columns, {
        sheetName: 'Agent Efficiency',
      });
    } else if (selectedReportId === 'MIS-03') {
      const sources = reportData?.metrics?.sourceBreakdown || [];
      const columns = [
        { key: 'source', label: 'Inbound Source' },
        { key: 'total', label: 'Total Leads' },
        { key: 'NO_ANSWER', label: 'No Answer' },
        { key: 'BUSY', label: 'Busy' },
        { key: 'CALL_BACK', label: 'Callback' },
        { key: 'NOT_INTERESTED', label: 'Not Interested' },
        { key: 'QUALIFIED_OPPORTUNITY', label: 'Qualified' },
      ];
      exportToExcel('Call_Outcomes_Dispositions_Report', sources, columns, {
        sheetName: 'Call Dispositions',
      });
    } else if (selectedReportId === 'MIS-04') {
      const atRisk = reportData?.metrics?.atRiskList || [];
      const columns = [
        { key: 'name', label: 'Opportunity' },
        { key: 'company', label: 'Company' },
        { key: 'stage', label: 'Stage' },
        { key: 'pipeline_value', label: 'Pipeline Value (INR)', formatter: (val) => Number(val || 0) },
        { key: 'daysInStage', label: 'Days Inactive', formatter: (val) => `${val} Days` },
        { key: 'assignedTo', label: 'Owner' },
        { key: 'riskTier', label: 'Risk Level' },
      ];
      exportToExcel('Pipeline_Aging_Risk_Report', atRisk, columns, {
        sheetName: 'Pipeline Risk',
      });
    } else if (selectedReportId === 'MIS-05') {
      const channels = reportData?.metrics?.channels || [];
      const columns = [
        { key: 'channel', label: 'Marketing Channel' },
        { key: 'leadsAcquired', label: 'Leads' },
        { key: 'avgCPL', label: 'Avg CPL ($)' },
        { key: 'totalAcquisitionCost', label: 'Acquisition Cost ($)' },
        { key: 'revenueGenerated', label: 'Won Revenue (INR)', formatter: (val) => Number(val || 0) },
        { key: 'netProfit', label: 'Net Profit (INR)', formatter: (val) => Number(val || 0) },
        { key: 'roiPercentage', label: 'Channel ROI', formatter: (val) => `${val}%` },
      ];
      exportToExcel('Lead_Source_ROI_Revenue_Report', channels, columns, {
        sheetName: 'Channel ROI',
      });
    }
  };

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN')}`;
  };

  return (
    <div className="mis-reports-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={22} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              MIS Reports & Performance Analytics
            </h3>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
            Track sales velocity, agent productivity, call dispositions, and channel ROI.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleExportExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '999px',
              background: '#059669',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(5, 150, 105, 0.25)',
              transition: 'all 0.15s ease',
            }}
            title="Download report as Excel (.xlsx) file"
          >
            <FileSpreadsheet size={15} />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => fetchReport(selectedReportId)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '999px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 5 Clean MIS Report Selector Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px',
        }}
      >
        {MIS_REPORTS_MENU.map((rep) => {
          const Icon = rep.icon;
          const isSelected = selectedReportId === rep.id;

          return (
            <button
              key={rep.id}
              type="button"
              onClick={() => setSelectedReportId(rep.id)}
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                border: `1.5px solid ${isSelected ? rep.color : '#e2e8f0'}`,
                background: isSelected ? '#ffffff' : '#f8fafc',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? `0 6px 18px ${rep.color}18` : 'none',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: `${rep.color}15`,
                  color: rep.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={18} />
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    color: isSelected ? '#0f172a' : '#334155',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {rep.title}
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: '#64748b',
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {rep.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected MIS Report Content Display */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Report Header Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '18px',
            paddingBottom: '12px',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              {activeReportConfig.title}
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              {activeReportConfig.subtitle}
            </p>
          </div>

          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              background: '#eff6ff',
              color: '#2563eb',
              padding: '4px 10px',
              borderRadius: '999px',
              border: '1px solid #bfdbfe',
            }}
          >
            Live Analytics
          </span>
        </div>

        {/* Report Table / Metrics Content */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={22} className="spin" style={{ margin: '0 auto 8px', color: activeReportConfig.color }} />
            <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>Loading report data...</div>
          </div>
        ) : selectedReportId === 'MIS-01' ? (
          /* MIS-01: Funnel & Cycle Time */
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>
                  Total Cycle Velocity
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e3a8a', marginTop: '3px' }}>
                  {reportData?.metrics?.totalCycleDays || 23.0} Days
                </div>
                <div style={{ fontSize: '0.72rem', color: '#3b82f6', marginTop: '2px' }}>Average Lead-to-Won duration</div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Stage</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Active Leads / Deals</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Avg Days in Stage</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Stage Conversion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData?.metrics?.stageBreakdown || []).map((s) => (
                    <tr key={s.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1e293b' }}>{s.name}</td>
                      <td style={{ padding: '12px 14px', color: '#334155' }}>{s.count}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#d97706' }}>{s.avgDays} Days</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', fontWeight: 700, fontSize: '0.76rem' }}>
                          {s.conversionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : selectedReportId === 'MIS-02' ? (
          /* MIS-02: Agent Performance */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Agent / Representative</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Role</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Leads Assigned</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Calls Made</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Dispositions</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Won Value</th>
                </tr>
              </thead>
              <tbody>
                {(reportData?.metrics?.agents || []).map((agent) => (
                  <tr key={agent.agentName} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1e293b' }}>{agent.agentName}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{agent.role}</td>
                    <td style={{ padding: '12px 14px', color: '#334155' }}>{agent.leadsManaged}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#2563eb' }}>{agent.callsMade}</td>
                    <td style={{ padding: '12px 14px', color: '#334155' }}>{agent.dispositionsLogged}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#059669' }}>
                      {formatCurrency(agent.wonConversionValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : selectedReportId === 'MIS-03' ? (
          /* MIS-03: Call Outcomes & Dispositions */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Inbound Source</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Leads</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>No Answer</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Busy</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Callback</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Not Interested</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Qualified</th>
                </tr>
              </thead>
              <tbody>
                {(reportData?.metrics?.sourceBreakdown || []).map((src) => (
                  <tr key={src.source} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1e293b' }}>{src.source}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{src.total}</td>
                    <td style={{ padding: '12px 14px', color: '#d97706' }}>{src.NO_ANSWER}</td>
                    <td style={{ padding: '12px 14px', color: '#ea580c' }}>{src.BUSY}</td>
                    <td style={{ padding: '12px 14px', color: '#2563eb' }}>{src.CALL_BACK}</td>
                    <td style={{ padding: '12px 14px', color: '#dc2626' }}>{src.NOT_INTERESTED}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#059669' }}>{src.QUALIFIED_OPPORTUNITY}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : selectedReportId === 'MIS-04' ? (
          /* MIS-04: Pipeline Aging & Risk */
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                  Total Pipeline at Risk
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#b91c1c', marginTop: '3px' }}>
                  {formatCurrency(reportData?.metrics?.totalPipelineAtRiskValue)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: '2px' }}>
                  {reportData?.metrics?.atRiskOpportunitiesCount || 0} stagnant opportunities (&gt;14 days inactive)
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Opportunity</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Stage</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Pipeline Value</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Days Inactive</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Owner</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData?.metrics?.atRiskList || []).length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        No opportunities currently stagnated beyond the 14 days threshold.
                      </td>
                    </tr>
                  ) : (
                    (reportData?.metrics?.atRiskList || []).map((opp) => (
                      <tr key={opp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1e293b' }}>
                          {opp.name} <span style={{ color: '#64748b', fontWeight: 400 }}>({opp.company})</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>{opp.stage}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#059669' }}>
                          {formatCurrency(opp.pipeline_value)}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#dc2626' }}>{opp.daysInStage} Days</td>
                        <td style={{ padding: '12px 14px', color: '#334155' }}>{opp.assignedTo}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: opp.riskTier === 'CRITICAL' ? '#fef2f2' : '#fffbeb',
                              color: opp.riskTier === 'CRITICAL' ? '#dc2626' : '#d97706',
                              fontWeight: 800,
                              fontSize: '0.74rem',
                            }}
                          >
                            {opp.riskTier}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* MIS-05: Lead Source ROI & Revenue */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Marketing Channel</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Leads</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Avg CPL</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Acquisition Cost</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Won Revenue</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Net Profit</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Channel ROI</th>
                </tr>
              </thead>
              <tbody>
                {(reportData?.metrics?.channels || []).map((ch) => (
                  <tr key={ch.channel} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1e293b' }}>{ch.channel}</td>
                    <td style={{ padding: '12px 14px', color: '#334155' }}>{ch.leadsAcquired}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>${ch.avgCPL}</td>
                    <td style={{ padding: '12px 14px', color: '#d97706' }}>${ch.totalAcquisitionCost}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#059669' }}>{formatCurrency(ch.revenueGenerated)}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: ch.netProfit >= 0 ? '#059669' : '#dc2626' }}>
                      {formatCurrency(ch.netProfit)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: ch.roiPercentage > 0 ? '#ecfdf5' : '#f8fafc',
                          color: ch.roiPercentage > 0 ? '#059669' : '#64748b',
                          fontWeight: 800,
                          fontSize: '0.74rem',
                        }}
                      >
                        {ch.roiPercentage}% ROI
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MISReportsDashboard;
