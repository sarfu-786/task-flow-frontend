import React from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  ListTodo,
  TrendingUp,
} from 'lucide-react';

export const WorkProgressCharts = ({ tasks = [], openTasksDrilldown }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const todoTasks = tasks.filter((t) => t.status === 'To Do' || !t.status).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const inProgressRate = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
  const todoRate = totalTasks > 0 ? Math.round((todoTasks / totalTasks) * 100) : 0;

  // Task Priority
  const urgentCount = tasks.filter((t) => t.priority === 'Urgent').length;
  const highCount = tasks.filter((t) => t.priority === 'High').length;
  const mediumCount = tasks.filter((t) => t.priority === 'Medium').length;
  const lowCount = tasks.filter((t) => t.priority === 'Low' || !t.priority).length;

  // Task Categories
  const typeCounts = {
    'Internet Work': tasks.filter((t) => t.type === 'Internet Work').length,
    'Documentation': tasks.filter((t) => t.type === 'Documentation').length,
    'Social Media': tasks.filter((t) => t.type === 'Social Media').length,
    'Backend Work': tasks.filter((t) => t.type === 'Backend Work').length,
  };

  // SVG Donut Calculations
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const seg1 = (completedTasks / (totalTasks || 1)) * circumference;
  const seg2 = (inProgressTasks / (totalTasks || 1)) * circumference;
  const seg3 = (todoTasks / (totalTasks || 1)) * circumference;

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: '14px',
        padding: '20px 24px',
        marginBottom: '22px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Activity size={16} />
          </div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Work Progress & Activity Breakdown
          </h4>
        </div>

        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#059669',
            background: '#ecfdf5',
            padding: '2px 8px',
            borderRadius: '999px',
            border: '1px solid #a7f3d0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <TrendingUp size={12} /> {completionRate}% Overall Delivered
        </span>
      </div>

      {/* 2-Column Clean Visual Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          alignItems: 'center',
        }}
      >
        {/* Left: Mini Donut & Direct Status Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke="#10b981"
                strokeWidth="12"
                strokeDasharray={`${seg1} ${circumference}`}
                strokeDashoffset="0"
                strokeLinecap="round"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke="#f59e0b"
                strokeWidth="12"
                strokeDasharray={`${seg2} ${circumference}`}
                strokeDashoffset={`${-seg1}`}
                strokeLinecap="round"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke="#94a3b8"
                strokeWidth="12"
                strokeDasharray={`${seg3} ${circumference}`}
                strokeDashoffset={`${-(seg1 + seg2)}`}
                strokeLinecap="round"
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                {completionRate}%
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', marginTop: '2px' }}>
                Done
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            <div
              onClick={() => openTasksDrilldown && openTasksDrilldown('Completed', 'Completed Tasks')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 10px',
                borderRadius: '6px',
                background: '#f0fdf4',
                border: '1px solid #dcfce7',
                cursor: 'pointer',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontWeight: 600, color: '#166534' }}>Completed</span>
              </div>
              <span style={{ fontWeight: 700, color: '#166534' }}>{completedTasks}</span>
            </div>

            <div
              onClick={() => openTasksDrilldown && openTasksDrilldown('In Progress', 'In Progress Tasks')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 10px',
                borderRadius: '6px',
                background: '#fffbeb',
                border: '1px solid #fef3c7',
                cursor: 'pointer',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ fontWeight: 600, color: '#92400e' }}>In Progress</span>
              </div>
              <span style={{ fontWeight: 700, color: '#92400e' }}>{inProgressTasks}</span>
            </div>

            <div
              onClick={() => openTasksDrilldown && openTasksDrilldown('To Do', 'To Do Tasks')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 10px',
                borderRadius: '6px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }} />
                <span style={{ fontWeight: 600, color: '#475569' }}>To Do</span>
              </div>
              <span style={{ fontWeight: 700, color: '#475569' }}>{todoTasks}</span>
            </div>
          </div>
        </div>

        {/* Right: Work Domains Category Grid */}
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Work Distribution by Domain
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <div style={{ padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600 }}>Internet Work</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{typeCounts['Internet Work']}</span>
              </div>
            </div>

            <div style={{ padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>Documentation</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{typeCounts['Documentation']}</span>
              </div>
            </div>

            <div style={{ padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600 }}>Social Media</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{typeCounts['Social Media']}</span>
              </div>
            </div>

            <div style={{ padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 600 }}>Backend Work</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{typeCounts['Backend Work']}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
