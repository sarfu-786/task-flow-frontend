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
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
} from 'lucide-react';

// Dynamic tree builder from client-side state
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
    root = activeUsers.find((u) => u.role === 'Super Admin' && (!u.reportsTo || u.reportsTo === 'null'));
    if (!root) root = activeUsers.find((u) => u.role === 'Super Admin');
    if (!root) root = activeUsers.find((u) => !u.reportsTo || u.reportsTo === 'null');
    if (!root) root = activeUsers[0];
  }

  const buildNode = (u, ancestors = [], visited = new Set()) => {
    const uId = u._id ? u._id.toString() : '';
    const uName = (u.name || '').toLowerCase();
    visited.add(uId);

    const currentChain = [
      ...ancestors,
      { _id: u._id, name: u.name, role: u.role, title: u.title || u.role, avatar: u.avatar, department: u.department, email: u.email },
    ];

    const directChildren = activeUsers.filter((other) => {
      if (!other._id) return false;
      const otherId = other._id.toString();
      if (otherId === uId || visited.has(otherId)) return false;
      const rId = other.reportsTo ? (other.reportsTo._id ? other.reportsTo._id.toString() : other.reportsTo.toString()) : '';
      const rawRName = (other.reportsToName || '').toLowerCase().trim();
      const cleanRName = rawRName.replace(/\s*\([^)]*\)/g, '').trim();
      return rId === uId || (cleanRName && cleanRName === uName) || (rawRName && rawRName === uName);
    });

    const userTasks = (taskList || []).filter((t) => {
      if (!t) return false;
      const assigned = (t.assignedTo || '').toLowerCase();
      const taskUserId = t.user ? (t.user._id ? t.user._id.toString() : t.user.toString()) : '';
      return assigned === uName || (taskUserId && taskUserId === uId);
    });

    const tasksBreakdown = {
      total: userTasks.length,
      todo: userTasks.filter((t) => t.status === 'To Do' || !t.status).length,
      inProgress: userTasks.filter((t) => t.status === 'In Progress').length,
      completed: userTasks.filter((t) => t.status === 'Completed').length,
    };

    const subNodes = directChildren.map((child) => buildNode(child, currentChain, visited));
    const teamCount = subNodes.reduce((acc, curr) => acc + 1 + (curr.teamCount || 0), 0);

    return {
      _id: u._id,
      name: u.name,
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
      tasks: userTasks,
      teamCount,
      children: subNodes,
    };
  };

  const visitedSet = new Set();
  const rootTree = buildNode(root, [], visitedSet);

  // If this is the full organization tree, attach unparented subtree roots so entire branches stay intact
  if (!rootUserOverride) {
    const allIncludedIds = new Set();
    const collectIds = (node) => {
      if (!node || !node._id) return;
      allIncludedIds.add(node._id.toString());
      if (Array.isArray(node.children)) {
        node.children.forEach(collectIds);
      }
    };
    collectIds(rootTree);

    const unattachedUsers = activeUsers.filter((u) => {
      const uId = u._id ? u._id.toString() : '';
      return uId && !allIncludedIds.has(uId);
    });

    const unattachedIds = new Set(unattachedUsers.map((u) => (u._id ? u._id.toString() : '')));

    const subtreeRoots = unattachedUsers.filter((u) => {
      let parentId = null;
      const rIdStr = u.reportsTo ? (u.reportsTo._id ? u.reportsTo._id.toString() : u.reportsTo.toString()) : '';
      const rawRName = (u.reportsToName || '').toLowerCase().trim();
      const cleanRName = rawRName.replace(/\s*\([^)]*\)/g, '').trim();

      const matchedParent = activeUsers.find((other) => {
        const oId = other._id ? other._id.toString() : '';
        const oName = (other.name || '').toLowerCase().trim();
        return (rIdStr && oId === rIdStr) || (cleanRName && oName === cleanRName) || (rawRName && oName === rawRName);
      });

      if (matchedParent) {
        parentId = matchedParent._id ? matchedParent._id.toString() : '';
      }

      return !parentId || !unattachedIds.has(parentId);
    });

    subtreeRoots.forEach((subRoot) => {
      const childNode = buildNode(subRoot, [{ _id: root._id, name: root.name, role: root.role, department: root.department, email: root.email }], visitedSet);
      rootTree.children.push(childNode);
    });

    rootTree.teamCount = rootTree.children.reduce((acc, curr) => acc + 1 + (curr.teamCount || 0), 0);
  }

  return rootTree;
};

