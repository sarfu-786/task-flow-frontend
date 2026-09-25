import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { useUserManagement } from '../../context/UserContext';
import { hierarchyApi } from '../../services/api';
import {
  Network,
  Users,
  CheckCircle2,
  ListTodo,
  Crown,
  Shield,
  Briefcase,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  ArrowRight,
  UserCheck,
  Plus,
  AlertCircle,
} from 'lucide-react';

// Dynamic client-side tree builder fallback
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

  const buildNode = (u, depth = 1, ancestors = [], visited = new Set()) => {
    const uId = u._id ? u._id.toString() : '';
    const uName = (u.name || '').toLowerCase().trim();
    visited.add(uId);

    const currentChain = [
      ...ancestors,
      {
        _id: u._id,
        name: u.name,
        role: u.role,
        title: u.title || (u.role === 'Super Admin' ? 'Chief Executive Officer' : u.role === 'Manager' ? 'Operations Manager' : 'Team Member'),
        avatar: u.avatar || '',
        department: u.department || 'Operations',
        email: u.email,
      },
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
      const assigned = (t.assignedTo || '').toLowerCase().trim();
      const taskUserId = t.user ? (t.user._id ? t.user._id.toString() : t.user.toString()) : '';
      return assigned === uName || (taskUserId && taskUserId === uId);
    });

    const tasksBreakdown = {
      total: userTasks.length,
      todo: userTasks.filter((t) => t.status === 'To Do' || !t.status).length,
      inProgress: userTasks.filter((t) => t.status === 'In Progress').length,
      completed: userTasks.filter((t) => t.status === 'Completed').length,
    };

    const subNodes = directChildren.map((child) => buildNode(child, depth + 1, currentChain, visited));
    const teamCount = subNodes.reduce((acc, curr) => acc + 1 + (curr.teamCount || 0), 0);

    return {
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role || 'User',
      title: u.title || (u.role === 'Super Admin' ? 'Chief Executive Officer' : u.role === 'Manager' ? 'Operations Manager' : 'Team Member'),
      department: u.department || 'Operations',
      avatar: u.avatar || '',
      depth,
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
  const rootTree = buildNode(root, 1, [], visitedSet);

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
      const childNode = buildNode(subRoot, 2, [{ _id: root._id, name: root.name, role: root.role, department: root.department, email: root.email }], visitedSet);
      rootTree.children.push(childNode);
    });

    rootTree.teamCount = rootTree.children.reduce((acc, curr) => acc + 1 + (curr.teamCount || 0), 0);
  }

  return rootTree;
};

