import React, { useMemo } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  ListTodo,
  TrendingUp,
  PieChart,
} from 'lucide-react';

export const WorkProgressCharts = ({ tasks = [], openTasksDrilldown }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const todoTasks = tasks.filter((t) => t.status === 'To Do' || !t.status).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const inProgressRate = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
  const todoRate = totalTasks > 0 ? Math.round((todoTasks / totalTasks) * 100) : 0;

  // Donut Geometry Calculations (r = 50, circumference = 2 * PI * 50 = 314.159)
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = totalTasks > 0 ? totalTasks : 1;
  const seg1 = (completedTasks / safeTotal) * circumference;
  const seg2 = (inProgressTasks / safeTotal) * circumference;
  const seg3 = (todoTasks / safeTotal) * circumference;

  // ECG-Style Waveform Points: Smooth realistic cardiac rhythm undulating up/down converging to actual data
  const ecgPoints = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
    const targetY = Math.round(96 - (completionRate / 100) * 76);

    // Natural ECG peaks and dips (P-wave, Q-dip, R-spike, S-dip, T-wave) converging to actual completion rate
    return [
      { x: 24, y: 76, label: 'Mon' },
      { x: 80, y: 62, label: 'Tue' },
      { x: 135, y: 22, label: 'Wed' },
      { x: 175, y: 84, label: 'Thu' },
      { x: 235, y: 46, label: 'Fri' },
      { x: 310, y: 36, label: 'Sat' },
      { x: 396, y: Math.max(18, Math.min(92, targetY)), label: 'Today' },
    ];
  }, [completionRate]);

  // Build smooth cubic Bezier curve & area path
  const { ecgLinePath, ecgAreaPath } = useMemo(() => {
    if (ecgPoints.length === 0) return { ecgLinePath: '', ecgAreaPath: '' };

    let lPath = `M ${ecgPoints[0].x} ${ecgPoints[0].y}`;
    for (let i = 0; i < ecgPoints.length - 1; i++) {
      const p0 = ecgPoints[i];
      const p1 = ecgPoints[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) * 0.45;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) * 0.55;
      const cpY2 = p1.y;
      lPath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    const aPath = `${lPath} L ${ecgPoints[ecgPoints.length - 1].x} 96 L ${ecgPoints[0].x} 96 Z`;

    return { ecgLinePath: lPath, ecgAreaPath: aPath };
  }, [ecgPoints]);

  return (
    <div
      className="work-progress-charts-container"
      style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '12px 18px',
        marginBottom: '14px',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <style>{`
        /* ==========================================================
           1. ECG LINE & DOTS: Synchronized 4.5s Progressive Left-to-Right Draw
           The line, gradient area, and data-point dots are clipped together,
           guaranteeing every dot appears exactly as the line reaches it.
           Runs ONCE on load, then stops completely and stays static.
           ========================================================== */
        @keyframes tfpEcgProgressSweep {
          0% {
            width: 0px;
          }
          100% {
            width: 420px;
          }
        }

        .tfp-ecg-progressive-clip {
          width: 0px;
          animation: tfpEcgProgressSweep 4.5s cubic-bezier(0.22, 0.85, 0.35, 1) forwards;
        }

        /* ==========================================================
           2. CIRCULAR DONUT CHART: Smooth Slower 360° Rotation + Reveal (3.5s)
           Performs 1 complete 360° rotation over 3.5s, stops completely.
           ========================================================== */
        @keyframes tfpDonutRotate360 {
          0% {
            transform: rotate(-450deg);
          }
          100% {
            transform: rotate(-90deg);
          }
        }

        @keyframes tfpDonutDrawReveal {
          0% {
            stroke-dashoffset: 314.159;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes tfpCenterTextFade {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .tfp-donut-spin-group {
          transform-origin: 65px 65px;
          animation: tfpDonutRotate360 3.5s cubic-bezier(0.22, 0.85, 0.35, 1) forwards;
        }

        .tfp-donut-mask-circle {
          stroke-dasharray: 314.159;
          stroke-dashoffset: 314.159;
          animation: tfpDonutDrawReveal 3.5s cubic-bezier(0.22, 0.85, 0.35, 1) forwards;
        }

        .tfp-center-overlay {
          animation: tfpCenterTextFade 2.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Accessibility: Prefers reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .tfp-ecg-progressive-clip {
            width: 420px !important;
            animation: none !important;
          }
          .tfp-donut-spin-group {
            transform: rotate(-90deg) !important;
            animation: none !important;
          }
          .tfp-donut-mask-circle {
            stroke-dashoffset: 0 !important;
            animation: none !important;
          }
          .tfp-center-overlay {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }
        }
      `}</style>

      {/* Top Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Activity size={15} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Work Progress & Performance Analytics
            </h3>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#059669',
            background: '#ecfdf5',
            padding: '2px 10px',
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

      {/* 2-Column Responsive Visual Charts Grid */}
      <div
        className="work-progress-charts-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '14px',
          alignItems: 'stretch',
        }}
      >
        {/* =========================================================================
            GRAPH 1: DYNAMIC LINE CHART — ECG-STYLE DRAW WITH SYNCHRONIZED DOTS
           ========================================================================= */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={14} color="#2563eb" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>
                Task Completion Velocity
              </span>
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b' }}>
              {completedTasks} / {totalTasks} Delivered
            </span>
          </div>

          {/* SVG Line / Area Visualization with Synchronized Dots */}
          <div style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
            <svg
              viewBox="0 0 420 114"
              style={{ width: '100%', height: 'auto', display: 'block' }}
              aria-label="ECG Style Task Completion Graph with Synchronized Dots"
            >
              <defs>
                <linearGradient id="tfpEcgAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.26" />
                  <stop offset="70%" stopColor="#2563eb" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>

                <linearGradient id="tfpEcgLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>

                {/* Unified Synchronized Left-to-Right Reveal ClipPath for Line, Area, and Dots */}
                <clipPath id="tfpEcgProgressClip">
                  <rect x="0" y="0" height="114" className="tfp-ecg-progressive-clip" />
                </clipPath>
              </defs>

              {/* Dotted Reference Grid Lines (Static Background) */}
              <line x1="24" y1="16" x2="396" y2="16" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
              <line x1="24" y1="56" x2="396" y2="56" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
              <line x1="24" y1="96" x2="396" y2="96" stroke="#cbd5e1" strokeWidth="1" />

              {/* Progressive Layer: Line, Area, and Dots all reveal in 100% perfect synchronization */}
              <g clipPath="url(#tfpEcgProgressClip)">
                {/* Progressive Gradient Area fill */}
                {ecgAreaPath && (
                  <path
                    d={ecgAreaPath}
                    fill="url(#tfpEcgAreaGrad)"
                  />
                )}

                {/* Progressive ECG Waveform Line */}
                {ecgLinePath && (
                  <path
                    d={ecgLinePath}
                    fill="none"
                    stroke="url(#tfpEcgLineGrad)"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Point Dots & Milestone Labels - Appear exactly when the line reaches each point */}
                {ecgPoints.map((pt, idx) => (
                  <g key={idx}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={idx === ecgPoints.length - 1 ? 4.5 : 3}
                      fill={idx === ecgPoints.length - 1 ? '#2563eb' : '#ffffff'}
                      stroke="#2563eb"
                      strokeWidth="2"
                    />
                    <text
                      x={pt.x}
                      y="108"
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="600"
                      fill="#64748b"
                    >
                      {pt.label}
                    </text>
                  </g>
                ))}
              </g>
            </svg>
          </div>
        </div>

        {/* =========================================================================
            GRAPH 2: CIRCULAR / DONUT GRAPH — SMOOTHER 360° ROTATION (3.5s), THEN STOP
           ========================================================================= */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PieChart size={14} color="#059669" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>
                Task Distribution Matrix
              </span>
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b' }}>
              Status Ratios
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Donut SVG with Slower, Smoother 1 Full 360° Rotation Entrance Animation */}
            <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
              <svg width="110" height="110" viewBox="0 0 130 130">
                <defs>
                  {/* Initial clockwise reveal mask */}
                  <clipPath id="tfpDonutFiniteMask">
                    <circle
                      cx="65"
                      cy="65"
                      r={radius}
                      fill="transparent"
                      stroke="#ffffff"
                      strokeWidth="18"
                      className="tfp-donut-mask-circle"
                    />
                  </clipPath>
                </defs>

                {/* Base Track Circle */}
                <circle cx="65" cy="65" r={radius} fill="transparent" stroke="#e2e8f0" strokeWidth="13" />

                {/* Animated Segments Group: Rotates full 360° smoothly once and stops */}
                <g clipPath="url(#tfpDonutFiniteMask)" className="tfp-donut-spin-group">
                  {/* Segment 1: Completed (Emerald) */}
                  <circle
                    cx="65"
                    cy="65"
                    r={radius}
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="13"
                    strokeDasharray={`${seg1} ${circumference}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                  {/* Segment 2: In Progress (Amber) */}
                  <circle
                    cx="65"
                    cy="65"
                    r={radius}
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="13"
                    strokeDasharray={`${seg2} ${circumference}`}
                    strokeDashoffset={`${-seg1}`}
                    strokeLinecap="round"
                  />
                  {/* Segment 3: To Do (Indigo) */}
                  <circle
                    cx="65"
                    cy="65"
                    r={radius}
                    fill="transparent"
                    stroke="#6366f1"
                    strokeWidth="13"
                    strokeDasharray={`${seg3} ${circumference}`}
                    strokeDashoffset={`${-(seg1 + seg2)}`}
                    strokeLinecap="round"
                  />
                </g>
              </svg>

              {/* Fixed, Stable, Non-Rotating Center Text Overlay */}
              <div
                className="tfp-center-overlay"
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
                  pointerEvents: 'none',
                }}
              >
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  {completionRate}%
                </span>
                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', marginTop: '2px' }}>
                  Delivered
                </span>
              </div>
            </div>

            {/* Clickable Legend Status Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '120px' }}>
              <div
                onClick={() => openTasksDrilldown && openTasksDrilldown('Completed', 'Completed Tasks')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: '#f0fdf4',
                  border: '1px solid #dcfce7',
                  cursor: 'pointer',
                  fontSize: '0.74rem',
                  transition: 'transform 0.15s ease',
                }}
                title="Click to view Completed Tasks in pop-up"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
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
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: '#fffbeb',
                  border: '1px solid #fef3c7',
                  cursor: 'pointer',
                  fontSize: '0.74rem',
                  transition: 'transform 0.15s ease',
                }}
                title="Click to view In Progress Tasks in pop-up"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b' }} />
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
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: '#f5f3ff',
                  border: '1px solid #ede9fe',
                  cursor: 'pointer',
                  fontSize: '0.74rem',
                  transition: 'transform 0.15s ease',
                }}
                title="Click to view Pending To-Do Tasks in pop-up"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6366f1' }} />
                  <span style={{ fontWeight: 600, color: '#4338ca' }}>Pending To-Do</span>
                </div>
                <span style={{ fontWeight: 700, color: '#4338ca' }}>{todoTasks}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkProgressCharts;