// Helper to get all user IDs that are subordinate to (under) the current user in hierarchy
const getSubordinateUserIds = (user, allUsers) => {
  if (!user || !allUsers || !Array.isArray(allUsers)) return new Set();
  const userIdStr = (user._id ? user._id.toString() : (user.id ? user.id.toString() : '')).trim();
  const userNameStr = (user.name || '').toLowerCase().trim();

  const subordinateIds = new Set();
  if (!userIdStr && !userNameStr) return subordinateIds;

  const queue = [userIdStr];
  const processed = new Set([userIdStr]);

  while (queue.length > 0) {
    const currentParentId = queue.shift();
    const parentUser = allUsers.find((u) => u && (u._id || u.id) && (u._id || u.id).toString() === currentParentId);
    const parentName = (parentUser?.name || (currentParentId === userIdStr ? userNameStr : '')).toLowerCase().trim();

    for (const u of allUsers) {
      if (!u) continue;
      const uIdStr = (u._id || u.id || '').toString();
      if (!uIdStr || uIdStr === userIdStr || processed.has(uIdStr)) continue;

      const repIdStr = u.reportsTo ? (u.reportsTo._id ? u.reportsTo._id.toString() : u.reportsTo.toString()) : '';
      const repNameStr = (u.reportsToName || '').toLowerCase().trim();
      const createdByStr = u.createdBy ? (u.createdBy._id ? u.createdBy._id.toString() : u.createdBy.toString()) : '';

      const isDirectReport =
        (currentParentId && repIdStr === currentParentId) ||
        (parentName && repNameStr && (repNameStr.includes(parentName) || parentName.includes(repNameStr)));

      const isCreatedByParent = currentParentId && createdByStr === currentParentId;

      if (isDirectReport || isCreatedByParent) {
        subordinateIds.add(uIdStr);
        processed.add(uIdStr);
        queue.push(uIdStr);
      }
    }
  }

  return subordinateIds;
};