// Helper to get all subordinate user IDs for permission checks
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
  const { users } = useUserManagement();

  const isSuperAdmin = currentUser && currentUser.role === 'Super Admin';
  const isManager = currentUser && ['Manager', 'Executive', 'Administrator'].includes(currentUser.role);
  const isRegularUser = !isSuperAdmin && !isManager;

  const subordinateIds = useMemo(() => {
    return getSubordinateUserIds(currentUser, users);
  }, [currentUser, users]);

  // State Management
  const [hierarchyData, setHierarchyData] = useState(null);
  const [metaStats, setMetaStats] = useState({
    myReportingChain: [],
    mySupervisor: null,
    myPeers: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Viewport and Tree Refs for auto-fit and drag navigation
  const viewportRef = useRef(null);
  const treeRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0, initPanX: 0, initPanY: 0 });

  // Selected node for slide-over inspection drawer
  const [selectedNode, setSelectedNode] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());

  // Set hierarchy scale to exactly 28% (0.28)
  const [scale, setScale] = useState(0.28);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 24 });
  const [treeMetrics, setTreeMetrics] = useState({
    minLeft: 0,
    maxRight: 1000,
    minTop: 0,
    maxBottom: 600,
    width: 1000,
    height: 600,
  });

  // Measure tree bounds in unscaled coordinates
  const updateTreeMetrics = useCallback(() => {
    if (!treeRef.current) return;
    const cards = treeRef.current.querySelectorAll('.org-node-card');
    if (!cards || cards.length === 0) return;

    const currentTransform = treeRef.current.style.transform;
    treeRef.current.style.transform = 'none';

    const treeRect = treeRef.current.getBoundingClientRect();
    let minL = Infinity;
    let maxR = -Infinity;
    let minT = Infinity;
    let maxB = -Infinity;

    cards.forEach((card) => {
      const r = card.getBoundingClientRect();
      const l = r.left - treeRect.left;
      const right = r.right - treeRect.left;
      const t = r.top - treeRect.top;
      const b = r.bottom - treeRect.top;

      if (l < minL) minL = l;
      if (right > maxR) maxR = right;
      if (t < minT) minT = t;
      if (b > maxB) maxB = b;
    });

    treeRef.current.style.transform = currentTransform;

    if (minL !== Infinity && maxR !== -Infinity) {
      setTreeMetrics({
        minLeft: minL,
        maxRight: maxR,
        minTop: minT,
        maxBottom: maxB,
        width: Math.max(200, maxR - minL),
        height: Math.max(200, maxB - minT),
      });
    }
  }, []);

  // Center hierarchy at exactly 28% (0.28) scale with equal margins on both sides
  const calculateAutoFit = useCallback(() => {
    if (!viewportRef.current || !treeRef.current) return;

    // Temporarily reset transform to measure natural unscaled DOM bounds
    const currentTransform = treeRef.current.style.transform;
    treeRef.current.style.transform = 'none';

    const cards = treeRef.current.querySelectorAll('.org-node-card');
    const viewportWidth = viewportRef.current.clientWidth;

    if (!cards || cards.length === 0 || viewportWidth <= 0) {
      treeRef.current.style.transform = currentTransform;
      return;
    }

    const treeRect = treeRef.current.getBoundingClientRect();
    let minLeft = Infinity;
    let maxRight = -Infinity;
    let minTop = Infinity;
    let maxBottom = -Infinity;

    cards.forEach((card) => {
      const r = card.getBoundingClientRect();
      const l = r.left - treeRect.left;
      const right = r.right - treeRect.left;
      const t = r.top - treeRect.top;
      const b = r.bottom - treeRect.top;

      if (l < minLeft) minLeft = l;
      if (right > maxRight) maxRight = right;
      if (t < minTop) minTop = t;
      if (b > maxBottom) maxBottom = b;
    });

    // Restore transform
    treeRef.current.style.transform = currentTransform;

    // Total true unscaled width from leftmost card edge to rightmost card edge
    const trueTreeWidth = maxRight - minLeft;
    const trueTreeHeight = maxBottom - minTop;

    setTreeMetrics({
      minLeft,
      maxRight,
      minTop,
      maxBottom,
      width: Math.max(200, trueTreeWidth),
      height: Math.max(200, trueTreeHeight),
    });

    // Set hierarchy size at 28% (0.28)
    const finalScale = 0.28;
    setScale(finalScale);

    if (trueTreeWidth > 0 && viewportWidth > 0) {
      const scaledTreeWidth = trueTreeWidth * finalScale;
      // Center horizontally with equal margins on left and right
      const equalMargin = (viewportWidth - scaledTreeWidth) / 2;
      const initialPanX = equalMargin - (minLeft * finalScale);

      setPanOffset({ x: initialPanX, y: 24 });
    }
  }, []);

  // Fetch dynamic hierarchy
  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await hierarchyApi.getOrganizationHierarchy();
      if (data && data.success) {
        setHierarchyData(data.hierarchy);
        setMetaStats({
          myReportingChain: data.myReportingChain || [],
          mySupervisor: data.mySupervisor || null,
          myPeers: data.myPeers || [],
        });
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
      setError('Unable to load organizational hierarchy.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, [users, tasks]);

  // Keep hierarchy set to 28% and centered on initial load, loading state change, resize, and branch toggle
  useEffect(() => {
    if (!hierarchyData || loading) return;

    calculateAutoFit();
    const t1 = setTimeout(calculateAutoFit, 60);
    const t2 = setTimeout(calculateAutoFit, 200);
    const t3 = setTimeout(calculateAutoFit, 500);

    window.addEventListener('resize', calculateAutoFit);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', calculateAutoFit);
    };
  }, [hierarchyData, loading, collapsedNodes, calculateAutoFit]);

  // Lock body scroll when drawer is open
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

  // Native non-passive wheel listener for smooth 2D multi-directional scrolling without outer page jump
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleNativeWheel = (e) => {
      e.preventDefault();

      let dx = e.deltaX;
      let dy = e.deltaY;

      // If user holds shift or does horizontal scroll
      if (e.shiftKey && dx === 0) {
        dx = dy;
        dy = 0;
      }

      setPanOffset((prev) => ({
        x: prev.x - dx * 0.95,
        y: prev.y - dy * 0.95,
      }));
    };

    viewport.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      viewport.removeEventListener('wheel', handleNativeWheel);
    };
  }, []);

  // Pointer drag panning handler (works anywhere on canvas with click vs drag discrimination)
  const handlePointerDown = (e) => {
    // Ignore if clicking collapse toggles, scrollbars, or drawer
    if (
      e.target.closest('.org-collapse-btn') ||
      e.target.closest('.org-scrollbar-track')
    ) {
      return;
    }

    isDraggingRef.current = false;
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initPanX: panOffset.x,
      initPanY: panOffset.y,
    };

    const handlePointerMove = (moveEvt) => {
      const dx = moveEvt.clientX - pointerStartRef.current.x;
      const dy = moveEvt.clientY - pointerStartRef.current.y;

      if (!isDraggingRef.current && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        isDraggingRef.current = true;
        setIsDragging(true);
      }

      if (isDraggingRef.current) {
        setPanOffset({
          x: pointerStartRef.current.initPanX + dx,
          y: pointerStartRef.current.initPanY + dy,
        });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      setTimeout(() => {
        setIsDragging(false);
        isDraggingRef.current = false;
      }, 50);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Keyboard navigation for arrow keys
  const handleKeyDown = (e) => {
    const step = 60;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPanOffset((prev) => ({ ...prev, x: prev.x + step }));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPanOffset((prev) => ({ ...prev, x: prev.x - step }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPanOffset((prev) => ({ ...prev, y: prev.y + step }));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setPanOffset((prev) => ({ ...prev, y: prev.y - step }));
    }
  };

  const handleNodeClick = (node) => {
    if (isDraggingRef.current) return;
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

  // Interactive Scrollbar Calculations
  const viewportWidth = viewportRef.current?.clientWidth || 800;
  const viewportHeight = viewportRef.current?.clientHeight || 580;

  const scaledTreeWidth = treeMetrics.width * scale;
  const scaledTreeHeight = treeMetrics.height * scale;

  const hTrackWidth = Math.max(100, viewportWidth - 32);
  const hThumbWidth = Math.max(48, Math.min(hTrackWidth * 0.75, (viewportWidth / (scaledTreeWidth + viewportWidth)) * hTrackWidth));

  const leftmostPanX = viewportWidth * 0.8 - (treeMetrics.minLeft * scale);
  const rightmostPanX = viewportWidth * 0.2 - (treeMetrics.maxRight * scale);
  const hPanSpan = Math.max(1, leftmostPanX - rightmostPanX);
  const hProgress = Math.max(0, Math.min(1, (leftmostPanX - panOffset.x) / hPanSpan));
  const hThumbLeft = hProgress * (hTrackWidth - hThumbWidth);

  const vTrackHeight = Math.max(100, viewportHeight - 32);
  const vThumbHeight = Math.max(48, Math.min(vTrackHeight * 0.75, (viewportHeight / (scaledTreeHeight + viewportHeight)) * vTrackHeight));

  const topmostPanY = viewportHeight * 0.8 - (treeMetrics.minTop * scale);
  const bottommostPanY = viewportHeight * 0.2 - (treeMetrics.maxBottom * scale);
  const vPanSpan = Math.max(1, topmostPanY - bottommostPanY);
  const vProgress = Math.max(0, Math.min(1, (topmostPanY - panOffset.y) / vPanSpan));
  const vThumbTop = vProgress * (vTrackHeight - vThumbHeight);

  // Horizontal Scrollbar drag and click
  const handleHThumbPointerDown = (e) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startPanX = panOffset.x;

    const onMove = (moveEvt) => {
      const deltaScreenX = moveEvt.clientX - startX;
      const panDelta = (deltaScreenX / Math.max(1, hTrackWidth - hThumbWidth)) * hPanSpan;
      setPanOffset((prev) => ({
        ...prev,
        x: startPanX - panDelta,
      }));
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleHTrackClick = (e) => {
    if (e.target.classList.contains('org-scrollbar-thumb')) return;
    const trackRect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - trackRect.left;
    const targetProgress = Math.max(0, Math.min(1, clickX / trackRect.width));
    const targetPanX = leftmostPanX - targetProgress * hPanSpan;
    setPanOffset((prev) => ({ ...prev, x: targetPanX }));
  };

  // Vertical Scrollbar drag and click
  const handleVThumbPointerDown = (e) => {
    e.stopPropagation();
    const startY = e.clientY;
    const startPanY = panOffset.y;

    const onMove = (moveEvt) => {
      const deltaScreenY = moveEvt.clientY - startY;
      const panDelta = (deltaScreenY / Math.max(1, vTrackHeight - vThumbHeight)) * vPanSpan;
      setPanOffset((prev) => ({
        ...prev,
        y: startPanY - panDelta,
      }));
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleVTrackClick = (e) => {
    if (e.target.classList.contains('org-scrollbar-thumb')) return;
    const trackRect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - trackRect.top;
    const targetProgress = Math.max(0, Math.min(1, clickY / trackRect.height));
    const targetPanY = topmostPanY - targetProgress * vPanSpan;
    setPanOffset((prev) => ({ ...prev, y: targetPanY }));
  };

  // Recursive Tree Node Renderer with Connected Thick Gray Lines
  const TreeNode = ({ node, isRoot = false }) => {
    if (!node) return null;

    const hasChildren = node.children && node.children.length > 0;
    const nodeIdStr = node._id ? node._id.toString() : '';
    const isCollapsed = collapsedNodes.has(nodeIdStr);
    const isSelected = selectedNode && (selectedNode._id ? selectedNode._id.toString() : '') === nodeIdStr;

    const isNodeSuper = node.role === 'Super Admin';
    const isNodeManager = ['Manager', 'Executive', 'Administrator'].includes(node.role);
    const isCurrentUser = currentUser && ((currentUser._id ? currentUser._id.toString() : '') === nodeIdStr);

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
      <div className={`org-tree-branch ${isRoot ? 'is-root-branch' : ''}`}>
        {/* Node Card */}
        <div
          className={`org-node-card ${isSelected ? 'selected' : ''} ${
            isNodeSuper ? 'node-super-admin' : isNodeManager ? 'node-manager' : 'node-employee'
          } ${isCurrentUser ? 'node-current-user' : ''}`}
          onClick={() => handleNodeClick(node)}
          title={`Click to inspect reporting details for ${node.name}`}
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
              {isCurrentUser && <span className="org-avatar-badge" title="You">ME</span>}
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

          {/* Collapse/Expand chevron button */}
          {hasChildren && (
            <button
              type="button"
              className="org-collapse-btn"
              onClick={(e) => toggleCollapse(nodeIdStr, e)}
              title={isCollapsed ? `Expand ${node.name}'s branch (${node.children.length} members)` : `Collapse ${node.name}'s branch`}
              aria-label="Toggle subordinate branch"
            >
              {isCollapsed ? (
                <span className="org-collapse-count">+{node.children.length}</span>
              ) : (
                <ChevronUp size={13} />
              )}
            </button>
          )}
        </div>

        {/* Children Sub-Tree with strictly bounded thick gray connector lines */}
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

  // Regular Employee / User Dedicated Personal View
  const UserPersonalHierarchyView = () => {
    return (
      <div className="user-hierarchy-layout">
        {/* Section 1: My Direct Reporting Chain (Upward Hierarchy) */}
        <div className="card upward-chain-card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Network size={20} />
              </div>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>My Upward Reporting Line</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Your complete chain of command from you directly up to the Chief Executive / Super Admin
                </p>
              </div>
            </div>
          </div>

          <div className="chain-steps-row">
            {metaStats.myReportingChain && metaStats.myReportingChain.length > 0 ? (
              metaStats.myReportingChain.map((step, idx) => {
                const isMe = idx === 0;
                const isCeo = idx === metaStats.myReportingChain.length - 1;
                const isDirectSup = idx === 1;

                return (
                  <React.Fragment key={step._id || idx}>
                    <div
                      className={`chain-step-card ${isMe ? 'is-me' : isCeo ? 'is-ceo' : isDirectSup ? 'is-supervisor' : ''}`}
                      onClick={() => handleNodeClick(step)}
                    >
                      <div className="chain-step-badge">
                        {isMe ? 'YOU' : isDirectSup ? 'DIRECT MANAGER' : isCeo ? 'EXECUTIVE (SUPER ADMIN)' : 'LEADERSHIP'}
                      </div>

                      <div className="chain-step-avatar">
                        {step.avatar ? (
                          <img src={step.avatar} alt={step.name} />
                        ) : (
                          <span>{step.name ? step.name.charAt(0).toUpperCase() : 'U'}</span>
                        )}
                      </div>

                      <div className="chain-step-name">{step.name}</div>
                      <div className="chain-step-role">{step.role}</div>
                      <div className="chain-step-dept">{step.department || 'Operations'}</div>
                      <div className="chain-step-email">{step.email}</div>
                    </div>

                    {idx < metaStats.myReportingChain.length - 1 && (
                      <div className="chain-connector-arrow">
                        <span className="chain-arrow-label">Reports To</span>
                        <ArrowRight size={18} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <div style={{ padding: '24px', color: 'var(--text-muted)', textAlign: 'center', width: '100%' }}>
                <Users size={32} />
                <p style={{ marginTop: '8px' }}>Reporting chain is being synchronized with the organization structure.</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: My Peers and My Direct Subordinates */}
        <div className="user-hierarchy-split-grid">
          {/* My Team Colleagues (Peers) */}
          <div className="card my-peers-card">
            <div className="card-header">
              <h3 className="card-title" style={{ fontSize: '1rem' }}>
                <Users size={18} color="#2563eb" />
                <span>My Team & Colleagues ({metaStats.myPeers?.length || 0})</span>
              </h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Personnel reporting to the same direct senior ({metaStats.mySupervisor?.name || 'Manager'})
            </p>

            <div className="peers-list">
              {metaStats.myPeers && metaStats.myPeers.length > 0 ? (
                metaStats.myPeers.map((peer) => (
                  <div
                    key={peer._id}
                    className="peer-item"
                    onClick={() => handleNodeClick(peer)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="peer-avatar">
                        {peer.name ? peer.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="peer-name">{peer.name}</div>
                        <div className="peer-role">{peer.role} • {peer.department || 'Operations'}</div>
                      </div>
                    </div>

                    <span className="org-tasks-pill">
                      {peer.taskCount || 0} Tasks
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, padding: '16px 0' }}>
                  No other peers currently reporting to this supervisor.
                </p>
              )}
            </div>
          </div>

          {/* My Subordinate Branch */}
          <div className="card my-subordinates-card">
            <div className="card-header">
              <h3 className="card-title" style={{ fontSize: '1rem' }}>
                <Shield size={18} color="#059669" />
                <span>My Subordinate Branch</span>
              </h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Team members who report directly to you
            </p>

            {hierarchyData && hierarchyData.children && hierarchyData.children.length > 0 ? (
              <div className="peers-list">
                {hierarchyData.children.map((sub) => (
                  <div
                    key={sub._id}
                    className="peer-item subordinate-item"
                    onClick={() => handleNodeClick(sub)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="peer-avatar subordinate">
                        {sub.name ? sub.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="peer-name">{sub.name}</div>
                        <div className="peer-role">{sub.role} • {sub.department || 'Operations'}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="org-tasks-pill">
                        {sub.taskCount || 0} Tasks
                      </span>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openTaskCreateModal({ assignedTo: sub.name, userId: sub._id });
                        }}
                      >
                        <Plus size={12} />
                        <span>Assign</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Briefcase size={28} style={{ opacity: 0.6, marginBottom: '6px' }} />
                <p style={{ fontSize: '0.85rem', margin: 0 }}>
                  You do not currently have junior staff assigned to report to you.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="hierarchy-page-container">
      {/* Page Header: Clean & Pure */}
      <div className="hierarchy-header-block">
        <div className="hierarchy-title-area">
          <div className="hierarchy-title-icon">
            <Network size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="hierarchy-main-heading">
                {isSuperAdmin
                  ? 'Enterprise Organizational Hierarchy'
                  : isManager
                  ? 'My Team Organizational Hierarchy'
                  : 'My Organizational Hierarchy & Team Structure'}
              </h1>
              <span
                className="badge-official"
                style={{
                  background: isSuperAdmin ? '#fef3c7' : isManager ? '#eff6ff' : '#ecfdf5',
                  color: isSuperAdmin ? '#b45309' : isManager ? '#1d4ed8' : '#047857',
                  borderColor: isSuperAdmin ? '#fde68a' : isManager ? '#bfdbfe' : '#a7f3d0',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                {currentUser?.role || 'Member'}
              </span>
            </div>
            <p className="hierarchy-sub-heading">
              {isSuperAdmin
                ? 'Complete company-wide structure and reporting chains across all levels'
                : isManager
                ? 'Manage your team hierarchy and view direct reporting relationships'
                : 'View your direct supervisor, complete reporting line, and department peers'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Hierarchy Canvas */}
      {isRegularUser ? (
        <UserPersonalHierarchyView />
      ) : loading ? (
        <div className="org-loading-state card" style={{ minHeight: '400px' }}>
          <div className="spinner-circle" />
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginTop: '12px' }}>
            Loading organizational hierarchy...
          </p>
        </div>
      ) : error ? (
        <div className="org-error-state card" style={{ minHeight: '400px' }}>
          <AlertCircle size={36} color="#dc2626" />
          <p style={{ color: '#dc2626', fontWeight: 600, marginTop: '8px', marginBottom: '12px' }}>{error}</p>
          <button type="button" className="btn btn-primary" onClick={fetchHierarchy}>
            Try Again
          </button>
        </div>
      ) : !hierarchyData ? (
        <div className="org-empty-state card" style={{ minHeight: '400px' }}>
          <Users size={40} color="var(--text-muted)" />
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginTop: '10px' }}>
            No active organization members found.
          </p>
        </div>
      ) : (
        /* Pure Visual Tree Org Chart Canvas */
        <div
          ref={viewportRef}
          tabIndex={0}
          className={`org-canvas-viewport ${isDragging ? 'is-dragging' : ''}`}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
        >

          {/* Interactive Custom Horizontal Scrollbar Track & Thumb */}
          <div
            className="org-scrollbar-track org-scrollbar-h"
            onClick={handleHTrackClick}
            title="Click or drag to scroll horizontally to each side"
          >
            <div
              className="org-scrollbar-thumb"
              style={{
                width: `${hThumbWidth}px`,
                transform: `translateX(${hThumbLeft}px)`,
              }}
              onPointerDown={handleHThumbPointerDown}
            />
          </div>

          {/* Interactive Custom Vertical Scrollbar Track & Thumb */}
          <div
            className="org-scrollbar-track org-scrollbar-v"
            onClick={handleVTrackClick}
            title="Click or drag to scroll vertically"
          >
            <div
              className="org-scrollbar-thumb"
              style={{
                height: `${vThumbHeight}px`,
                transform: `translateY(${vThumbTop}px)`,
              }}
              onPointerDown={handleVThumbPointerDown}
            />
          </div>

          <div className="org-tree-fit-wrapper">
            <div
              ref={treeRef}
              className="org-tree-canvas"
              style={{
                transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${scale})`,
                transformOrigin: 'top left',
                transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <TreeNode node={hierarchyData} isRoot={true} />
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over Inspector Drawer for Detailed Profile & Reporting Inspection */}
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
                    <span className="org-drawer-role">{selectedNode.role || 'Member'}</span>
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
                  <span>Upward Reporting Chain to Leadership</span>
                </h4>

                <div className="org-chain-container">
                  {selectedNode.reportingChain && selectedNode.reportingChain.length > 0 ? (
                    selectedNode.reportingChain.map((chainMember, idx) => {
                      const isTarget = (chainMember._id ? chainMember._id.toString() : '') === (selectedNode._id ? selectedNode._id.toString() : '');
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

              {/* Member Overview Information Cards */}
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
                    <span className="org-info-card-label">Assigned Workload</span>
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
                        title={`Click to inspect ${child.name}`}
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

            {/* Drawer Footer Actions */}
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

export default OrganizationHierarchy;
