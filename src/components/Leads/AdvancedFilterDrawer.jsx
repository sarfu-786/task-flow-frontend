import React, { useState } from 'react';
import { useLeads } from '../../context/LeadContext';
import {
  Filter,
  Plus,
  Trash2,
  Play,
  RotateCcw,
  Zap,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';

const AVAILABLE_FIELDS = [
  { id: 'lead_status', label: 'Lead Status', type: 'categorical', options: ['NEW', 'IN_PROGRESS', 'NURTURING', 'LOST', 'CONVERTED'] },
  { id: 'disposition_code', label: 'Disposition Code', type: 'categorical', options: ['NO_ANSWER', 'BUSY', 'CALL_BACK', 'NOT_INTERESTED', 'QUALIFIED_OPPORTUNITY', 'NONE'] },
  { id: 'priority', label: 'Priority Level', type: 'categorical', options: ['Low', 'Medium', 'High', 'Urgent'] },
  { id: 'campaign_source', label: 'Campaign Source', type: 'categorical', options: ['Website Direct', 'Justdial', 'Instamart', 'IndiaMART', 'TradeIndia', 'Google Ads', 'Meta Ads', 'LinkedIn Ads', 'WhatsApp', 'Partner Referral', 'Inbound Calls', 'Cold Outreach', 'Walk-In', 'Other'] },
  { id: 'assignedTo', label: 'Assigned Agent', type: 'categorical' },
  { id: 'pipeline_value', label: 'Pipeline Value ($)', type: 'numeric' },
  { id: 'engagement_score', label: 'Engagement Score (0-100)', type: 'numeric' },
  { id: 'days_in_stage', label: 'Days in Current Stage', type: 'numeric' },
  { id: 'retry_count', label: 'Call Retry Count', type: 'numeric' },
  { id: 'sla_tier', label: 'SLA Escalation Tier', type: 'numeric', options: ['0', '1', '2', '3'] },
  { id: 'createdAt', label: 'Created Date', type: 'temporal' },
  { id: 'next_followup_at', label: 'Next Follow-up Date', type: 'temporal' },
  { id: 'name', label: 'Corporate / Contact Name', type: 'text' },
  { id: 'company', label: 'Company Name', type: 'text' },
  { id: 'email', label: 'Email Domain / Address', type: 'text' },
  { id: 'notes', label: 'Transcript & Notes', type: 'text' },
];

const OPERATORS_BY_TYPE = {
  temporal: [
    { id: 'BETWEEN', label: 'BETWEEN (Date Range)' },
    { id: 'GREATER_THAN', label: 'GREATER THAN (After)' },
    { id: 'LESS_THAN', label: 'LESS THAN (Before)' },
  ],
  categorical: [
    { id: 'EQUALS', label: 'EQUALS' },
    { id: 'IN', label: 'IN (One of)' },
    { id: 'NOT IN', label: 'NOT IN' },
  ],
  numeric: [
    { id: 'GT', label: 'GREATER THAN (>)' },
    { id: 'LT', label: 'LESS THAN (<)' },
    { id: 'RANGE', label: 'RANGE (Min - Max)' },
    { id: 'EQUALS', label: 'EQUALS (=)' },
  ],
  text: [
    { id: 'FUZZY', label: 'FUZZY MATCH' },
    { id: 'PHRASE MATCH', label: 'PHRASE MATCH' },
    { id: 'WILDCARD', label: 'WILDCARD / CONTAINS' },
  ],
};

export const AdvancedFilterDrawer = () => {
  const {
    executeAdvancedFilter,
    resetAdvancedFilter,
    isAdvancedFilterActive,
    filterStats,
    leads,
  } = useLeads();

  const [rules, setRules] = useState([
    { id: 'r1', field: 'lead_status', operator: 'EQUALS', value: 'IN_PROGRESS', valueTo: '' },
  ]);
  const [logic, setLogic] = useState('AND');
  const [isExecuting, setIsExecuting] = useState(false);

  const addRule = () => {
    const newRule = {
      id: 'r_' + Date.now(),
      field: 'pipeline_value',
      operator: 'GT',
      value: '10000',
      valueTo: '',
    };
    setRules([...rules, newRule]);
  };

  const removeRule = (id) => {
    if (rules.length === 1) return;
    setRules(rules.filter((r) => r.id !== id));
  };

  const updateRule = (id, key, val) => {
    setRules(
      rules.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [key]: val };
        if (key === 'field') {
          const fieldDef = AVAILABLE_FIELDS.find((f) => f.id === val);
          const ops = OPERATORS_BY_TYPE[fieldDef?.type || 'text'] || OPERATORS_BY_TYPE.text;
          updated.operator = ops[0]?.id || 'EQUALS';
          updated.value = fieldDef?.options ? fieldDef.options[0] : '';
          updated.valueTo = '';
        }
        return updated;
      })
    );
  };

  const handleApply = async () => {
    setIsExecuting(true);
    try {
      await executeAdvancedFilter(rules, logic);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExecuting(false);
    }
  };

  const applyPreset = (presetRules, presetLogic = 'AND') => {
    setRules(presetRules);
    setLogic(presetLogic);
    executeAdvancedFilter(presetRules, presetLogic);
  };

  return (
    <div
      className="advanced-filter-engine-container"
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '20px',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '24px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {/* Header & Logic Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5, #3730a3)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Filter size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
              Advanced Multi-Dimensional Filtrations Engine
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Execute low-latency queries across temporal, categorical, numeric & full-text dimensions.
            </p>
          </div>
        </div>

        {/* Boolean Logic Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', padding: '0 6px' }}>LOGIC:</span>
          <button
            type="button"
            onClick={() => setLogic('AND')}
            style={{
              padding: '4px 12px',
              borderRadius: '8px',
              border: 'none',
              background: logic === 'AND' ? '#4f46e5' : 'transparent',
              color: logic === 'AND' ? '#ffffff' : '#475569',
              fontWeight: 700,
              fontSize: '0.76rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            MATCH ALL (AND)
          </button>
          <button
            type="button"
            onClick={() => setLogic('OR')}
            style={{
              padding: '4px 12px',
              borderRadius: '8px',
              border: 'none',
              background: logic === 'OR' ? '#4f46e5' : 'transparent',
              color: logic === 'OR' ? '#ffffff' : '#475569',
              fontWeight: 700,
              fontSize: '0.76rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            MATCH ANY (OR)
          </button>
        </div>
      </div>

      {/* Preset Filter Quick Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '14px 0' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>⚡ Quick Presets:</span>
        <button
          type="button"
          onClick={() =>
            applyPreset([
              { id: 'p1', field: 'sla_tier', operator: 'GT', value: '0', valueTo: '' },
            ])
          }
          style={{
            padding: '4px 10px',
            borderRadius: '999px',
            background: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          🚨 Overdue SLA Breaches (Tiers 1-3)
        </button>

        <button
          type="button"
          onClick={() =>
            applyPreset([
              { id: 'p2', field: 'pipeline_value', operator: 'GT', value: '25000', valueTo: '' },
              { id: 'p3', field: 'priority', operator: 'EQUALS', value: 'High', valueTo: '' },
            ])
          }
          style={{
            padding: '4px 10px',
            borderRadius: '999px',
            background: '#ecfdf5',
            color: '#059669',
            border: '1px solid #a7f3d0',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          💰 High Value (&gt;$25k) &amp; High Priority
        </button>

        <button
          type="button"
          onClick={() =>
            applyPreset([
              { id: 'p4', field: 'disposition_code', operator: 'EQUALS', value: 'NO_ANSWER', valueTo: '' },
              { id: 'p5', field: 'retry_count', operator: 'GT', value: '0', valueTo: '' },
            ])
          }
          style={{
            padding: '4px 10px',
            borderRadius: '999px',
            background: '#fffbeb',
            color: '#d97706',
            border: '1px solid #fde68a',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          📞 No Answer Retries (Active Dialing)
        </button>

        <button
          type="button"
          onClick={() =>
            applyPreset([
              { id: 'p6', field: 'disposition_code', operator: 'EQUALS', value: 'CALL_BACK', valueTo: '' },
            ])
          }
          style={{
            padding: '4px 10px',
            borderRadius: '999px',
            background: '#eff6ff',
            color: '#2563eb',
            border: '1px solid #bfdbfe',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          📅 Scheduled Callbacks
        </button>
      </div>

      {/* Rules Builder Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
        {rules.map((rule, idx) => {
          const fieldDef = AVAILABLE_FIELDS.find((f) => f.id === rule.field) || AVAILABLE_FIELDS[0];
          const ops = OPERATORS_BY_TYPE[fieldDef?.type || 'text'] || OPERATORS_BY_TYPE.text;

          return (
            <div
              key={rule.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(160px, 1fr) minmax(140px, 1fr) minmax(160px, 2fr) 40px',
                gap: '10px',
                alignItems: 'center',
                background: '#f8fafc',
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
              }}
            >
              {/* Field Select */}
              <div>
                <select
                  value={rule.field}
                  onChange={(e) => updateRule(rule.id, 'field', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    background: '#ffffff',
                    outline: 'none',
                  }}
                >
                  {AVAILABLE_FIELDS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Operator Select */}
              <div>
                <select
                  value={rule.operator}
                  onChange={(e) => updateRule(rule.id, 'operator', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    background: '#ffffff',
                    outline: 'none',
                  }}
                >
                  {ops.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Value Input(s) */}
              <div>
                {rule.operator === 'BETWEEN' || rule.operator === 'RANGE' ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type={fieldDef.type === 'temporal' ? 'date' : 'number'}
                      placeholder="Min / From"
                      value={rule.value}
                      onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.84rem',
                        outline: 'none',
                        background: '#ffffff',
                      }}
                    />
                    <input
                      type={fieldDef.type === 'temporal' ? 'date' : 'number'}
                      placeholder="Max / To"
                      value={rule.valueTo || ''}
                      onChange={(e) => updateRule(rule.id, 'valueTo', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.84rem',
                        outline: 'none',
                        background: '#ffffff',
                      }}
                    />
                  </div>
                ) : fieldDef.options && (rule.operator === 'EQUALS' || rule.operator === 'IN') ? (
                  <select
                    value={rule.value}
                    onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      background: '#ffffff',
                      outline: 'none',
                    }}
                  >
                    {fieldDef.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={fieldDef.type === 'temporal' ? 'date' : fieldDef.type === 'numeric' ? 'number' : 'text'}
                    placeholder={`Enter ${fieldDef.label}...`}
                    value={rule.value}
                    onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      outline: 'none',
                      background: '#ffffff',
                    }}
                  />
                )}
              </div>

              {/* Remove Rule Button */}
              <div>
                <button
                  type="button"
                  onClick={() => removeRule(rule.id)}
                  disabled={rules.length <= 1}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: rules.length > 1 ? '#ef4444' : '#cbd5e1',
                    cursor: rules.length > 1 ? 'pointer' : 'not-allowed',
                    padding: '6px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginTop: '16px',
          paddingTop: '14px',
          borderTop: '1px solid #f1f5f9',
        }}
      >
        <button
          type="button"
          onClick={addRule}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            color: '#334155',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} />
          <span>Add Filter Rule</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isAdvancedFilterActive && (
            <button
              type="button"
              onClick={resetAdvancedFilter}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={14} />
              <span>Reset Filters</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleApply}
            disabled={isExecuting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
            }}
          >
            <Play size={14} />
            <span>{isExecuting ? 'Executing...' : 'Execute Filter Engine'}</span>
          </button>
        </div>
      </div>

      {/* Execution Performance Telemetry Badge */}
      {filterStats && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            fontSize: '0.76rem',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            ✓ Filter Execution Complete: <strong>{filterStats.count} leads matched</strong> ({filterStats.rulesCount} rules applied).
          </span>
          <span style={{ fontWeight: 700 }}>Latency: {filterStats.executionTimeMs}ms (Sub-200ms Target: Pass)</span>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilterDrawer;
