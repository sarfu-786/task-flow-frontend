import React from 'react';
import { ExternalLink } from 'lucide-react';

export const MetricCard = ({ title, value, subtitle, icon: Icon, color, bgLight, onClick, isClickable = true }) => {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      title={isClickable ? `Click to inspect all ${title.toLowerCase()} details` : undefined}
    >
      <div
        className="stat-icon-wrapper"
        style={{
          background: bgLight || 'rgba(59, 130, 246, 0.15)',
          color: color || '#3b82f6',
        }}
      >
        <Icon size={24} />
      </div>
      <div className="stat-info" style={{ flex: 1 }}>
        <span className="stat-value">{value}</span>
        <span className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{title}</span>
          {isClickable && (
            <span
              style={{
                fontSize: '0.7rem',
                color: color || '#60a5fa',
                background: bgLight || 'rgba(59, 130, 246, 0.12)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <span>Open</span>
              <ExternalLink size={10} />
            </span>
          )}
        </span>
        {subtitle && (
          <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
