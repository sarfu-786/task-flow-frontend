import React, { useState, useMemo } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useUserManagement } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CheckCircle2,
  Clock,
  ListTodo,
  Users,
  ShieldCheck,
  PlusCircle,
  Activity,
  ArrowRight,
  Filter,
  Sparkles,
  Layers,
  ChevronRight,
  UserCheck,
  Bell,
  Eye,
  Zap,
  Grid,
  Network,
  Share2,
  FolderKanban,
  CheckCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export const TaskTreeDashboard = ({
  setActiveSection,
  onOpenEmployeeDrilldown,
  onOpenTasksDrilldown,
  onOpenUserWork,
  onOpenApprovals,
}) => {
  const { tasks, openTaskModal, setIsInboxOpen, unreadCount } = useTasks();
  const { users, approvals, pendingApprovalsCount } = useUserManagement();
  const { user: currentUser } = useAuth();

  // View Mode: 'tree' | 'grid'
  const [viewMode, setViewMode] = useState('tree');
  // Selected Node for Deep Inspector Panel
  const [selectedNodeId, setSelectedNodeId] = useState('A');
  // Tier Filter: 'all' | 'root' | 'inner' | 'leaf'
  const [tierFilter, setTierFilter] = useState('all');
  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Live Metric Computations
  const activeEmployees = useMemo(() => {
    return users.filter(
      (u) =>
        u.status !== 'Rejected' &&
        u.status !== 'Pending' &&
        (u.role === 'User' || (!u.role && u.role !== 'Manager' && u.role !== 'Executive'))
    );
  }, [users]);

  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasksCount = tasks.filter((t) => t.status === 'In Progress').length;
  const pendingTasksCount = tasks.filter((t) => t.status === 'To Do').length;
  const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Department Distribution
  const departments = useMemo(() => {
    const map = {};
    activeEmployees.forEach((emp) => {
      const d = emp.department || 'Operations';
      map[d] = (map[d] || 0) + 1;
    });
    return map;
  }, [activeEmployees]);

  // Tree Nodes Definition matching diagram exactly
  const nodes = useMemo(() => {
    return [
      {
        id: 'A',
        name: 'Executive Task Command Hub',
        shortName: 'Root Dashboard',
        type: 'Root',
        tier: 'root',
        badgeColor: '#2563eb',
        badgeBg: '#eff6ff',
        borderColor: '#93c5fd',
        glowColor: 'rgba(37, 99, 235, 0.25)',
        icon: LayoutDashboard,
        category: 'Root Node (Blue)',
        description: 'Central task operations command unit, orchestrating organizational workflows, health KPIs, and executive oversight.',
        metrics: [
          { label: 'Total Tasks', value: totalTasksCount, color: '#2563eb' },
          { label: 'Completion Rate', value: `${completionRate}%`, color: '#059669' },
          { label: 'Workforce', value: activeEmployees.length, color: '#0284c7' },
        ],
        children: ['B', 'C'],
        parent: null,
        primaryActionLabel: 'Executive Overview',
        onPrimaryAction: () => setSelectedNodeId('A'),
        pos: { x: 450, y: 50 },
      },
      {
        id: 'B',
        name: 'Task Operations & Workflows',
        shortName: 'Task Engine',
        type: 'Inner',
        tier: 'inner',
        badgeColor: '#ea580c',
        badgeBg: '#fff7ed',
        borderColor: '#fed7aa',
        glowColor: 'rgba(234, 88, 12, 0.22)',
        icon: FolderKanban,
        category: 'Inner Node (Orange)',
        description: 'Operational pipeline controlling active tasks, deadline tracking, priorities, and workflow execution states.',
        metrics: [
          { label: 'In Progress', value: inProgressTasksCount, color: '#d97706' },
          { label: 'Pending To-Do', value: pendingTasksCount, color: '#6366f1' },
          { label: 'Completed', value: completedTasksCount, color: '#059669' },
        ],
        children: ['E', 'D'],
        parent: 'A',
        primaryActionLabel: 'Explore Pipeline',
        onPrimaryAction: () => {
          if (onOpenTasksDrilldown) {
            onOpenTasksDrilldown('all', 'All Operational Tasks');
          } else if (setActiveSection) {
            setActiveSection('tasks');
          }
        },
        pos: { x: 230, y: 220 },
      },
      {
        id: 'C',
        name: 'Workforce & Capacity Intelligence',
        shortName: 'Workforce Hub',
        type: 'Inner',
        tier: 'inner',
        badgeColor: '#ea580c',
        badgeBg: '#fff7ed',
        borderColor: '#fed7aa',
        glowColor: 'rgba(234, 88, 12, 0.22)',
        icon: Users,
        category: 'Inner Node (Orange)',
        description: 'Resource allocation matrix monitoring team capacity, department distribution, and member assignment loads.',
        metrics: [
          { label: 'Active Staff', value: activeEmployees.length, color: '#0284c7' },
          { label: 'Departments', value: Object.keys(departments).length, color: '#d97706' },
        ],
        children: ['F'],
        parent: 'A',
        primaryActionLabel: 'View Workforce',
        onPrimaryAction: () => {
          if (onOpenEmployeeDrilldown) {
            onOpenEmployeeDrilldown('all', 'Workforce Directory');
          } else if (setActiveSection) {
            setActiveSection('users');
          }
        },
        pos: { x: 670, y: 220 },
      },
      {
        id: 'E',
        name: 'Task Creator & Dispatcher',
        shortName: 'Create Task',
        type: 'Leaf',
        tier: 'leaf',
        badgeColor: '#7c3aed',
        badgeBg: '#f5f3ff',
        borderColor: '#ddd6fe',
        glowColor: 'rgba(124, 58, 237, 0.22)',
        icon: PlusCircle,
        category: 'Leaf Node (Purple)',
        description: 'Feature tool to create new task specifications, assign designated owners, set completion deadlines, and specify priority levels.',
        metrics: [
          { label: '1-Click Create', value: 'Instant', color: '#7c3aed' },
          { label: 'Auto Notify', value: 'Live', color: '#059669' },
        ],
        children: [],
        parent: 'B',
        primaryActionLabel: '+ Create New Task',
        isActionHighlight: true,
        onPrimaryAction: () => {
          if (openTaskModal) {
            openTaskModal('create');
          }
        },
        pos: { x: 120, y: 400 },
      },
      {
        id: 'D',
        name: 'Status Progression & Worklogs',
        shortName: 'Status Pipeline',
        type: 'Leaf',
        tier: 'leaf',
        badgeColor: '#7c3aed',
        badgeBg: '#f5f3ff',
        borderColor: '#ddd6fe',
        glowColor: 'rgba(124, 58, 237, 0.22)',
        icon: Activity,
        category: 'Leaf Node (Purple)',
        description: 'Granular status transition inspector tracking workflow progress from To-Do to In-Progress to Completed with employee remarks.',
        metrics: [
          { label: 'In Progress', value: inProgressTasksCount, color: '#d97706' },
          { label: 'Pending', value: pendingTasksCount, color: '#6366f1' },
        ],
        children: [],
        parent: 'B',
        primaryActionLabel: 'Inspect Worklogs',
        onPrimaryAction: () => {
          if (onOpenTasksDrilldown) {
            onOpenTasksDrilldown('In Progress', 'In-Progress Worklogs');
          }
        },
        pos: { x: 340, y: 400 },
      },
      {
        id: 'F',
        name: 'Governance & Activity Hub',
        shortName: 'Governance',
        type: 'Inner',
        tier: 'inner',
        badgeColor: '#ea580c',
        badgeBg: '#fff7ed',
        borderColor: '#fed7aa',
        glowColor: 'rgba(234, 88, 12, 0.22)',
        icon: Bell,
        category: 'Inner Node (Orange)',
        description: 'Supervisory communication node centralizing executive alerts, pending access approvals, and system audit logs.',
        metrics: [
          { label: 'Pending Approvals', value: pendingApprovalsCount || 0, color: '#dc2626' },
          { label: 'Unread Alerts', value: unreadCount || 0, color: '#ea580c' },
        ],
        children: ['G'],
        parent: 'C',
        primaryActionLabel: 'Open Inbox',
        onPrimaryAction: () => {
          if (setIsInboxOpen) {
            setIsInboxOpen(true);
          }
        },
        pos: { x: 670, y: 400 },
      },
      {
        id: 'G',
        name: 'Registration Gatekeeper',
        shortName: 'User Approvals',
        type: 'Leaf',
        tier: 'leaf',
        badgeColor: '#7c3aed',
        badgeBg: '#f5f3ff',
        borderColor: '#ddd6fe',
        glowColor: 'rgba(124, 58, 237, 0.22)',
        icon: UserCheck,
        category: 'Leaf Node (Purple)',
        description: 'Access security gateway to review, approve, or decline incoming employee account registration requests.',
        metrics: [
          { label: 'Awaiting Review', value: pendingApprovalsCount || 0, color: '#dc2626' },
          { label: 'Gate Status', value: 'Active', color: '#059669' },
        ],
        children: [],
        parent: 'F',
        primaryActionLabel: 'Review Approvals',
        isActionHighlight: (pendingApprovalsCount || 0) > 0,
        onPrimaryAction: () => {
          if (onOpenApprovals) {
            onOpenApprovals();
          } else if (setActiveSection) {
            setActiveSection('approvals');
          }
        },
        pos: { x: 670, y: 580 },
      },
    ];
  }, [
    totalTasksCount,
    completedTasksCount,
    inProgressTasksCount,
    pendingTasksCount,
    completionRate,
    activeEmployees,
    departments,
    pendingApprovalsCount,
    unreadCount,
    onOpenTasksDrilldown,
    onOpenEmployeeDrilldown,
    onOpenApprovals,
    openTaskModal,
    setIsInboxOpen,
    setActiveSection,
  ]);

  // Filtered nodes based on Tier filter & Search
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchTier = tierFilter === 'all' || node.tier === tierFilter;
      const matchSearch =
        !searchQuery ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.id.toLowerCase() === searchQuery.toLowerCase();
      return matchTier && matchSearch;
    });
  }, [nodes, tierFilter, searchQuery]);

  const activeSelectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || nodes[0];
  }, [nodes, selectedNodeId]);

  return (
    <div className="task-tree-dashboard-root" style={{ marginBottom: '32px' }}>
      {/* Dashboard Section Title & Action Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)',
            }}
          >
            <Network size={22} />
          </div>
          <div>
            <h3
              style={{
                fontSize: '1.3rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Task Management System Hierarchy</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '20px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                }}
              >
                Tree Architecture
              </span>
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Hierarchical mapping: Root Hub (A) ➔ Functional Modules (B, C, F) ➔ Action Tools (E, D, G)
            </p>
          </div>
        </div>

        {/* Action Controls: Tier Filters + View Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Quick Filter Buttons */}
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
            }}
          >
            {[
              { id: 'all', label: 'All Nodes' },
              { id: 'root', label: 'Root (Blue)' },
              { id: 'inner', label: 'Inner (Orange)' },
              { id: 'leaf', label: 'Leaf (Purple)' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTierFilter(t.id)}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.76rem',
                  fontWeight: tierFilter === t.id ? 700 : 500,
                  borderRadius: '7px',
                  border: 'none',
                  background: tierFilter === t.id ? '#ffffff' : 'transparent',
                  color: tierFilter === t.id ? '#0f172a' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: tierFilter === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Tree Graph vs Grid */}
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                borderRadius: '7px',
                border: 'none',
                background: viewMode === 'tree' ? '#2563eb' : 'transparent',
                color: viewMode === 'tree' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              <Network size={14} />
              <span>Tree Graph</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                borderRadius: '7px',
                border: 'none',
                background: viewMode === 'grid' ? '#2563eb' : 'transparent',
                color: viewMode === 'grid' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              <Grid size={14} />
              <span>Matrix Grid</span>
            </button>
          </div>

          {/* Quick Create Task Trigger */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openTaskModal('create')}
            style={{
              padding: '7px 16px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '10px',
            }}
          >
            <PlusCircle size={15} />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Main Hierarchy Content Area */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Visual Tree Canvas or Grid View */}
        <div
          className="card"
          style={{
            padding: '24px',
            borderRadius: '18px',
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {viewMode === 'tree' ? (
            /* ============================================================ */
            /* 1. VISUAL SVG TREE GRAPH MODE                                */
            /* ============================================================ */
            <div
              className="tree-canvas-wrapper"
              style={{
                position: 'relative',
                minHeight: '720px',
                width: '100%',
                background: 'radial-gradient(circle at center, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '14px',
                border: '1px dashed #cbd5e1',
                padding: '20px',
                overflowX: 'auto',
              }}
            >
              {/* SVG Connectors Background */}
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '900px',
                  height: '720px',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
                viewBox="0 0 900 720"
              >
                <defs>
                  {/* Blue Arrow Marker */}
                  <marker
                    id="arrow-blue"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb" />
                  </marker>
                  {/* Orange Arrow Marker */}
                  <marker
                    id="arrow-orange"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#ea580c" />
                  </marker>
                  {/* Purple Arrow Marker */}
                  <marker
                    id="arrow-purple"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#7c3aed" />
                  </marker>

                  {/* Linear Gradients */}
                  <linearGradient id="grad-a-b" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="grad-a-c" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="grad-b-e" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ea580c" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="grad-b-d" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ea580c" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="grad-c-f" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ea580c" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="grad-f-g" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ea580c" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {/* Connection Lines Matching User Image: A->B, A->C, B->E, B->D, C->F, F->G */}
                {/* A (450, 115) -> B (230, 220) */}
                <path
                  d="M 450 120 C 450 170, 230 160, 230 215"
                  fill="none"
                  stroke="url(#grad-a-b)"
                  strokeWidth="2.5"
                  markerEnd="url(#arrow-orange)"
                />

                {/* A (450, 115) -> C (670, 220) */}
                <path
                  d="M 450 120 C 450 170, 670 160, 670 215"
                  fill="none"
                  stroke="url(#grad-a-c)"
                  strokeWidth="2.5"
                  markerEnd="url(#arrow-orange)"
                />

                {/* B (230, 290) -> E (120, 395) */}
                <path
                  d="M 230 295 C 230 350, 120 340, 120 395"
                  fill="none"
                  stroke="url(#grad-b-e)"
                  strokeWidth="2.5"
                  markerEnd="url(#arrow-purple)"
                />

                {/* B (230, 290) -> D (340, 395) */}
                <path
                  d="M 230 295 C 230 350, 340 340, 340 395"
                  fill="none"
                  stroke="url(#grad-b-d)"
                  strokeWidth="2.5"
                  markerEnd="url(#arrow-purple)"
                />

                {/* C (670, 290) -> F (670, 395) */}
                <path
                  d="M 670 295 L 670 395"
                  fill="none"
                  stroke="url(#grad-c-f)"
                  strokeWidth="2.5"
                  markerEnd="url(#arrow-orange)"
                />

                {/* F (670, 475) -> G (670, 575) */}
                <path
                  d="M 670 475 L 670 575"
                  fill="none"
                  stroke="url(#grad-f-g)"
                  strokeWidth="2.5"
                  markerEnd="url(#arrow-purple)"
                />
              </svg>

              {/* Node Cards Container (Positioned Absolute relative to 900x720 coordinate space) */}
              <div
                style={{
                  position: 'relative',
                  width: '900px',
                  height: '720px',
                  zIndex: 2,
                }}
              >
                {nodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  const IconComp = node.icon;
                  const isHighlighted = tierFilter === 'all' || tierFilter === node.tier;

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      style={{
                        position: 'absolute',
                        left: `${node.pos.x}px`,
                        top: `${node.pos.y}px`,
                        transform: 'translate(-50%, 0)',
                        width: '210px',
                        background: '#ffffff',
                        border: isSelected ? `2.5px solid ${node.badgeColor}` : `1.5px solid ${node.borderColor}`,
                        borderRadius: '16px',
                        padding: '14px 14px 12px',
                        boxShadow: isSelected
                          ? `0 12px 25px -4px ${node.glowColor}, 0 0 0 3px ${node.badgeBg}`
                          : '0 4px 12px rgba(0, 0, 0, 0.04)',
                        cursor: 'pointer',
                        opacity: isHighlighted ? 1 : 0.4,
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        zIndex: isSelected ? 10 : 3,
                      }}
                    >
                      {/* Top Bar: Letter Badge (A..G) + Icon + Type Pill */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {/* Circular Letter Badge (A, B, C, D, E, F, G) */}
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: node.badgeColor,
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              fontSize: '0.95rem',
                              boxShadow: `0 2px 8px ${node.glowColor}`,
                            }}
                          >
                            {node.id}
                          </div>
                          <div>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                color: node.badgeColor,
                              }}
                            >
                              {node.type} Node
                            </span>
                          </div>
                        </div>

                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '8px',
                            background: node.badgeBg,
                            color: node.badgeColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconComp size={15} />
                        </div>
                      </div>

                      {/* Node Title */}
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: '#0f172a',
                          lineHeight: '1.25',
                          marginBottom: '8px',
                        }}
                      >
                        {node.shortName}
                      </div>

                      {/* Micro KPI Badge */}
                      <div
                        style={{
                          display: 'flex',
                          gap: '6px',
                          flexWrap: 'wrap',
                          marginBottom: '10px',
                        }}
                      >
                        {node.metrics.slice(0, 2).map((m, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              padding: '2px 6px',
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              color: '#475569',
                              display: 'flex',
                              gap: '4px',
                            }}
                          >
                            <span>{m.label}:</span>
                            <span style={{ color: m.color, fontWeight: 800 }}>{m.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Node Action Trigger Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNodeId(node.id);
                          if (node.onPrimaryAction) node.onPrimaryAction();
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: node.isActionHighlight ? 'none' : `1px solid ${node.borderColor}`,
                          background: node.isActionHighlight ? node.badgeColor : node.badgeBg,
                          color: node.isActionHighlight ? '#ffffff' : node.badgeColor,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{node.primaryActionLabel}</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* 2. STRUCTURED MATRIX GRID VIEW MODE                          */
            /* ============================================================ */
            <div>
              {['root', 'inner', 'leaf'].map((tierKey) => {
                const tierNodes = filteredNodes.filter((n) => n.tier === tierKey);
                if (tierNodes.length === 0) return null;

                const tierLabels = {
                  root: { title: 'Root Tier (Executive Hub)', color: '#2563eb', bg: '#eff6ff' },
                  inner: { title: 'Inner Tier (Major Functional Modules)', color: '#ea580c', bg: '#fff7ed' },
                  leaf: { title: 'Leaf Tier (Actions & Direct Features)', color: '#7c3aed', bg: '#f5f3ff' },
                };

                return (
                  <div key={tierKey} style={{ marginBottom: '24px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          color: tierLabels[tierKey].color,
                          background: tierLabels[tierKey].bg,
                          padding: '3px 10px',
                          borderRadius: '12px',
                          border: `1px solid ${tierLabels[tierKey].color}33`,
                        }}
                      >
                        {tierLabels[tierKey].title}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '14px',
                      }}
                    >
                      {tierNodes.map((node) => {
                        const isSelected = selectedNodeId === node.id;
                        const IconComp = node.icon;

                        return (
                          <div
                            key={node.id}
                            onClick={() => setSelectedNodeId(node.id)}
                            style={{
                              background: '#ffffff',
                              borderRadius: '14px',
                              padding: '16px',
                              border: isSelected ? `2px solid ${node.badgeColor}` : `1px solid ${node.borderColor}`,
                              boxShadow: isSelected ? `0 8px 20px ${node.glowColor}` : '0 2px 8px rgba(0,0,0,0.03)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: node.badgeColor,
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 900,
                                  fontSize: '0.9rem',
                                }}
                              >
                                {node.id}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                                  {node.name}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: node.badgeColor, fontWeight: 600 }}>
                                  {node.category}
                                </div>
                              </div>
                            </div>

                            <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '12px', lineHeight: '1.4' }}>
                              {node.description}
                            </p>

                            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                              {node.metrics.map((m, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    padding: '3px 8px',
                                    fontSize: '0.7rem',
                                    color: '#475569',
                                    fontWeight: 600,
                                  }}
                                >
                                  <span>{m.label}: </span>
                                  <span style={{ color: m.color, fontWeight: 800 }}>{m.value}</span>
                                </div>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNodeId(node.id);
                                if (node.onPrimaryAction) node.onPrimaryAction();
                              }}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '9px',
                                border: 'none',
                                background: node.badgeColor,
                                color: '#ffffff',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                              }}
                            >
                              <span>{node.primaryActionLabel}</span>
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Node Inspector & Command Drawer */}
        <div
          className="card"
          style={{
            padding: '20px',
            borderRadius: '18px',
            background: '#ffffff',
            border: `1.5px solid ${activeSelectedNode.borderColor}`,
            boxShadow: `0 8px 24px ${activeSelectedNode.glowColor}`,
          }}
        >
          {/* Header of Inspector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              paddingBottom: '16px',
              borderBottom: '1px solid #f1f5f9',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: activeSelectedNode.badgeColor,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.2rem',
                boxShadow: `0 4px 12px ${activeSelectedNode.glowColor}`,
                flexShrink: 0,
              }}
            >
              {activeSelectedNode.id}
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: activeSelectedNode.badgeColor,
                  letterSpacing: '0.04em',
                }}
              >
                {activeSelectedNode.category}
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {activeSelectedNode.name}
              </h4>
            </div>
          </div>

          {/* Detailed Node Description */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
              Functional Scope
            </div>
            <p style={{ fontSize: '0.82rem', color: '#334155', lineHeight: '1.5', margin: 0 }}>
              {activeSelectedNode.description}
            </p>
          </div>

          {/* Node Hierarchy Relation Chain */}
          <div
            style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '12px 14px',
              border: '1px solid #e2e8f0',
              marginBottom: '18px',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
              Hierarchy Relationships
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Parent Hub:</span>
                <span style={{ fontWeight: 700, color: activeSelectedNode.parent ? '#2563eb' : '#059669' }}>
                  {activeSelectedNode.parent ? `Node [${activeSelectedNode.parent}]` : 'None (Root Authority)'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Direct Children:</span>
                <span style={{ fontWeight: 700, color: activeSelectedNode.children.length > 0 ? '#ea580c' : '#7c3aed' }}>
                  {activeSelectedNode.children.length > 0
                    ? activeSelectedNode.children.map((c) => `Node [${c}]`).join(', ')
                    : 'Terminal (Leaf Node)'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Node Analytics / Metrics */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
              Live Operational Metrics
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {activeSelectedNode.metrics.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '10px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: m.color }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 1-Click Action Buttons in Drawer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={activeSelectedNode.onPrimaryAction}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeSelectedNode.badgeColor,
                borderColor: activeSelectedNode.badgeColor,
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: `0 4px 12px ${activeSelectedNode.glowColor}`,
              }}
            >
              <span>{activeSelectedNode.primaryActionLabel}</span>
              <ArrowRight size={15} />
            </button>

            {/* Quick Tree Explorer Jump */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {nodes
                .filter((n) => n.id !== activeSelectedNode.id)
                .slice(0, 4)
                .map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setSelectedNodeId(n.id)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: '7px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#475569',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: n.badgeColor,
                        color: '#fff',
                        fontSize: '0.6rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                      }}
                    >
                      {n.id}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.shortName}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
