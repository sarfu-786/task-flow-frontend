import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { useUserManagement } from '../../context/UserContext';
import { hierarchyApi } from '../../services/api';
import {
  Network,
  Users,
  CheckCircle2,
  Clock,
  ListTodo,
  Crown,
  Shield,
  Briefcase,
  ChevronDown,
  ChevronRight,
  X,
  Mail,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronUp,
  UserCheck,
  Building,
  Sparkles,
  Plus,
} from 'lucide-react';

// Fallback dynamic tree builder from client-side state
const buildClientHierarchy = (userList, taskList, rootUserOverride = null) => {
  if (!userList || userList.length === 0) return null;
  const activeUsers = userList.filter((u) => u.status !== 'Rejected' && u.status !== 'Pending');
  if (activeUsers.length === 0) return null;

  let root = null;
  if (rootUserOverride) {
    const rId = rootUserOverride._id ? rootUserOverride._id.toString() : rootUserOverride.id;
    root = activeUsers.find((u) => u._id && u._id.toString() === rId);
  }

  if (!root) {
    // Find root node: Super Admin or user with null reportsTo
    root = activeUsers.find((u) => u.role === 'Super Admin' && (!u.reportsTo || u.reportsTo === 'null'));
    if (!root) root = activeUsers.find((u) => u.role === 'Super Admin');
    if (!root) root = activeUsers.find((u) => !u.reportsTo || u.reportsTo === 'null');
    if (!root) root = activeUsers[0];
  }

  const buildNode = (u, ancestors = []) => {
    const uId = u._id ? u._id.toString() : '';
    const uName = (u.name || '').toLowerCase();
    const currentChain = [
      ...ancestors,
      { _id: u._id, name: u.name, role: u.role, title: u.title || u.role, avatar: u.avatar, department: u.department },
    ];

    const directChildren = activeUsers.filter((other) => {
      if (other._id && other._id.toString() === uId) return false;
      const rId = other.reportsTo ? other.reportsTo.toString() : '';
      const rName = (other.reportsToName || '').toLowerCase();
      return rId === uId || (rName && rName === uName);
    });

    const userTasks = (taskList || []).filter((t) => {
      const assigned = (t.assignedTo || '').toLowerCase();
      return assigned === uName || assigned === (u.username || '').toLowerCase();
    });

    const tasksBreakdown = {
      todo: userTasks.filter((t) => t.status === 'To Do' || !t.status).length,
      inProgress: userTasks.filter((t) => t.status === 'In Progress').length,
      completed: userTasks.filter((t) => t.status === 'Completed').length,
    };

    const subNodes = directChildren.map((child) => buildNode(child, currentChain));
    const totalTeamCount = subNodes.reduce((acc, curr) => acc + 1 + (curr.totalTeamCount || 0), 0);

    return {
      _id: u._id,
      name: u.name,
      username: u.username,
      email: u.email,
      role: u.role,
      title: u.title || (u.role === 'Super Admin' ? 'Chief Executive Officer' : u.role === 'Manager' ? 'Operations Manager' : 'Team Member'),
      department: u.department || 'Operations',
      avatar: u.avatar || null,
      reportsTo: u.reportsTo || null,
      reportsToName: u.reportsToName || (ancestors.length > 0 ? ancestors[ancestors.length - 1].name : null),
      reportingChain: currentChain,
      taskCount: userTasks.length,
      tasksBreakdown,
      directReportsCount: directChildren.length,
      totalTeamCount,
      subordinates: subNodes,
    };
  };

  return buildNode(root);
};

