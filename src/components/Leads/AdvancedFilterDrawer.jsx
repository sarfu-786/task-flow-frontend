import React from 'react';
import { useLeads } from '../../context/LeadContext';
import { Share2, IndianRupee, Calendar, RotateCcw } from 'lucide-react';

const LEAD_SOURCES = [
  'Website',
  'Justdial',
  'IndiaMART',
  'TradeIndia',
  'Google Search Ads',
  'Facebook / Instagram Ads',
  'LinkedIn',
  'WhatsApp',
  'Referral',
  'Cold Call',
  'Inbound Call',
  'Email Campaign',
  'Event / Expo',
  'Direct Outreach',
  'Walk-In',
  'Partner / Affiliate',
  'Other',
];

export const AdvancedFilterDrawer = () => {
  const {
    sourceFilter,
    setSourceFilter,
    minValueFilter,
    setMinValueFilter,
    dateRangeFilter,
    setDateRangeFilter,
  } = useLeads();

  const hasExtraFilters =
    sourceFilter !== 'all' ||
    Boolean(minValueFilter) ||
    Boolean(dateRangeFilter?.start) ||
    Boolean(dateRangeFilter?.end);

  const resetExtraFilters = () => {
    setSourceFilter('all');
    setMinValueFilter('');
    setDateRangeFilter({ start: '', end: '' });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '10px 14px',
        borderRadius: '10px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
      }}
    >
      {/* 1. Lead Source */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Share2 size={11} color="#2563eb" />
          <span>Lead Source</span>
        </label>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          style={{
            padding: '5px 8px',
            borderRadius: '6px',
            border: sourceFilter !== 'all' ? '1px solid #93c5fd' : '1px solid #cbd5e1',
            backgroundColor: sourceFilter !== 'all' ? '#eff6ff' : '#ffffff',
            color: sourceFilter !== 'all' ? '#1d4ed8' : '#334155',
            fontSize: '0.76rem',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="all">All Sources</option>
          {LEAD_SOURCES.map((src) => (
            <option key={src} value={src}>
              {src}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Minimum Deal Value (₹) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <IndianRupee size={11} color="#059669" />
          <span>Min Deal Value (₹)</span>
        </label>
        <select
          value={minValueFilter}
          onChange={(e) => setMinValueFilter(e.target.value)}
          style={{
            padding: '5px 8px',
            borderRadius: '6px',
            border: minValueFilter ? '1px solid #93c5fd' : '1px solid #cbd5e1',
            backgroundColor: minValueFilter ? '#eff6ff' : '#ffffff',
            color: minValueFilter ? '#1d4ed8' : '#334155',
            fontSize: '0.76rem',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="">Any Value</option>
          <option value="10000">₹10,000+</option>
          <option value="50000">₹50,000+</option>
          <option value="100000">₹1,00,000+ (1L)</option>
          <option value="500000">₹5,00,000+ (5L)</option>
          <option value="1000000">₹10,00,000+ (10L)</option>
        </select>
      </div>

      {/* 3. Created From Date */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Calendar size={11} color="#2563eb" />
          <span>From Date</span>
        </label>
        <input
          type="date"
          value={dateRangeFilter?.start || ''}
          onChange={(e) =>
            setDateRangeFilter((prev) => ({ ...(prev || {}), start: e.target.value }))
          }
          style={{
            padding: '4px 8px',
            borderRadius: '6px',
            border: dateRangeFilter?.start ? '1px solid #93c5fd' : '1px solid #cbd5e1',
            backgroundColor: dateRangeFilter?.start ? '#eff6ff' : '#ffffff',
            color: '#334155',
            fontSize: '0.76rem',
            fontWeight: 600,
            outline: 'none',
          }}
        />
      </div>

      {/* 4. Created To Date */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Calendar size={11} color="#2563eb" />
          <span>To Date</span>
        </label>
        <input
          type="date"
          min={dateRangeFilter?.start || undefined}
          value={dateRangeFilter?.end || ''}
          onChange={(e) =>
            setDateRangeFilter((prev) => ({ ...(prev || {}), end: e.target.value }))
          }
          style={{
            padding: '4px 8px',
            borderRadius: '6px',
            border: dateRangeFilter?.end ? '1px solid #93c5fd' : '1px solid #cbd5e1',
            backgroundColor: dateRangeFilter?.end ? '#eff6ff' : '#ffffff',
            color: '#334155',
            fontSize: '0.76rem',
            fontWeight: 600,
            outline: 'none',
          }}
        />
      </div>

      {/* Reset Extra Filters */}
      {hasExtraFilters && (
        <button
          type="button"
          onClick={resetExtraFilters}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid #fecaca',
            background: '#fef2f2',
            color: '#dc2626',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={11} />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
};

export default AdvancedFilterDrawer;
