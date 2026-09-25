import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';

export const MetricCard = ({ title, value, subtitle, icon: Icon, color, bgLight, onClick, isClickable = true }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="metric-card interactive curve-mode-card"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: isClickable ? 'pointer' : 'default',
        padding: '20px 22px',
        background: '#ffffff',
        border: `1.5px solid ${isHovered ? (color || '#2563eb') : 'var(--border-color)'}`,
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: isHovered
          ? `0 12px 28px -4px ${color ? `${color}25` : 'rgba(37, 99, 235, 0.15)'}, 0 4px 10px -2px rgba(0, 0, 0, 0.04)`
          : '0 2px 8px rgba(0, 0, 0, 0.04)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.24s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative',
        userSelect: 'none',
        minHeight: '108px',
        overflow: 'hidden',
      }}
      title={isClickable ? `Click to inspect all ${title.toLowerCase()} details` : undefined}
    >
      {/* Curved decorative background glow */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: bgLight || 'rgba(59, 130, 246, 0.08)',
          opacity: isHovered ? 0.9 : 0.35,
          transition: 'all 0.3s ease',
          pointerEvents: 'none',
        }}
      />

      <div
        className="stat-icon-wrapper"
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: bgLight || 'rgba(59, 130, 246, 0.12)',
          color: color || '#2563eb',
          flexShrink: 0,
          transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isHovered ? 'scale(1.1) rotate(2deg)' : 'scale(1)',
          boxShadow: isHovered ? `0 4px 12px ${color ? `${color}35` : 'rgba(37, 99, 235, 0.2)'}` : 'none',
        }}
      >
        <Icon size={24} />
      </div>

      <div className="stat-info" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            {title}
          </span>
          {isClickable && (
            <span
              style={{
                fontSize: '0.7rem',
                color: color || '#2563eb',
                background: bgLight || 'rgba(37, 99, 235, 0.1)',
                padding: '3px 8px',
                borderRadius: '999px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                opacity: isHovered ? 1 : 0.85,
                transition: 'all 0.2s',
                border: `1px solid ${isHovered ? (color ? `${color}40` : '#bfdbfe') : 'transparent'}`,
              }}
            >
              <span>View</span>
              <ExternalLink size={10} />
            </span>
          )}
        </div>

        <div
          style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
            marginBottom: '3px',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {value}
        </div>

        {subtitle && (
          <span
            style={{
              fontSize: '0.74rem',
              color: '#64748b',
              display: 'block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