export const OrganizationHierarchy = ({ setActiveSection }) => {
  const { user: currentUser } = useAuth();
  const { tasks, openCreateModal: openTaskCreateModal } = useTasks();
  const { users, loading: usersLoading } = useUserManagement();

  const isSuperAdmin = currentUser && currentUser.role === 'Super Admin';

  const [hierarchyData, setHierarchyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Viewport and Tree Refs for auto-fit and drag navigation
  const viewportRef = useRef(null);
  const treeRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Selected node for detailed slide-over inspector drawer
  const [selectedNode, setSelectedNode] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Zoom / scale state for responsive auto-fitting
  const [zoomLevel, setZoomLevel] = useState(1);
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());

  // Auto-fit hierarchy tree to viewport width
  const autoFitToScreen = () => {
    if (!viewportRef.current || !treeRef.current) return;
    const viewportWidth = viewportRef.current.clientWidth - 40;
    const treeWidth = treeRef.current.scrollWidth;
    if (treeWidth > viewportWidth && viewportWidth > 200) {
      const calculated = Number((viewportWidth / treeWidth).toFixed(2));
      const optimalScale = Math.max(0.45, Math.min(1.0, calculated));
      setZoomLevel(optimalScale);
    } else {
      setZoomLevel(1);
    }
  };

  // Fetch dynamic hierarchy from backend with local fallback
  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await hierarchyApi.getOrganizationHierarchy();
      if (data && data.success && data.hierarchy) {
        setHierarchyData(data.hierarchy);
        return;
      }
      throw new Error(data?.message || 'Hierarchy API error');
    } catch (err) {
      console.warn('Hierarchy API response fallback:', err.message);
      if (users && users.length > 0) {
        const localTree = buildClientHierarchy(users, tasks, isSuperAdmin ? null : currentUser);
        if (localTree) {
          setHierarchyData(localTree);
          setError('');
          return;
        }
      }
      setError('Unable to load hierarchy data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, [users, tasks]);

  // Auto-fit on data load and resize
  useEffect(() => {
    if (hierarchyData) {
      const timer = setTimeout(() => {
        autoFitToScreen();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hierarchyData, collapsedNodes]);

  useEffect(() => {
    const handleResize = () => {
      autoFitToScreen();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isDrawerOpen]);

  // Drag to pan handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('.org-node-card') || e.target.closest('button')) return;
    if (!viewportRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.pageX - viewportRef.current.offsetLeft,
      y: e.pageY - viewportRef.current.offsetTop,
      scrollLeft: viewportRef.current.scrollLeft,
      scrollTop: viewportRef.current.scrollTop,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !viewportRef.current) return;
    e.preventDefault();
    const x = e.pageX - viewportRef.current.offsetLeft;
    const y = e.pageY - viewportRef.current.offsetTop;
    const walkX = (x - dragStart.x) * 1.2;
    const walkY = (y - dragStart.y) * 1.2;
    viewportRef.current.scrollLeft = dragStart.scrollLeft - walkX;
    viewportRef.current.scrollTop = dragStart.scrollTop - walkY;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setIsDrawerOpen(true);
  };

  const toggleCollapse = (nodeId, e) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Node Component Recursive Renderer
  const TreeNode = ({ node, isRoot = false }) => {
    if (!node) return null;

    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedNodes.has(node._id);
    const isSelected = selectedNode && selectedNode._id === node._id;

    const isSuperAdmin = node.role === 'Super Admin';
    const isManagerRole = node.role === 'Manager' || node.role === 'Executive' || node.role === 'Administrator';

    // Badge styling
    let roleBadgeColor = '#047857';
    let roleBadgeBg = '#ecfdf5';
    let roleBadgeBorder = '#a7f3d0';

    if (isSuperAdmin) {
      roleBadgeColor = '#b45309';
      roleBadgeBg = '#fef3c7';
      roleBadgeBorder = '#fde68a';
    } else if (isManagerRole) {
      roleBadgeColor = '#1d4ed8';
      roleBadgeBg = '#eff6ff';
      roleBadgeBorder = '#bfdbfe';
    }

    const taskCount = node.taskCount || 0;
    const completedTasks = node.tasksBreakdown?.completed || 0;

    return (
      <div className="org-tree-branch">
        {/* Node Card */}
        <div
          className={`org-node-card ${isSelected ? 'selected' : ''} ${
            isSuperAdmin ? 'node-super-admin' : isManagerRole ? 'node-manager' : 'node-employee'
          }`}
          onClick={() => handleNodeClick(node)}
          title={`Click to inspect ${node.name} and view reporting details`}
        >
          {/* Top Row: Avatar & Badges */}
          <div className="org-node-header">
            <div className="org-avatar-box">
              {node.avatar ? (
                <img src={node.avatar} alt={node.name} className="org-avatar-img" />
              ) : (
                <div
                  className="org-avatar-fallback"
                  style={{
                    background: isSuperAdmin
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                      : isManagerRole
                      ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                      : 'linear-gradient(135deg, #059669, #10b981)',
                  }}
                >
                  {node.name ? node.name.charAt(0).toUpperCase() : <Users size={16} />}
                </div>
              )}
            </div>

            <div className="org-badges-wrapper">
              <span
                className="org-role-badge"
                style={{
                  color: roleBadgeColor,
                  background: roleBadgeBg,
                  border: `1px solid ${roleBadgeBorder}`,
                }}
              >
                {isSuperAdmin && <Crown size={11} color="#d97706" style={{ marginRight: '3px' }} />}
                {isManagerRole && !isSuperAdmin && <Shield size={11} color="#2563eb" style={{ marginRight: '3px' }} />}
                {node.role || 'User'}
              </span>
            </div>
          </div>

          {/* Middle: Name & Department */}
          <div className="org-node-body">
            <div className="org-node-name" title={node.name}>
              {node.name}
            </div>
            <div className="org-node-dept" title={node.department}>
              {node.department || 'Operations'}
            </div>
          </div>

          {/* Bottom Summary Bar: Subordinates & Tasks */}
          <div className="org-node-footer">
            {hasChildren ? (
              <span className="org-team-pill" title={`${node.teamCount} total team members in branch`}>
                <Users size={12} />
                <span>{node.children.length} Direct ({node.teamCount} Team)</span>
              </span>
            ) : (
              <span className="org-team-pill individual" title="Direct Contributor">
                <Briefcase size={12} />
                <span>Contributor</span>
              </span>
            )}

            <span className="org-tasks-pill" title={`${taskCount} assigned tasks (${completedTasks} completed)`}>
              <CheckCircle2 size={12} color="#059669" />
              <span>{completedTasks}/{taskCount} Tasks</span>
            </span>
          </div>

          {/* Expand / Collapse Button if node has children */}
          {hasChildren && (
            <button
              type="button"
              className="org-collapse-btn"
              onClick={(e) => toggleCollapse(node._id, e)}
              title={isCollapsed ? `Expand ${node.name}'s branch` : `Collapse ${node.name}'s branch`}
              aria-label="Toggle subordinate branch"
            >
              {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          )}
        </div>

        {/* Children Sub-Tree Rendering with Connector Lines */}
        {hasChildren && !isCollapsed && (
          <div className="org-tree-children">
            {/* Horizontal Bus Line connecting children */}
            <div className="org-tree-bus" />

            <div className="org-children-grid">
              {node.children.map((child) => (
                <TreeNode key={child._id} node={child} isRoot={false} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="hierarchy-page-container">
      {/* Page Header */}
      <div className="section-header" style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb',
            }}
          >
            <Network size={20} />
          </div>
          <div>
            <h2 className="section-title" style={{ margin: 0, fontSize: '1.4rem' }}>
              {isSuperAdmin ? 'Organizational Hierarchy' : 'My Team Hierarchy'}
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isSuperAdmin
                ? 'Complete organization tree across all departments'
                : 'Your dedicated reporting branch (You at the top with your direct & indirect team below)'}
            </p>
          </div>
        </div>
      </div>


      {/* Main Hierarchy Canvas Viewport with Auto-Fit & Drag-to-Pan */}
      <div
        ref={viewportRef}
        className={`org-canvas-viewport ${isDragging ? 'is-dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {loading ? (
          <div className="org-loading-state">
            <div className="spinner-circle" />
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginTop: '12px' }}>
              Building organizational hierarchy...
            </p>
          </div>
        ) : error ? (
          <div className="org-error-state">
            <p style={{ color: '#dc2626', fontWeight: 600, marginBottom: '8px' }}>{error}</p>
            <button type="button" className="btn btn-primary" onClick={fetchHierarchy}>
              Try Again
            </button>
          </div>
        ) : !hierarchyData ? (
          <div className="org-empty-state">
            <Users size={36} color="var(--text-muted)" />
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginTop: '8px' }}>
              No organization members found.
            </p>
          </div>
        ) : (
          <div
            ref={treeRef}
            className="org-tree-canvas"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
            }}
          >
            <TreeNode node={hierarchyData} isRoot={true} />
          </div>
        )}
      </div>


      {/* Node Details Slide-Over Drawer / Inspection Modal */}
      {isDrawerOpen && selectedNode && (
        <div className="org-drawer-backdrop" onClick={() => setIsDrawerOpen(false)}>
          <div className="org-drawer-content" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="org-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="org-drawer-avatar">
                  {selectedNode.avatar ? (
                    <img src={selectedNode.avatar} alt={selectedNode.name} />
                  ) : (
                    <span>{selectedNode.name ? selectedNode.name.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </div>
                <div>
                  <h3 className="org-drawer-title">{selectedNode.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span className="org-drawer-role">{selectedNode.role}</span>
                    <span className="org-drawer-dept">{selectedNode.department || 'Operations'}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close inspector drawer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="org-drawer-body">
              {/* Dynamic Complete Reporting Chain Section */}
              <div className="org-drawer-section">
                <h4 className="org-drawer-section-title">
                  <Network size={16} color="#2563eb" />
                  <span>Complete Reporting Chain (to Super Admin)</span>
                </h4>

                <div className="org-chain-container">
                  {selectedNode.reportingChain && selectedNode.reportingChain.length > 0 ? (
                    selectedNode.reportingChain.map((chainMember, idx) => {
                      const isTarget = chainMember._id === selectedNode._id;
                      const isTopSuper = chainMember.role === 'Super Admin';

                      return (
                        <div key={chainMember._id} className="org-chain-step">
                          <div className={`org-chain-node ${isTarget ? 'target-node' : ''} ${isTopSuper ? 'root-node' : ''}`}>
                            <div className="org-chain-avatar">
                              {chainMember.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="org-chain-info">
                              <span className="org-chain-name">
                                {chainMember.name} {isTopSuper && '(Super Admin)'}
                              </span>
                              <span className="org-chain-role">{chainMember.role} • {chainMember.department || 'Operations'}</span>
                            </div>
                          </div>

                          {idx < selectedNode.reportingChain.length - 1 && (
                            <div className="org-chain-arrow">
                              <div className="chain-line" />
                              <span className="reports-to-text">Reports To</span>
                              <ChevronDown size={14} className="arrow-down-icon" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                      Highest executive in the organization (Super Admin).
                    </p>
                  )}
                </div>
              </div>

              {/* Employee Overview Info Cards */}
              <div className="org-drawer-section">
                <h4 className="org-drawer-section-title">
                  <UserCheck size={16} color="#059669" />
                  <span>Member Information</span>
                </h4>

                <div className="org-info-grid">
                  <div className="org-info-card">
                    <span className="org-info-card-label">Email Address</span>
                    <span className="org-info-card-val">{selectedNode.email}</span>
                  </div>

                  <div className="org-info-card">
                    <span className="org-info-card-label">Reporting Manager</span>
                    <span className="org-info-card-val">{selectedNode.reportsToName || 'Super Admin'}</span>
                  </div>

                  <div className="org-info-card">
                    <span className="org-info-card-label">Direct Team Members</span>
                    <span className="org-info-card-val">
                      {selectedNode.children ? `${selectedNode.children.length} Direct (${selectedNode.teamCount || 0} Total)` : '0 Members'}
                    </span>
                  </div>

                  <div className="org-info-card">
                    <span className="org-info-card-label">Total Assigned Tasks</span>
                    <span className="org-info-card-val">
                      {selectedNode.taskCount || 0} Tasks ({selectedNode.tasksBreakdown?.completed || 0} Completed)
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Subordinates List (if any) */}
              {selectedNode.children && selectedNode.children.length > 0 && (
                <div className="org-drawer-section">
                  <h4 className="org-drawer-section-title">
                    <Users size={16} color="#7c3aed" />
                    <span>Direct Team Members ({selectedNode.children.length})</span>
                  </h4>

                  <div className="org-subordinates-list">
                    {selectedNode.children.map((child) => (
                      <div
                        key={child._id}
                        className="org-subordinate-item"
                        onClick={() => setSelectedNode(child)}
                        title={`Click to view ${child.name}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="org-subordinate-avatar">
                            {child.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="org-subordinate-name">{child.name}</span>
                            <span className="org-subordinate-role">{child.role} • {child.department || 'Operations'}</span>
                          </div>
                        </div>

                        <span className="org-subordinate-task-pill">
                          {child.taskCount || 0} Tasks
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned Tasks List */}
              <div className="org-drawer-section">
                <h4 className="org-drawer-section-title">
                  <ListTodo size={16} color="#2563eb" />
                  <span>Assigned Work & Tasks ({selectedNode.tasks?.length || 0})</span>
                </h4>

                {selectedNode.tasks && selectedNode.tasks.length > 0 ? (
                  <div className="org-tasks-list">
                    {selectedNode.tasks.map((task) => {
                      const isDone = task.status === 'Completed';
                      const isProg = task.status === 'In Progress';

                      return (
                        <div key={task._id} className="org-task-item">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                            <span className="org-task-type-tag">{task.taskType || 'Task'}</span>
                            <span
                              className={`badge-status ${
                                isDone ? 'badge-status-completed' : isProg ? 'badge-status-progress' : 'badge-status-todo'
                              }`}
                              style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                            >
                              {task.status || 'To Do'}
                            </span>
                          </div>

                          <div className="org-task-desc">{task.description}</div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} />
                              <span>Due: {task.expectedDate ? new Date(task.expectedDate).toLocaleDateString() : 'No date'}</span>
                            </div>

                            {task.remark && (
                              <span style={{ fontStyle: 'italic', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                Note: {task.remark}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, padding: '12px 0' }}>
                    No tasks currently assigned to this member.
                  </p>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="org-drawer-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsDrawerOpen(false)}
                style={{ flex: 1 }}
              >
                Close
              </button>

              {/* Hierarchy-Enforced Direct Task Assignment */}
              {selectedNode && currentUser && (
                (currentUser.role === 'Super Admin' && (selectedNode.role === 'Manager' || selectedNode.role === 'Executive' || selectedNode.role === 'Administrator')) ||
                (['Manager', 'Executive', 'Administrator'].includes(currentUser.role) && (
                  (selectedNode.reportsTo && selectedNode.reportsTo.toString() === (currentUser._id || currentUser.id || '').toString()) ||
                  (selectedNode.reportsToName && (currentUser.name && selectedNode.reportsToName.toLowerCase().includes(currentUser.name.toLowerCase())))
                ))
              ) && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    openTaskCreateModal();
                  }}
                  style={{ flex: 1.2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Plus size={15} />
                  <span>{currentUser.role === 'Super Admin' ? 'Assign Task to Manager' : 'Assign Task to Junior'}</span>
                </button>
              )}

              {currentUser && (currentUser.role === 'Super Admin' || currentUser.role === 'Manager') && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    if (setActiveSection) {
                      setActiveSection('tasks');
                    }
                  }}
                  style={{ flex: 1 }}
                >
                  <ListTodo size={15} />
                  <span>Tasks</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