export const OrganizationHierarchy = ({ setActiveSection }) => {
  const { user: currentUser } = useAuth();
  const { tasks, openCreateModal: openTaskCreateModal } = useTasks();
  const { users, loading: usersLoading } = useUserManagement();

  const isSuperAdmin = currentUser && currentUser.role === 'Super Admin';
  const subordinateIds = useMemo(() => {
    return getSubordinateUserIds(currentUser, users);
  }, [currentUser, users]);

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

  // Zoom / scale state for responsive navigation
  const [zoomLevel, setZoomLevel] = useState(1);
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());

  // Zoom helpers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(1.5, Number((prev + 0.1).toFixed(1))));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(0.4, Number((prev - 0.1).toFixed(1))));
  const handleZoomReset = () => setZoomLevel(1);

  // Auto-fit hierarchy tree to viewport width
  const autoFitToScreen = () => {
    if (!viewportRef.current || !treeRef.current) return;
    const viewportWidth = viewportRef.current.clientWidth - 48;
    const treeWidth = treeRef.current.scrollWidth;
    if (treeWidth > viewportWidth && viewportWidth > 200) {
      const calculated = Number((viewportWidth / treeWidth).toFixed(2));
      const optimalScale = Math.max(0.5, Math.min(1.0, calculated));
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
      console.warn('Hierarchy API fallback to client builder:', err.message);
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

  // Node Component Recursive Renderer for Tree View
  const TreeNode = ({ node, isRoot = false }) => {
    if (!node) return null;

    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedNodes.has(node._id);
    const isSelected = selectedNode && selectedNode._id === node._id;

    const isNodeSuper = node.role === 'Super Admin';
    const isNodeManager = ['Manager', 'Executive', 'Administrator'].includes(node.role);

    let roleBadgeColor = '#047857';
    let roleBadgeBg = '#ecfdf5';
    let roleBadgeBorder = '#a7f3d0';

    if (isNodeSuper) {
      roleBadgeColor = '#b45309';
      roleBadgeBg = '#fef3c7';
      roleBadgeBorder = '#fde68a';
    } else if (isNodeManager) {
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
            isNodeSuper ? 'node-super-admin' : isNodeManager ? 'node-manager' : 'node-employee'
          }`}
          onClick={() => handleNodeClick(node)}
          title={`Click to view reporting details for ${node.name}`}
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
                    background: isNodeSuper
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                      : isNodeManager
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
                {isNodeSuper && <Crown size={11} color="#d97706" style={{ marginRight: '3px' }} />}
                {isNodeManager && !isNodeSuper && <Shield size={11} color="#2563eb" style={{ marginRight: '3px' }} />}
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

          {/* Bottom Summary Bar */}
          <div className="org-node-footer">
            {hasChildren ? (
              <span className="org-team-pill" title={`${node.teamCount || node.children.length} team members under this branch`}>
                <Users size={12} />
                <span>{node.children.length} Direct ({node.teamCount || node.children.length} Total)</span>
              </span>
            ) : (
              <span className="org-team-pill individual" title="Direct Contributor">
                <Briefcase size={12} />
                <span>Contributor</span>
              </span>
            )}

            <span className="org-tasks-pill" title={`${taskCount} tasks assigned (${completedTasks} done)`}>
              <CheckCircle2 size={12} color="#059669" />
              <span>{completedTasks}/{taskCount} Tasks</span>
            </span>
          </div>

          {/* Collapse/Expand button */}
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

        {/* Children Sub-Tree Rendering */}
        {hasChildren && !isCollapsed && (
          <div className="org-tree-children">
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
      {/* Page Header with Clean Zoom & Fit Controls */}
      <div
        className="section-header"
        style={{
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb',
            }}
          >
            <Network size={22} />
          </div>
          <div>
            <h2 className="section-title" style={{ margin: 0, fontSize: '1.4rem' }}>
              {isSuperAdmin ? 'Organizational Hierarchy' : 'My Team Hierarchy'}
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isSuperAdmin
                ? 'Complete organization tree across all levels and departments'
                : 'Your dedicated reporting branch (You at the top with your direct & indirect team below)'}
            </p>
          </div>
        </div>

        {/* Zoom & Screen Fit Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="org-zoom-group">
            <button
              type="button"
              className="org-zoom-btn"
              onClick={handleZoomOut}
              title="Zoom Out"
              disabled={zoomLevel <= 0.4}
            >
              <ZoomOut size={15} />
            </button>

            <span className="org-zoom-label">{Math.round(zoomLevel * 100)}%</span>

            <button
              type="button"
              className="org-zoom-btn"
              onClick={handleZoomIn}
              title="Zoom In"
              disabled={zoomLevel >= 1.5}
            >
              <ZoomIn size={15} />
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleZoomReset}
            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            title="Reset Zoom to 100%"
          >
            <RotateCcw size={13} />
            <span>100%</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={autoFitToScreen}
            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            title="Fit tree automatically to screen width"
          >
            <Maximize2 size={13} />
            <span>Fit Screen</span>
          </button>
        </div>
      </div>

      {/* Main Hierarchy Tree Canvas */}
      {loading ? (
        <div className="org-loading-state card" style={{ minHeight: '380px' }}>
          <div className="spinner-circle" />
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginTop: '12px' }}>
            Building organization hierarchy...
          </p>
        </div>
      ) : error ? (
        <div className="org-error-state card" style={{ minHeight: '380px' }}>
          <p style={{ color: '#dc2626', fontWeight: 600, marginBottom: '8px' }}>{error}</p>
          <button type="button" className="btn btn-primary" onClick={fetchHierarchy}>
            Try Again
          </button>
        </div>
      ) : !hierarchyData ? (
        <div className="org-empty-state card" style={{ minHeight: '380px' }}>
          <Users size={36} color="var(--text-muted)" />
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginTop: '8px' }}>
            No organization members found.
          </p>
        </div>
      ) : (
        <div
          ref={viewportRef}
          className={`org-canvas-viewport ${isDragging ? 'is-dragging' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            ref={treeRef}
            className="org-tree-canvas"
            style={{
              transform: `scale(${zoomLevel})`,
            }}
          >
            <TreeNode node={hierarchyData} isRoot={true} />
          </div>
        </div>
      )}

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
                        <div key={chainMember._id || idx} className="org-chain-step">
                          <div className={`org-chain-node ${isTarget ? 'target-node' : ''} ${isTopSuper ? 'root-node' : ''}`}>
                            <div className="org-chain-avatar">
                              {chainMember.name ? chainMember.name.charAt(0).toUpperCase() : 'U'}
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
                    <span className="org-info-card-label">Reporting Senior</span>
                    <span className="org-info-card-val">{selectedNode.reportsToName || 'Super Admin'}</span>
                  </div>

                  <div className="org-info-card">
                    <span className="org-info-card-label">Direct Team Members</span>
                    <span className="org-info-card-val">
                      {selectedNode.children ? `${selectedNode.children.length} Direct (${selectedNode.teamCount || 0} Total)` : '0 Members'}
                    </span>
                  </div>

                  <div className="org-info-card">
                    <span className="org-info-card-label">Assigned Tasks</span>
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
                            {child.name ? child.name.charAt(0).toUpperCase() : 'U'}
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

              {/* Hierarchy-Enforced Task Assignment */}
              {selectedNode && currentUser && (
                isSuperAdmin ||
                (selectedNode._id && (selectedNode._id.toString() === (currentUser._id || currentUser.id || '').toString())) ||
                (subordinateIds.has(selectedNode._id ? selectedNode._id.toString() : ''))
              ) && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    openTaskCreateModal({ assignedTo: selectedNode.name, userId: selectedNode._id });
                  }}
                  style={{ flex: 1.2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Plus size={15} />
                  <span>Assign Task</span>
                </button>
              )}

              {currentUser && (
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
