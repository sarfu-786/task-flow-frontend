import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { useUserManagement } from '../../context/UserContext';
import { useTasks } from '../../context/TaskContext';
import { getRankedAssignees, getRecommendedDepartment, getUserAvailability } from '../../utils/complaintRoutingHelper';
import {
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  User,
  Building,
  Mail,
  Phone,
  Tag,
  Star,
  Shield,
  Edit2,
  Trash2,
  Calendar,
  CheckSquare,
  FileText,
  HelpCircle,
  Send,
  PhoneOutgoing,
  MessageSquare,
  RotateCcw,
  ArrowUpRight,
  Sparkles,
  Link as LinkIcon,
  Search,
  Plus,
  BookOpen,
  History,
  Activity,
  UserCheck,
  Zap,
  Lock,
  ChevronDown,
  ChevronUp,
  Check,
  ExternalLink,
  Layers,
  ListChecks,
  Info,
  Paperclip,
  Download,
  Image as ImageIcon,
} from 'lucide-react';

export const ComplaintDetailModal = ({
  isOpen,
  onClose,
  complaint: initialComplaint,
  onEdit,
  onResolve,
  onDelete,
  canDelete,
}) => {
  const {
    allComplaints,
    assignComplaint,
    escalateComplaint,
    getEscalationRecipients,
    investigateComplaint,
    addActivity,
    closeComplaint,
    reopenComplaint,
    linkComplaint,
    updateFollowUpStatus,
    submitCsat,
    getRelatedRecords,
    resolveComplaint,
  } = useComplaints();
  const { user: currentUser, isSuperAdmin, isManager } = useAuth();
  const { users, assignableUsers } = useUserManagement ? useUserManagement() : { users: [], assignableUsers: [] };
  const { showLiveToast } = useTasks ? useTasks() : {};

  // Always keep complaint dynamically synced with latest state
  const complaint = useMemo(() => {
    if (!initialComplaint) return null;
    const match = (allComplaints || []).find((c) => c._id === initialComplaint._id);
    return match || initialComplaint;
  }, [allComplaints, initialComplaint]);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'activities' | 'resolution'

  const todayDateStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Filter users strictly according to hierarchy
  const authorizedUsers = useMemo(() => {
    if (!users || users.length === 0) return [];
    if (isSuperAdmin) return users;
    if (isManager && currentUser) {
      const myId = currentUser._id?.toString() || currentUser.id?.toString();
      return users.filter((u) => {
        const uId = u._id?.toString() || u.id?.toString();
        if (uId === myId) return true;
        const mgrId = u.reportsTo?._id?.toString() || u.reportsTo?.toString() || u.reportingManagerId?.toString();
        return mgrId === myId;
      });
    }
    if (currentUser) {
      const myId = currentUser._id?.toString() || currentUser.id?.toString();
      return users.filter((u) => (u._id?.toString() || u.id?.toString()) === myId);
    }
    return users;
  }, [users, isSuperAdmin, isManager, currentUser]);

  // Filter authorized escalation recipients strictly adhering to TaskFlow hierarchy:
  // Dropdown must display ONLY the logged-in user's dynamic immediate reporting manager.
  // Super Admin has no higher authority (returns empty array).
  // If user has no reporting manager, returns empty array (no automatic Super Admin / Manager fallback).
  const authorizedEscalationRecipients = useMemo(() => {
    if (!currentUser) return [];
    const myId = (currentUser._id?.toString() || currentUser.id?.toString() || '').trim();
    const myRoles = Array.isArray(currentUser.roles) && currentUser.roles.length > 0 ? currentUser.roles : [currentUser.role || 'User'];
    const myIsSuperAdmin = myRoles.some((r) => r === 'Super Admin' || r === 'superadmin') || currentUser.role === 'Super Admin';

    // Super Admin is the top-level authority: has no parent authority
    if (myIsSuperAdmin) {
      return [];
    }

    // Direct reporting manager resolution
    const repId = currentUser.reportsTo
      ? (currentUser.reportsTo._id ? currentUser.reportsTo._id.toString() : currentUser.reportsTo.toString()).trim()
      : '';
    const cleanRepName = (currentUser.reportsToName || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();

    // Use assignableUsers (complete directory) or fallback to users
    const candidateList = (assignableUsers && assignableUsers.length > 0) ? assignableUsers : (users || []);
    if (!candidateList || candidateList.length === 0) return [];

    let directMgr = null;

    // 1. Resolve via reportsTo ID
    if (repId && repId !== myId) {
      directMgr = candidateList.find((u) => {
        const uId = (u._id?.toString() || u.id?.toString() || '').trim();
        return uId === repId && u.status !== 'Inactive' && u.status !== 'Suspended';
      });
    }

    // 2. Resolve via reportsToName string
    if (!directMgr && cleanRepName) {
      directMgr = candidateList.find((u) => {
        const uId = (u._id?.toString() || u.id?.toString() || '').trim();
        if (uId === myId) return false;
        const uName = (u.name || '').toLowerCase().trim();
        const uUsername = (u.username || '').toLowerCase().trim();
        return (uName === cleanRepName || uUsername === cleanRepName) && u.status !== 'Inactive' && u.status !== 'Suspended';
      });
    }

    // STRICT: If user has no reporting manager, show no eligible authority.
    // Do NOT fall back to Super Admin or any arbitrary Manager.
    if (!directMgr) {
      return [];
    }

    // Return strictly the single immediate reporting manager
    return [
      {
        ...directMgr,
        _id: directMgr._id?.toString() || directMgr.id?.toString(),
        isDirectManager: true,
      },
    ];
  }, [currentUser, assignableUsers, users]);

  // Tab 2: Activity & Follow-up State (Modern Quick Composer)
  const [composerType, setComposerType] = useState('Call Log'); // 'Call Log' | 'Email' | 'Note' | 'Internal Note' | 'Follow-up'
  const [composerContent, setComposerContent] = useState('');
  const [composerSubject, setComposerSubject] = useState('');
  const [showSubjectInput, setShowSubjectInput] = useState(false);
  const [showTimeOverride, setShowTimeOverride] = useState(false);
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [customTime, setCustomTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  const [followUpType, setFollowUpType] = useState('Call'); // 'Call' | 'Email' | 'Meeting' | 'Review' | 'Other'
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [followUpAssignee, setFollowUpAssignee] = useState('');
  const [submittingComposer, setSubmittingComposer] = useState(false);

  // Activity Feed Filter
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'followups' | 'internal'

  // Dynamic Follow-up Status Helper (Calculates Overdue dynamically based on scheduled date/time)
  const getFollowUpStatus = useCallback((act) => {
    if (!act) return 'Pending';
    if (act.followUpStatus === 'Completed') return 'Completed';
    if (act.followUpStatus === 'Cancelled') return 'Cancelled';

    if (act.nextFollowUpDate) {
      const today = new Date().toISOString().slice(0, 10);
      if (act.nextFollowUpDate < today) {
        return 'Overdue';
      }
      if (act.nextFollowUpDate === today && act.nextFollowUpTime) {
        const d = new Date();
        const curH = d.getHours();
        const curM = d.getMinutes();
        const curTimeStr = `${String(curH).padStart(2, '0')}:${String(curM).padStart(2, '0')}`;
        if (act.nextFollowUpTime < curTimeStr) {
          return 'Overdue';
        }
      }
    }
    return act.followUpStatus || 'Pending';
  }, []);

  // Tab 3: Investigation & CAPA Form State
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [preventiveAction, setPreventiveAction] = useState('');
  const [capaActionOwner, setCapaActionOwner] = useState('');
  const [capaTargetDate, setCapaTargetDate] = useState('');
  const [capaVerificationNotes, setCapaVerificationNotes] = useState('');
  const [capaVerificationStatus, setCapaVerificationStatus] = useState('Pending');
  const [fiveWhys, setFiveWhys] = useState(['', '', '', '', '']);
  const [showFiveWhys, setShowFiveWhys] = useState(false);
  const [savingInvestigation, setSavingInvestigation] = useState(false);

  // Tab 4: Resolution & CSAT State
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionCode, setResolutionCode] = useState('Bug Fixed');
  const [showInlineResolveForm, setShowInlineResolveForm] = useState(false);
  const [submittingResolve, setSubmittingResolve] = useState(false);

  // CSAT Rating State
  const [csatRating, setCsatRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [csatFeedback, setCsatFeedback] = useState('');
  const [submittingCsat, setSubmittingCsat] = useState(false);

  // Tab 5: Related Records State
  const [relatedData, setRelatedData] = useState({
    relatedComplaints: [],
    relatedTasks: [],
    linkedOpportunity: null,
    linkedProject: null,
    suggestedArticles: [],
    knowledgeBaseArticle: null,
  });
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [kbSearchQuery, setKbSearchQuery] = useState('');
  const [customKbTitle, setCustomKbTitle] = useState('');
  const [customKbUrl, setCustomKbUrl] = useState('');
  const [linkingKb, setLinkingKb] = useState(false);

  // Action Modals State
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignUser, setReassignUser] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [submittingReassign, setSubmittingReassign] = useState(false);

  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateTo, setEscalateTo] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [submittingEscalate, setSubmittingEscalate] = useState(false);
  const [escalateValidationError, setEscalateValidationError] = useState('');
  const [backendRecipients, setBackendRecipients] = useState(null);
  const [escalationSuccessToast, setEscalationSuccessToast] = useState(null);

  // Auto-dismiss escalation success toast after 6 seconds
  useEffect(() => {
    if (escalationSuccessToast) {
      const timer = setTimeout(() => {
        setEscalationSuccessToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [escalationSuccessToast]);

  // Sync immediate escalation recipient with backend API
  useEffect(() => {
    let isMounted = true;
    if (getEscalationRecipients) {
      getEscalationRecipients()
        .then((res) => {
          if (isMounted && res && res.success && Array.isArray(res.recipients)) {
            setBackendRecipients(res.recipients);
          }
        })
        .catch((err) => {
          console.warn('[ComplaintDetailModal] getEscalationRecipients fallback to local hierarchy:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [getEscalationRecipients, showEscalateModal]);

  const activeEscalationRecipients = useMemo(() => {
    const list = backendRecipients !== null ? backendRecipients : authorizedEscalationRecipients;
    if (!Array.isArray(list) || list.length === 0) return [];
    // Strict safeguard: Dropdown must contain ONLY the single immediate reporting manager
    return [list[0]];
  }, [backendRecipients, authorizedEscalationRecipients]);

  // Auto-suggest immediate reporting manager when opening escalate modal
  useEffect(() => {
    if (showEscalateModal) {
      setEscalateValidationError('');
      if (activeEscalationRecipients.length > 0) {
        const defaultChoice = activeEscalationRecipients.find((r) => r.isDirectManager) || activeEscalationRecipients[0];
        if (defaultChoice) {
          setEscalateTo(defaultChoice._id?.toString() || defaultChoice.id?.toString() || '');
        }
      } else {
        setEscalateTo('');
      }
    }
  }, [showEscalateModal, activeEscalationRecipients]);

  const selectedEscalateRecipient = useMemo(() => {
    return (
      activeEscalationRecipients.find(
        (r) => (r._id?.toString() || r.id?.toString()) === escalateTo
      ) || null
    );
  }, [activeEscalationRecipients, escalateTo]);

  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [submittingReopen, setSubmittingReopen] = useState(false);

  // Sync form states with complaint when complaint prop changes
  useEffect(() => {
    if (complaint) {
      setInvestigationNotes(complaint.investigationNotes || '');
      setRootCause(complaint.rootCause || '');
      setCorrectiveAction(complaint.correctiveAction || '');
      setPreventiveAction(complaint.preventiveAction || '');
      setCapaActionOwner(complaint.capaActionOwner || complaint.assignedToName || '');
      setCapaTargetDate(
        complaint.capaTargetDate
          ? new Date(complaint.capaTargetDate).toISOString().split('T')[0]
          : ''
      );
      setCapaVerificationNotes(complaint.capaVerificationNotes || '');
      setCapaVerificationStatus(complaint.capaVerificationStatus || 'Pending');

      if (Array.isArray(complaint.fiveWhys) && complaint.fiveWhys.length > 0) {
        const fw = [...complaint.fiveWhys];
        while (fw.length < 5) fw.push('');
        setFiveWhys(fw);
        setShowFiveWhys(fw.some((w) => w && w.trim().length > 0));
      } else {
        setFiveWhys(['', '', '', '', '']);
      }

      setResolutionSummary(complaint.resolutionSummary || '');
      setResolutionNotes(complaint.resolutionNotes || '');
      setResolutionCode(complaint.resolutionCode || 'Bug Fixed');

      setCsatRating(complaint.csatRating || 5);
      setCsatFeedback(complaint.csatFeedback || '');

      setReassignUser(complaint.assignedToName || 'Unassigned');
      setFollowUpAssignee(complaint.assignedToName || currentUser?.name || '');
    }
  }, [complaint, currentUser]);

  // Skill, Location & Live Availability Aware Ranked Assignees for Smart Reassignment
  const rankedAssignees = useMemo(() => {
    return getRankedAssignees(authorizedUsers, complaint?.category, complaint?.location, allComplaints);
  }, [authorizedUsers, complaint?.category, complaint?.location, allComplaints]);

  // Live availability for currently assigned owner
  const assignedOwnerUser = useMemo(() => {
    if (!complaint?.assignedToName || complaint.assignedToName === 'Unassigned') return null;
    return (users || []).find((u) => u.name === complaint.assignedToName || (complaint.assignedTo && u._id === complaint.assignedTo));
  }, [complaint, users]);

  const assignedOwnerAvailability = useMemo(() => {
    if (!assignedOwnerUser) return null;
    return getUserAvailability(assignedOwnerUser, allComplaints);
  }, [assignedOwnerUser, allComplaints]);

  const recommendedAssignees = useMemo(() => {
    return rankedAssignees.filter((r) => r.isRecommended);
  }, [rankedAssignees]);

  const otherAssignees = useMemo(() => {
    return rankedAssignees.filter((r) => !r.isRecommended);
  }, [rankedAssignees]);

  const selectedAssigneeInfo = useMemo(() => {
    if (!reassignUser || reassignUser === 'Unassigned') return null;
    return rankedAssignees.find((r) => r.user.name === reassignUser) || null;
  }, [rankedAssignees, reassignUser]);

  // Filter scheduled follow-ups from activities
  const scheduledFollowUps = useMemo(() => {
    if (!complaint) return [];
    const acts = complaint.activities || [];
    return acts.filter((a) => a.type === 'Follow-up' || Boolean(a.nextFollowUpDate));
  }, [complaint?.activities]);

  // Active / Actionable follow-ups requiring attention
  const pendingFollowUps = useMemo(() => {
    return scheduledFollowUps.filter((a) => {
      const status = getFollowUpStatus(a);
      return status !== 'Completed' && status !== 'Cancelled';
    });
  }, [scheduledFollowUps, getFollowUpStatus]);

  // Filter activities for feed display
  const filteredActivities = useMemo(() => {
    const list = complaint?.activities || [];
    if (feedFilter === 'followups') {
      return list.filter((a) => a.type === 'Follow-up' || Boolean(a.nextFollowUpDate));
    }
    if (feedFilter === 'internal') {
      return list.filter((a) => a.isInternal || a.type === 'Internal Note');
    }
    return list;
  }, [complaint?.activities, feedFilter]);

  const internalActivitiesCount = useMemo(() => {
    return (complaint?.activities || []).filter((a) => a.isInternal || a.type === 'Internal Note').length;
  }, [complaint?.activities]);

  if (!isOpen || !complaint) return null;

  const isResolved = ['Resolved', 'Closed'].includes(complaint.status);
  const isClosed = complaint.status === 'Closed';

  // Format SLA Remaining
  const formatSlaRemaining = (deadlineStr, status, isPaused, slaStatus, resolvedAt) => {
    if (['Resolved', 'Closed'].includes(status)) {
      const isBreached = slaStatus === 'Breached' || (resolvedAt && deadlineStr && new Date(resolvedAt) > new Date(deadlineStr));
      if (isBreached) {
        return { text: 'Resolved – Breached SLA', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: <AlertTriangle size={14} /> };
      }
      return { text: 'SLA Met & Delivered', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: <CheckCircle2 size={14} /> };
    }
    if (status === 'Awaiting Customer' || isPaused) {
      return { text: 'SLA Paused (Customer Action Pending)', color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', icon: <Clock size={14} /> };
    }
    if (!deadlineStr) return { text: 'Standard 24h SLA', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', icon: <Clock size={14} /> };

    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const hours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffMs < 0 || slaStatus === 'Breached') {
      const overdueHours = Math.abs(hours);
      return {
        text: `SLA Breached (${overdueHours}h Overdue)`,
        color: '#dc2626',
        bg: '#fef2f2',
        border: '#fecaca',
        icon: <AlertTriangle size={14} />,
      };
    } else if (hours <= 4 || slaStatus === 'At Risk') {
      return {
        text: `At Risk (${hours}h remaining)`,
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a',
        icon: <Flame size={14} />,
      };
    }
    return {
      text: `On Track (${hours}h remaining)`,
      color: '#0284c7',
      bg: '#f0f9ff',
      border: '#bae6fd',
      icon: <Clock size={14} />,
    };
  };

  const slaInfo = formatSlaRemaining(complaint.slaDeadline, complaint.status, complaint.isPaused, complaint.slaStatus, complaint.resolvedAt);

  // Priority Styles
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Urgent':
        return { color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' };
      case 'High':
        return { color: '#ea580c', bg: '#ffedd5', border: '#fdba74' };
      case 'Medium':
        return { color: '#d97706', bg: '#fef3c7', border: '#fcd34d' };
      default:
        return { color: '#16a34a', bg: '#dcfce7', border: '#86efac' };
    }
  };

  // Status Styles
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Resolved':
        return { color: '#16a34a', bg: '#dcfce7', border: '#86efac' };
      case 'Closed':
        return { color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' };
      case 'Escalated':
        return { color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' };
      case 'Under Investigation':
      case 'In Progress':
        return { color: '#2563eb', bg: '#dbeafe', border: '#93c5fd' };
      case 'Reopened':
        return { color: '#7e22ce', bg: '#f3e8ff', border: '#d8b4fe' };
      default:
        return { color: '#475569', bg: '#f8fafc', border: '#e2e8f0' };
    }
  };

  const pStyle = getPriorityStyle(complaint.priority);
  const sStyle = getStatusStyle(complaint.status);

  // Modern Unified Composer Submit Handler
  const handleComposerSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!composerContent.trim() && !composerSubject.trim()) {
      alert('Please enter notes or details for this interaction.');
      return;
    }

    const isFollowUp = composerType === 'Follow-up';
    if (isFollowUp) {
      if (!followUpDate) {
        alert('Please select a Follow-up Date.');
        return;
      }
      if (followUpDate < todayDateStr) {
        alert('Follow-up Date cannot be in the past. Please select today or a future date.');
        return;
      }
    }

    try {
      setSubmittingComposer(true);
      const isInternal = composerType === 'Internal Note';

      // Auto-generate clean, readable subject if user did not provide custom one
      let resolvedSubject = composerSubject.trim();
      if (!resolvedSubject) {
        if (isFollowUp) {
          resolvedSubject = `${followUpType} Follow-up`;
        } else if (composerType === 'Call Log') {
          resolvedSubject = 'Call with customer';
        } else if (composerType === 'Email') {
          resolvedSubject = 'Customer Email Correspondence';
        } else if (composerType === 'Internal Note') {
          resolvedSubject = 'Internal Staff Note';
        } else {
          resolvedSubject = 'Ticket Activity Note';
        }
      }

      const payload = {
        type: composerType,
        subject: resolvedSubject,
        content: composerContent.trim() || resolvedSubject,
        date: showTimeOverride ? customDate : new Date().toISOString().slice(0, 10),
        time: showTimeOverride
          ? customTime
          : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isInternal,
        followUpStatus: isFollowUp ? 'Pending' : 'N/A',
      };

      if (isFollowUp) {
        payload.outcome = `Type: ${followUpType}`;
        payload.nextFollowUpDate = followUpDate;
        payload.nextFollowUpTime = followUpTime || '';
        payload.assignedEmployee = followUpAssignee || complaint.assignedToName || currentUser?.name || 'Unassigned';
        const targetUserObj = authorizedUsers.find((u) => u.name === payload.assignedEmployee);
        if (targetUserObj) {
          payload.assignedEmployeeId = targetUserObj._id?.toString() || targetUserObj.id?.toString();
        }
      }

      await addActivity(complaint._id, payload);

      // Clean up composer form state
      setComposerContent('');
      setComposerSubject('');
      setShowSubjectInput(false);
      setShowTimeOverride(false);
      if (isFollowUp) {
        setFollowUpDate('');
      }
    } catch (err) {
      alert('Failed to log activity: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingComposer(false);
    }
  };

  // Handle Follow-up Status Transitions (Completed, Pending, Cancelled)
  const handleUpdateFollowUpStatus = async (act, targetStatus) => {
    if (!act.activityId) return;

    try {
      await updateFollowUpStatus(complaint._id, act.activityId, {
        status: targetStatus,
        completionNotes:
          targetStatus === 'Completed'
            ? `Marked Completed by ${currentUser?.name || 'Staff'}`
            : targetStatus === 'Cancelled'
            ? `Cancelled by ${currentUser?.name || 'Staff'}`
            : `Reopened by ${currentUser?.name || 'Staff'}`,
      });
    } catch (err) {
      alert('Failed to update follow-up status: ' + (err.response?.data?.message || err.message));
    }
  };

  // Handle Save Investigation & CAPA
  const handleSaveInvestigation = async () => {
    if (capaTargetDate && capaTargetDate < todayDateStr) {
      alert('CAPA Target Completion Date cannot be in the past. Please select today or a future date.');
      return;
    }

    try {
      setSavingInvestigation(true);
      await investigateComplaint(complaint._id, {
        investigationNotes,
        rootCause,
        correctiveAction,
        preventiveAction,
        capaActionOwner,
        capaTargetDate: capaTargetDate || null,
        capaVerificationNotes,
        capaVerificationStatus,
        fiveWhys: fiveWhys.filter((w) => w && w.trim().length > 0),
      });
      alert('Investigation & CAPA details saved successfully.');
    } catch (err) {
      alert('Failed to save investigation details: ' + err.message);
    } finally {
      setSavingInvestigation(false);
    }
  };

  // Handle Resolve Ticket
  const handleExecuteResolve = async () => {
    if (!resolutionSummary.trim() && !resolutionNotes.trim()) {
      alert('Please provide a Resolution Summary or Notes before marking as resolved.');
      return;
    }

    try {
      setSubmittingResolve(true);
      await resolveComplaint(complaint._id, {
        resolutionSummary: resolutionSummary.trim(),
        resolutionNotes: resolutionNotes.trim() || resolutionSummary.trim(),
        resolutionCode,
        rootCause: rootCause.trim(),
        correctiveAction: correctiveAction.trim(),
        preventiveAction: preventiveAction.trim(),
      });
      setShowInlineResolveForm(false);
      alert('Ticket marked as Resolved successfully.');
    } catch (err) {
      alert('Failed to resolve ticket: ' + err.message);
    } finally {
      setSubmittingResolve(false);
    }
  };

  // Handle CSAT Submission
  const handleSubmitCsatRating = async () => {
    try {
      setSubmittingCsat(true);
      await submitCsat(complaint._id, {
        csatRating: Number(csatRating),
        csatFeedback: csatFeedback.trim(),
      });
      alert('Customer CSAT feedback recorded successfully.');
    } catch (err) {
      alert('Failed to record CSAT feedback: ' + err.message);
    } finally {
      setSubmittingCsat(false);
    }
  };

  // Handle Reassign
  const handleExecuteReassign = async () => {
    if (!reassignUser || reassignUser === 'Unassigned') {
      alert('Please select a valid user to assign.');
      return;
    }
    const targetUser = authorizedUsers.find((u) => u.name === reassignUser);
    try {
      setSubmittingReassign(true);
      await assignComplaint(complaint._id, {
        assignedTo: targetUser ? targetUser._id : null,
        assignedToName: reassignUser,
        reason: reassignReason || 'Reassigned via Complaint 360 Console',
      });
      setShowReassignModal(false);
      setReassignReason('');
    } catch (err) {
      alert('Failed to reassign: ' + err.message);
    } finally {
      setSubmittingReassign(false);
    }
  };

  // Handle Escalate
  const handleExecuteEscalate = async () => {
    setEscalateValidationError('');

    if (activeEscalationRecipients.length === 0) {
      setEscalateValidationError('No eligible immediate reporting manager exists for your role (Super Admin is the top-level authority).');
      return;
    }

    if (!escalateTo) {
      setEscalateValidationError('Please select your immediate reporting manager to escalate this ticket to.');
      return;
    }

    if (!escalateReason.trim()) {
      setEscalateValidationError('Escalation reason / justification is mandatory. Please explain why this ticket requires escalation.');
      return;
    }

    const selectedRecipient = activeEscalationRecipients.find(
      (r) => (r._id?.toString() || r.id?.toString()) === escalateTo
    );

    if (!selectedRecipient) {
      setEscalateValidationError('Hierarchy Permission Denied: Selected recipient is not your authorized immediate reporting manager.');
      return;
    }

    try {
      setSubmittingEscalate(true);
      await escalateComplaint(complaint._id, {
        escalatedTo: selectedRecipient.name,
        escalatedToId: selectedRecipient._id || selectedRecipient.id,
        escalatedToName: selectedRecipient.name,
        escalatedToRole: selectedRecipient.role,
        escalationReason: escalateReason.trim(),
      });
      setShowEscalateModal(false);
      setEscalateReason('');
      setEscalateTo('');
      
      const toastData = {
        title: 'Complaint Successfully Escalated',
        message: `Complaint ${complaint.ticketNumber} has been successfully escalated to ${selectedRecipient.name} (Immediate Reporting Manager). The recipient has been notified.`,
        ticketNumber: complaint.ticketNumber,
        escalatedTo: selectedRecipient.name,
      };
      setEscalationSuccessToast(toastData);
      if (showLiveToast) {
        showLiveToast({
          title: toastData.title,
          message: toastData.message,
          type: 'success_alert',
        });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Escalation failed. Please verify hierarchy permissions.';
      setEscalateValidationError(errMsg);
    } finally {
      setSubmittingEscalate(false);
    }
  };

  // Handle Reopen
  const handleExecuteReopen = async () => {
    if (!reopenReason.trim()) {
      alert('Please specify a reason for reopening this ticket.');
      return;
    }
    try {
      setSubmittingReopen(true);
      await reopenComplaint(complaint._id, {
        reopenReason: reopenReason.trim(),
      });
      setShowReopenModal(false);
      setReopenReason('');
    } catch (err) {
      alert('Failed to reopen: ' + err.message);
    } finally {
      setSubmittingReopen(false);
    }
  };

  // Handle Close Ticket
  const handleExecuteClose = async () => {
    const reason = window.prompt(
      `Enter closure reason for ticket ${complaint.ticketNumber}:`,
      'Resolved to Satisfaction'
    );
    if (reason !== null) {
      try {
        await closeComplaint(complaint._id, { closureReason: reason || 'Resolved to Satisfaction' });
      } catch (err) {
        alert('Failed to close ticket: ' + err.message);
      }
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .hide-scroll::-webkit-scrollbar {
          height: 4px;
        }
        .hide-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        /* Mode Switcher Tabs */
        .act-mode-toggle {
          display: inline-flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          gap: 4px;
          width: fit-content;
          max-width: 100%;
          box-sizing: border-box;
        }
        .act-mode-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          box-sizing: border-box;
        }
        .act-mode-btn:hover {
          color: #0f172a;
          background: rgba(255, 255, 255, 0.6);
        }
        .act-mode-btn.active {
          background: #ffffff;
          color: #2563eb;
          font-weight: 700;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        /* Modern Quick Pill Selector */
        .act-pill-selector {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .act-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #475569;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          user-select: none;
        }
        .act-pill-btn:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
          color: #0f172a;
        }
        .act-pill-btn.active-call {
          background: #eff6ff;
          border-color: #93c5fd;
          color: #1d4ed8;
          font-weight: 700;
          box-shadow: 0 1px 2px rgba(37, 99, 235, 0.12);
        }
        .act-pill-btn.active-email {
          background: #f0fdf4;
          border-color: #86efac;
          color: #15803d;
          font-weight: 700;
          box-shadow: 0 1px 2px rgba(22, 163, 74, 0.12);
        }
        .act-pill-btn.active-note {
          background: #f8fafc;
          border-color: #94a3b8;
          color: #0f172a;
          font-weight: 700;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        }
        .act-pill-btn.active-internal {
          background: #fef3c7;
          border-color: #fcd34d;
          color: #b45309;
          font-weight: 700;
          box-shadow: 0 1px 2px rgba(217, 119, 6, 0.12);
        }
        .act-pill-btn.active-followup {
          background: #f5f3ff;
          border-color: #c4b5fd;
          color: #6d28d9;
          font-weight: 700;
          box-shadow: 0 1px 2px rgba(124, 58, 237, 0.12);
        }
        .act-subtle-link {
          background: none;
          border: none;
          color: #2563eb;
          font-size: 0.76rem;
          font-weight: 600;
          cursor: pointer;
          padding: 3px 6px;
          border-radius: 4px;
          transition: background 0.15s ease;
        }
        .act-subtle-link:hover {
          background: #eff6ff;
        }
        .act-submit-btn {
          padding: 8px 18px;
          border-radius: 8px;
          border: none;
          color: #ffffff;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
        }
        .act-submit-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .act-followup-schedule-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          background: #faf5ff;
          border: 1px solid #e9d5ff;
          border-radius: 10px;
          padding: 10px 12px;
          box-sizing: border-box;
          width: 100%;
        }
        @media (max-width: 640px) {
          .act-followup-schedule-row {
            grid-template-columns: 1fr;
          }
        }

        /* Activity Form Container */
        .act-form-container {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        /* Responsive Form Grids */
        .act-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          width: 100%;
          box-sizing: border-box;
        }
        .act-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          width: 100%;
          box-sizing: border-box;
        }
        .act-field-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .act-field-label {
          font-size: 0.74rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .act-input, .act-select, .act-textarea {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
          padding: 9px 12px !important;
          border-radius: 8px !important;
          border: 1px solid #cbd5e1 !important;
          font-size: 0.84rem !important;
          background: #ffffff !important;
          color: #0f172a !important;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .act-input:focus, .act-select:focus, .act-textarea:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
        }
        .act-select {
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }

        @media (max-width: 800px) {
          .act-grid-3 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 600px) {
          .act-mode-toggle {
            width: 100%;
            display: flex;
          }
          .act-mode-btn {
            flex: 1;
            justify-content: center;
            padding: 8px 10px;
            font-size: 0.78rem;
          }
          .act-grid-3, .act-grid-2 {
            grid-template-columns: 1fr !important;
          }
          .act-form-container {
            padding: 12px 14px;
          }
        }
        @media (max-width: 640px) {
          .responsive-two-col {
            grid-template-columns: 1fr !important;
          }
          .responsive-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .responsive-footer {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .responsive-footer > div {
            width: 100% !important;
            justify-content: flex-end !important;
            flex-wrap: wrap !important;
          }
        }
      `}</style>

      <div
        className="modal-container-modern"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '94vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* HEADER SECTION */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #f8fafc, #ffffff)',
            borderRadius: '20px 20px 0 0',
            flexShrink: 0,
            gap: '12px',
          }}
          className="responsive-header"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: complaint.severity === 'Critical' ? '#fee2e2' : '#eff6ff',
                color: complaint.severity === 'Critical' ? '#dc2626' : '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                flexShrink: 0,
              }}
            >
              {complaint.severity === 'Critical' ? <AlertCircle size={22} /> : <FileText size={22} />}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {complaint.ticketNumber}
                </span>
                <span
                  style={{
                    background: pStyle.bg,
                    color: pStyle.color,
                    border: `1px solid ${pStyle.border}`,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {complaint.priority} Priority
                </span>
                <span
                  style={{
                    background: complaint.severity === 'Critical' ? '#fee2e2' : '#f1f5f9',
                    color: complaint.severity === 'Critical' ? '#dc2626' : '#475569',
                    border: `1px solid ${complaint.severity === 'Critical' ? '#fca5a5' : '#e2e8f0'}`,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {complaint.severity || 'Moderate'} Severity
                </span>
                <span
                  style={{
                    background: sStyle.bg,
                    color: sStyle.color,
                    border: `1px solid ${sStyle.border}`,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {complaint.status}
                </span>
              </div>
              <h2
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: '4px 0 0 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '560px',
                }}
                title={complaint.subject}
              >
                {complaint.subject}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              id="btn-close-complaint-detail-modal"
              onClick={onClose}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fee2e2';
                e.currentTarget.style.color = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.color = '#64748b';
              }}
              title="Close Modal (Done)"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* QUICK SLA STATUS STRIP */}
        <div
          style={{
            padding: '10px 24px',
            background: slaInfo.bg,
            borderBottom: `1px solid ${slaInfo.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: slaInfo.color, fontWeight: 700, fontSize: '0.84rem' }}>
            {slaInfo.icon}
            <span>{slaInfo.text}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap' }}>
            <span>
              Target: <strong>{complaint.slaHours || 24}h Window</strong>
            </span>
            <span>
              Assignee: <strong style={{ color: '#2563eb' }}>{complaint.assignedToName || 'Unassigned'}</strong>
            </span>
            <span>
              Team: <strong>{complaint.team || 'Support'}</strong>
            </span>
          </div>
        </div>

        {/* 360 TABS NAVIGATION */}
        <div
          className="hide-scroll"
          style={{
            padding: '0 24px',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          {[
            { id: 'overview', label: 'Overview & Details', icon: <FileText size={15} /> },
            { id: 'activities', label: `Activities & Follow-ups (${(complaint.activities || []).length})`, icon: <Activity size={15} /> },
            { id: 'resolution', label: 'Resolution & CSAT', icon: <CheckCircle2 size={15} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 14px',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                color: activeTab === tab.id ? '#2563eb' : '#64748b',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
          {/* TAB 1: OVERVIEW & DETAILS */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Customer & Account Info Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '14px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Customer Name
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {complaint.customerName}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Organization / Account
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#334155', marginTop: '2px' }}>
                    {complaint.organization || complaint.account || 'Direct Customer'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Email Address
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#2563eb', marginTop: '2px' }}>
                    {complaint.customerEmail || '—'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Contact Phone
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#334155', marginTop: '2px' }}>
                    {complaint.customerPhone || '—'}
                  </div>
                </div>
              </div>

              {/* Description Box */}
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Issue Description
                </h4>
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '16px',
                    color: '#1e293b',
                    fontSize: '0.92rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {complaint.description}
                </div>
              </div>

              {/* Metadata Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block' }}>CATEGORY</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>{complaint.category}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>{complaint.subCategory || 'General'}</span>
                </div>

                <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block' }}>PRODUCT / SERVICE</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>{complaint.productOrService || 'CRM'}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Channel: {complaint.source || 'Web Portal'}</span>
                </div>

                <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block' }}>ASSIGNED TO</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#2563eb' }}>
                      {complaint.assignedToName || 'Unassigned'}
                    </span>
                    {assignedOwnerAvailability && (
                      <span
                        title={assignedOwnerAvailability.etaText}
                        style={{
                          fontSize: '0.68rem',
                          padding: '2px 7px',
                          borderRadius: '999px',
                          fontWeight: 700,
                          backgroundColor: assignedOwnerAvailability.bgColor,
                          color: assignedOwnerAvailability.color,
                          border: `1px solid ${assignedOwnerAvailability.borderColor}`,
                        }}
                      >
                        {assignedOwnerAvailability.shortBadge}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Team: {complaint.team || 'Support'}</span>
                </div>

                <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block' }}>ACTIVE FOLLOW-UP</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                    {complaint.nextFollowUpDate ? new Date(complaint.nextFollowUpDate).toLocaleDateString() : 'None Scheduled'}
                  </span>
                  {complaint.nextFollowUpTime && (
                    <span style={{ fontSize: '0.75rem', color: '#d97706', display: 'block' }}>
                      Time: {complaint.nextFollowUpTime} ({complaint.nextFollowUpStatus || 'Pending'})
                    </span>
                  )}
                </div>
              </div>

              {/* Attachments & Screenshots Display */}
              {Array.isArray(complaint.attachments) && complaint.attachments.length > 0 && (
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Paperclip size={16} color="#2563eb" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Attached Files & Evidence ({complaint.attachments.length})
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Uploaded by Submitter
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    {complaint.attachments.map((file, idx) => {
                      const isImg = file.type?.startsWith('image/') || file.dataUrl?.startsWith('data:image/');
                      return (
                        <div
                          key={idx}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            background: '#f8fafc',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                          }}
                        >
                          {isImg ? (
                            <div
                              style={{
                                height: '110px',
                                background: '#f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                cursor: 'pointer',
                              }}
                              onClick={() => {
                                const w = window.open('');
                                if (w) {
                                  w.document.write(`<img src="${file.dataUrl}" style="max-width:100%;height:auto;" />`);
                                }
                              }}
                              title="Click to view full image"
                            >
                              <img
                                src={file.dataUrl}
                                alt={file.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          ) : (
                            <div
                              style={{
                                height: '110px',
                                background: '#fef2f2',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                color: '#dc2626',
                              }}
                            >
                              <FileText size={32} />
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                PDF Document
                              </span>
                            </div>
                          )}

                          <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  color: '#0f172a',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                                title={file.name}
                              >
                                {file.name}
                              </p>
                              <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                {file.size ? (file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`) : ''}
                              </span>
                            </div>

                            {file.dataUrl && (
                              <a
                                href={file.dataUrl}
                                download={file.name}
                                style={{
                                  padding: '5px',
                                  borderRadius: '6px',
                                  background: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  color: '#2563eb',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  textDecoration: 'none',
                                }}
                                title="Download File"
                              >
                                <Download size={13} />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Resolution Details Summary Card (Visible when resolved/closed) */}
              {isResolved && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={18} color="#16a34a" />
                      <strong style={{ fontSize: '0.92rem', color: '#166534' }}>
                        Resolution Details ({complaint.resolutionCode || 'Resolved'})
                      </strong>
                    </div>
                    {complaint.resolvedAt && (
                      <span style={{ fontSize: '0.76rem', color: '#15803d', fontWeight: 600 }}>
                        Resolved on {new Date(complaint.resolvedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#14532d', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {complaint.resolutionSummary || complaint.resolutionNotes || 'Complaint marked as resolved.'}
                  </p>
                  {complaint.closureReason && (
                    <div style={{ fontSize: '0.78rem', color: '#15803d', paddingTop: '6px', borderTop: '1px dashed #bbf7d0', marginTop: '2px' }}>
                      Closure Reason: <strong>{complaint.closureReason}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACTIVITIES & FOLLOW-UPS */}
          {activeTab === 'activities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={18} color="#2563eb" />
                    <span>Activities & Follow-ups</span>
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Log completed customer interactions or schedule follow-up reminders
                  </span>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  Acting as <strong style={{ color: '#0f172a' }}>{currentUser?.name || 'Staff'}</strong>
                </span>
              </div>

              {/* SECTION 1: Pinned Actionable Follow-up Alerts (Only rendered when there are pending/overdue follow-ups) */}
              {pendingFollowUps.length > 0 && (
                <div
                  style={{
                    background: '#f8faff',
                    border: '1.5px solid #bfdbfe',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#dbeafe',
                          color: '#1d4ed8',
                        }}
                      >
                        <Clock size={14} />
                      </span>
                      <strong style={{ fontSize: '0.86rem', color: '#1e3a8a' }}>
                        Upcoming Follow-up Actions ({pendingFollowUps.length})
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      Immediate reminders for this ticket
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pendingFollowUps.map((act) => {
                      const computedStatus = getFollowUpStatus(act);
                      const isOverdue = computedStatus === 'Overdue';
                      return (
                        <div
                          key={act.activityId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '10px',
                            background: '#ffffff',
                            border: `1px solid ${isOverdue ? '#fca5a5' : '#cbd5e1'}`,
                            borderRadius: '8px',
                            padding: '10px 14px',
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  background: isOverdue ? '#fee2e2' : '#fef3c7',
                                  color: isOverdue ? '#b91c1c' : '#b45309',
                                  border: `1px solid ${isOverdue ? '#fca5a5' : '#fde68a'}`,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                {isOverdue && <AlertTriangle size={11} />}
                                <span>{isOverdue ? 'Overdue Follow-up' : 'Scheduled'}</span>
                              </span>
                              <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>
                                {act.subject || 'Follow-up Reminder'}
                              </strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: '#64748b', flexWrap: 'wrap' }}>
                              <span>
                                Target: <strong style={{ color: isOverdue ? '#dc2626' : '#0f172a' }}>{act.nextFollowUpDate}</strong> {act.nextFollowUpTime && `at ${act.nextFollowUpTime}`}
                              </span>
                              <span>•</span>
                              <span>
                                Assigned: <strong style={{ color: '#0f172a' }}>{act.assignedEmployee || complaint.assignedToName || 'Unassigned'}</strong>
                              </span>
                              {act.content && (
                                <>
                                  <span>•</span>
                                  <span style={{ color: '#475569', fontStyle: 'italic', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    &ldquo;{act.content}&rdquo;
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleUpdateFollowUpStatus(act, 'Completed')}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#16a34a',
                                color: '#ffffff',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 1px 2px rgba(22, 163, 74, 0.2)',
                              }}
                              title="Mark as completed"
                            >
                              <Check size={12} />
                              <span>Mark Complete</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateFollowUpStatus(act, 'Cancelled')}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#dc2626',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              title="Cancel follow-up"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 2: Compact Quick-Pills Composer */}
              <form onSubmit={handleComposerSubmit} className="act-form-container" style={{ gap: '10px' }}>
                {/* Pill Type Selector */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div className="act-pill-selector">
                    <button
                      type="button"
                      className={`act-pill-btn ${composerType === 'Call Log' ? 'active-call' : ''}`}
                      onClick={() => setComposerType('Call Log')}
                    >
                      <PhoneOutgoing size={13} />
                      <span>Call Log</span>
                    </button>
                    <button
                      type="button"
                      className={`act-pill-btn ${composerType === 'Email' ? 'active-email' : ''}`}
                      onClick={() => setComposerType('Email')}
                    >
                      <Mail size={13} />
                      <span>Email</span>
                    </button>
                    <button
                      type="button"
                      className={`act-pill-btn ${composerType === 'Note' ? 'active-note' : ''}`}
                      onClick={() => setComposerType('Note')}
                    >
                      <MessageSquare size={13} />
                      <span>Note</span>
                    </button>
                    <button
                      type="button"
                      className={`act-pill-btn ${composerType === 'Internal Note' ? 'active-internal' : ''}`}
                      onClick={() => setComposerType('Internal Note')}
                    >
                      <Lock size={13} />
                      <span>Internal Note</span>
                    </button>
                    <button
                      type="button"
                      className={`act-pill-btn ${composerType === 'Follow-up' ? 'active-followup' : ''}`}
                      onClick={() => {
                        setComposerType('Follow-up');
                        if (!followUpAssignee) {
                          setFollowUpAssignee(complaint.assignedToName || currentUser?.name || '');
                        }
                      }}
                    >
                      <Calendar size={13} />
                      <span>Follow-up</span>
                    </button>
                  </div>
                </div>

                {/* Sub-context bar if Internal Note */}
                {composerType === 'Internal Note' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '0.75rem',
                      color: '#b45309',
                      fontWeight: 600,
                    }}
                  >
                    <Lock size={12} color="#d97706" />
                    <span>Internal Note: Visible strictly to staff & managers — never shared with customers.</span>
                  </div>
                )}

                {/* Sub-context scheduling row if Follow-up */}
                {composerType === 'Follow-up' && (
                  <div className="act-followup-schedule-row">
                    <div className="act-field-group">
                      <label className="act-field-label">Follow-up Date *</label>
                      <input
                        type="date"
                        min={todayDateStr}
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        required
                        className="act-input"
                      />
                    </div>
                    <div className="act-field-group">
                      <label className="act-field-label">Target Time (Optional)</label>
                      <input
                        type="time"
                        value={followUpTime}
                        onChange={(e) => setFollowUpTime(e.target.value)}
                        className="act-input"
                      />
                    </div>
                    <div className="act-field-group">
                      <label className="act-field-label">Assignee</label>
                      <select
                        value={followUpAssignee}
                        onChange={(e) => setFollowUpAssignee(e.target.value)}
                        className="act-select"
                      >
                        <option value="">Select Assignee ({authorizedUsers.length} available)</option>
                        {authorizedUsers.map((u) => (
                          <option key={u._id || u.id} value={u.name}>
                            {u.name} {u.role ? `(${u.role})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Optional Subject input (revealed if user requested or typed) */}
                {showSubjectInput && (
                  <div className="act-field-group">
                    <input
                      type="text"
                      placeholder={`Optional subject (e.g. ${composerType === 'Call Log' ? 'Call regarding billing invoice' : composerType === 'Follow-up' ? 'Check if patch deployed' : 'Summary'}...)`}
                      value={composerSubject}
                      onChange={(e) => setComposerSubject(e.target.value)}
                      className="act-input"
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                )}

                {/* Main Content Textarea */}
                <div className="act-field-group">
                  <textarea
                    rows={composerType === 'Follow-up' ? 2 : 3}
                    placeholder={
                      composerType === 'Call Log'
                        ? 'Record conversation summary, caller feedback, actions agreed...'
                        : composerType === 'Email'
                        ? 'Summarize email correspondence, queries addressed, or attachments sent...'
                        : composerType === 'Internal Note'
                        ? 'Enter internal engineering diagnosis, team handoff, or confidential remarks...'
                        : composerType === 'Follow-up'
                        ? 'Enter follow-up agenda or reminders to check with the customer...'
                        : 'Record activity details, investigation findings, or ticket updates...'
                    }
                    value={composerContent}
                    onChange={(e) => setComposerContent(e.target.value)}
                    required
                    className="act-textarea"
                  />
                </div>

                {/* Collapsible Date/Time override for backdating if requested */}
                {showTimeOverride && (
                  <div className="act-grid-2" style={{ background: '#f1f5f9', padding: '8px 10px', borderRadius: '8px' }}>
                    <div className="act-field-group">
                      <label className="act-field-label">Date Override</label>
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="act-input"
                      />
                    </div>
                    <div className="act-field-group">
                      <label className="act-field-label">Time Override</label>
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="act-input"
                      />
                    </div>
                  </div>
                )}

                {/* Bottom Bar: Action buttons and subtle toggles */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingTop: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {!showSubjectInput && (
                      <button
                        type="button"
                        onClick={() => setShowSubjectInput(true)}
                        className="act-subtle-link"
                      >
                        + Add Subject
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowTimeOverride(!showTimeOverride)}
                      className="act-subtle-link"
                      style={{ color: showTimeOverride ? '#2563eb' : '#64748b' }}
                    >
                      🕒 {showTimeOverride ? 'Reset to now' : 'Adjust date/time'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingComposer || !composerContent.trim() || (composerType === 'Follow-up' && !followUpDate)}
                    className="act-submit-btn"
                    style={{
                      background:
                        composerType === 'Internal Note'
                          ? '#d97706'
                          : composerType === 'Follow-up'
                          ? '#7c3aed'
                          : '#2563eb',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    {submittingComposer ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        {composerType === 'Call Log' && <PhoneOutgoing size={13} />}
                        {composerType === 'Email' && <Mail size={13} />}
                        {composerType === 'Note' && <Send size={13} />}
                        {composerType === 'Internal Note' && <Lock size={13} />}
                        {composerType === 'Follow-up' && <Calendar size={13} />}
                        <span>
                          {composerType === 'Call Log'
                            ? 'Log Call'
                            : composerType === 'Email'
                            ? 'Log Email'
                            : composerType === 'Note'
                            ? 'Save Note'
                            : composerType === 'Internal Note'
                            ? 'Save Internal Note'
                            : 'Schedule Follow-up'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* SECTION 3: Unified Activity Feed & Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Feed Filter Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <History size={16} color="#64748b" />
                    <h4 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      Interaction History ({(complaint.activities || []).length})
                    </h4>
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setFeedFilter('all')}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        border: '1px solid',
                        borderColor: feedFilter === 'all' ? '#2563eb' : '#e2e8f0',
                        background: feedFilter === 'all' ? '#eff6ff' : '#ffffff',
                        color: feedFilter === 'all' ? '#1d4ed8' : '#64748b',
                        fontSize: '0.74rem',
                        fontWeight: feedFilter === 'all' ? 700 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      All ({(complaint.activities || []).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedFilter('followups')}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        border: '1px solid',
                        borderColor: feedFilter === 'followups' ? '#7c3aed' : '#e2e8f0',
                        background: feedFilter === 'followups' ? '#f5f3ff' : '#ffffff',
                        color: feedFilter === 'followups' ? '#6d28d9' : '#64748b',
                        fontSize: '0.74rem',
                        fontWeight: feedFilter === 'followups' ? 700 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      Follow-ups ({scheduledFollowUps.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedFilter('internal')}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        border: '1px solid',
                        borderColor: feedFilter === 'internal' ? '#d97706' : '#e2e8f0',
                        background: feedFilter === 'internal' ? '#fef3c7' : '#ffffff',
                        color: feedFilter === 'internal' ? '#b45309' : '#64748b',
                        fontSize: '0.74rem',
                        fontWeight: feedFilter === 'internal' ? 700 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      Internal ({internalActivitiesCount})
                    </button>
                  </div>
                </div>

                {filteredActivities.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.84rem', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                    {feedFilter === 'followups'
                      ? 'No follow-up reminders recorded on this ticket.'
                      : feedFilter === 'internal'
                      ? 'No internal staff notes on this ticket.'
                      : 'No activities logged on this ticket yet.'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredActivities.map((act, idx) => {
                      const isInternal = act.isInternal || act.type === 'Internal Note';
                      const isFollowUp = act.type === 'Follow-up' || Boolean(act.nextFollowUpDate);
                      const isEmail = act.type === 'Email';
                      const isCall = act.type === 'Call Log' || act.type === 'Call';
                      const isEscalation = act.type === 'Escalation';
                      const isStatus = act.type === 'Status Change';

                      const computedStatus = isFollowUp ? getFollowUpStatus(act) : null;
                      const isComplete = computedStatus === 'Completed';
                      const isOverdue = computedStatus === 'Overdue';
                      const isCancelled = computedStatus === 'Cancelled';

                      let IconComponent = MessageSquare;
                      let badgeBg = '#f1f5f9';
                      let badgeColor = '#475569';
                      let cardBorder = '#e2e8f0';
                      let cardBg = '#ffffff';

                      if (isInternal) {
                        IconComponent = Lock;
                        badgeBg = '#fef3c7';
                        badgeColor = '#b45309';
                        cardBorder = '#fde68a';
                        cardBg = '#fffdf7';
                      } else if (isFollowUp) {
                        IconComponent = Calendar;
                        badgeBg = isComplete ? '#dcfce7' : isOverdue ? '#fee2e2' : '#f5f3ff';
                        badgeColor = isComplete ? '#15803d' : isOverdue ? '#dc2626' : '#6d28d9';
                        cardBorder = isComplete ? '#bbf7d0' : isOverdue ? '#fca5a5' : '#ddd6fe';
                        cardBg = isComplete ? '#fafffa' : isOverdue ? '#fffdfd' : '#faf5ff';
                      } else if (isCall) {
                        IconComponent = PhoneOutgoing;
                        badgeBg = '#eff6ff';
                        badgeColor = '#1d4ed8';
                      } else if (isEmail) {
                        IconComponent = Mail;
                        badgeBg = '#f0fdf4';
                        badgeColor = '#15803d';
                      } else if (isEscalation) {
                        IconComponent = Flame;
                        badgeBg = '#fee2e2';
                        badgeColor = '#dc2626';
                      } else if (isStatus) {
                        IconComponent = RotateCcw;
                        badgeBg = '#eff6ff';
                        badgeColor = '#2563eb';
                      }

                      return (
                        <div
                          key={act.activityId || idx}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: `1px solid ${cardBorder}`,
                            background: cardBg,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  background: badgeBg,
                                  color: badgeColor,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <IconComponent size={11} />
                                <span>{act.type || 'Activity'}</span>
                              </span>

                              {isInternal && (
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px' }}>
                                  🔒 Staff Only
                                </span>
                              )}

                              {isFollowUp && (
                                <span
                                  style={{
                                    padding: '2px 7px',
                                    borderRadius: '6px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    background: isComplete ? '#dcfce7' : isOverdue ? '#fee2e2' : isCancelled ? '#f1f5f9' : '#fef3c7',
                                    color: isComplete ? '#15803d' : isOverdue ? '#dc2626' : isCancelled ? '#64748b' : '#b45309',
                                    border: `1px solid ${isComplete ? '#bbf7d0' : isOverdue ? '#fca5a5' : isCancelled ? '#cbd5e1' : '#fde68a'}`,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                >
                                  {isComplete && <CheckCircle2 size={11} />}
                                  {isOverdue && <AlertTriangle size={11} />}
                                  <span>{computedStatus}</span>
                                </span>
                              )}

                              <strong style={{ fontSize: '0.86rem', color: isCancelled ? '#94a3b8' : '#0f172a', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                                {act.subject || 'Activity Log'}
                              </strong>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                                {act.authorName && `By ${act.authorName} • `}
                                {act.date} {act.time}
                              </span>

                              {/* Follow-up inline action buttons */}
                              {isFollowUp && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  {!isComplete && !isCancelled && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateFollowUpStatus(act, 'Completed')}
                                        style={{
                                          padding: '3px 8px',
                                          borderRadius: '4px',
                                          border: 'none',
                                          background: '#16a34a',
                                          color: '#ffffff',
                                          fontSize: '0.72rem',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px',
                                        }}
                                        title="Mark as completed"
                                      >
                                        <Check size={11} />
                                        <span>Done</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateFollowUpStatus(act, 'Cancelled')}
                                        style={{
                                          padding: '3px 6px',
                                          borderRadius: '4px',
                                          border: '1px solid #cbd5e1',
                                          background: '#ffffff',
                                          color: '#dc2626',
                                          fontSize: '0.72rem',
                                          cursor: 'pointer',
                                        }}
                                        title="Cancel follow-up"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  )}
                                  {isComplete && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateFollowUpStatus(act, 'Pending')}
                                      style={{
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        border: '1px solid #cbd5e1',
                                        background: '#ffffff',
                                        color: '#475569',
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                      }}
                                    >
                                      <RotateCcw size={11} />
                                      <span>Reopen</span>
                                    </button>
                                  )}
                                  {isCancelled && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateFollowUpStatus(act, 'Pending')}
                                      style={{
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        border: '1px solid #cbd5e1',
                                        background: '#ffffff',
                                        color: '#2563eb',
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Restore
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {act.content && (
                            <p style={{ margin: 0, fontSize: '0.84rem', color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                              {act.content}
                            </p>
                          )}

                          {isFollowUp && (act.nextFollowUpDate || act.assignedEmployee) && (
                            <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '4px', borderTop: '1px dashed #e2e8f0', marginTop: '2px' }}>
                              {act.nextFollowUpDate && (
                                <span>Target: <strong>{act.nextFollowUpDate}</strong> {act.nextFollowUpTime && `at ${act.nextFollowUpTime}`}</span>
                              )}
                              {act.assignedEmployee && (
                                <span>Assigned to: <strong>{act.assignedEmployee}</strong></span>
                              )}
                              {act.completedBy && (
                                <span style={{ color: '#16a34a' }}>Done by {act.completedBy}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RESOLUTION & CSAT */}
          {activeTab === 'resolution' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {isResolved ? (
                <>
                  {/* Resolution Details Card */}
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={20} color="#16a34a" />
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#166534' }}>
                          Ticket {complaint.status === 'Closed' ? 'Closed' : 'Resolved'}
                        </h3>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 600 }}>
                        {complaint.resolvedAt && `Resolved on ${new Date(complaint.resolvedAt).toLocaleString()}`}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                        Resolution Code:
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: '0.92rem', color: '#14532d', fontWeight: 700 }}>
                        {complaint.resolutionCode || 'Bug Fixed'}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                        Resolution Summary & Notes:
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: '0.88rem', color: '#14532d', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {complaint.resolutionSummary || complaint.resolutionNotes || 'Resolved without extra notes'}
                      </p>
                    </div>

                    {complaint.closureReason && (
                      <div style={{ paddingTop: '8px', borderTop: '1px solid #dcfce7' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                          Closure Reason:
                        </span>
                        <p style={{ margin: '2px 0 0', fontSize: '0.86rem', color: '#14532d' }}>
                          {complaint.closureReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Interactive CSAT Section */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Star size={18} color="#f59e0b" fill="#f59e0b" />
                        <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: '#0f172a' }}>
                          Customer Satisfaction (CSAT) Rating
                        </h4>
                      </div>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background: complaint.csatRating ? '#fef3c7' : '#f1f5f9',
                          color: complaint.csatRating ? '#b45309' : '#64748b',
                        }}
                      >
                        Status: {complaint.csatStatus || (complaint.csatRating ? 'Received' : 'Pending')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Select Rating:</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setCsatRating(s)}
                            onMouseEnter={() => setHoverRating(s)}
                            onMouseLeave={() => setHoverRating(0)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                            }}
                          >
                            <Star
                              size={22}
                              fill={(hoverRating || csatRating) >= s ? '#f59e0b' : 'none'}
                              color={(hoverRating || csatRating) >= s ? '#f59e0b' : '#cbd5e1'}
                            />
                          </button>
                        ))}
                      </div>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#b45309' }}>
                        {csatRating} / 5 Stars
                      </span>
                    </div>

                    <textarea
                      rows={2}
                      value={csatFeedback}
                      onChange={(e) => setCsatFeedback(e.target.value)}
                      placeholder="Customer feedback comments or remarks..."
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.84rem',
                      }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={handleSubmitCsatRating}
                        disabled={submittingCsat}
                        style={{
                          padding: '7px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#d97706',
                          color: '#ffffff',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: submittingCsat ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {submittingCsat ? 'Submitting...' : 'Record CSAT Feedback'}
                      </button>
                    </div>
                  </div>

                  {/* Reopening History If Any */}
                  {complaint.reopenCount > 0 && (
                    <div style={{ background: '#fdf4ff', border: '1px solid #f0abfc', borderRadius: '16px', padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a21caf', fontWeight: 800, fontSize: '0.86rem' }}>
                        <RotateCcw size={16} />
                        <span>Ticket Reopening History ({complaint.reopenCount} Time{complaint.reopenCount > 1 ? 's' : ''})</span>
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#701a75' }}>
                        <strong>Last Reason:</strong> {complaint.reopenReason || 'Customer reported incomplete resolution'}
                        {complaint.reopenedAt && ` (Reopened on ${new Date(complaint.reopenedAt).toLocaleDateString()})`}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                /* Ticket is Not Resolved Yet */
                <div style={{ textAlign: 'center', padding: '36px 20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <Clock size={38} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                    Complaint Status: {complaint.status}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '440px', margin: '0 auto 20px' }}>
                    When investigations and corrective actions have been applied, enter resolution details below to mark the ticket as Resolved.
                  </p>

                  {!showInlineResolveForm ? (
                    <button
                      type="button"
                      onClick={() => setShowInlineResolveForm(true)}
                      style={{
                        padding: '10px 22px',
                        borderRadius: '999px',
                        border: 'none',
                        background: '#16a34a',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>Resolve Ticket Now</span>
                    </button>
                  ) : (
                    <div
                      style={{
                        maxWidth: '520px',
                        margin: '0 auto',
                        textAlign: 'left',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '14px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>Enter Resolution Details</strong>
                        <button
                          type="button"
                          onClick={() => setShowInlineResolveForm(false)}
                          style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                          RESOLUTION CODE
                        </label>
                        <select
                          value={resolutionCode}
                          onChange={(e) => setResolutionCode(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                        >
                          <option value="Bug Fixed">Bug Fixed</option>
                          <option value="Workaround Provided">Workaround Provided</option>
                          <option value="Configuration Change">Configuration Change</option>
                          <option value="Customer Educated">Customer Educated</option>
                          <option value="Third-party Resolution">Third-party Resolution</option>
                          <option value="Known Issue / Duplicate">Known Issue / Duplicate</option>
                          <option value="Hardware Replacement">Hardware Replacement</option>
                          <option value="Policy Exception">Policy Exception</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                          RESOLUTION SUMMARY *
                        </label>
                        <input
                          type="text"
                          placeholder="Short summary of how the issue was fixed..."
                          value={resolutionSummary}
                          onChange={(e) => setResolutionSummary(e.target.value)}
                          required
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                          DETAILED RESOLUTION NOTES
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Detailed instructions or test findings..."
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => setShowInlineResolveForm(false)}
                          style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleExecuteResolve}
                          disabled={submittingResolve || !resolutionSummary.trim()}
                          style={{
                            padding: '7px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#16a34a',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: submittingResolve ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {submittingResolve ? 'Resolving...' : 'Confirm Resolution'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div
          className="responsive-footer"
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
            borderRadius: '0 0 20px 20px',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          {/* Left Actions */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {canDelete && !isResolved && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(complaint);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '7px 14px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            )}

            {/* Reassign Button - Only if active */}
            {!isResolved && (
              <button
                type="button"
                onClick={() => setShowReassignModal(true)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  padding: '7px 14px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <UserCheck size={14} />
                <span>Reassign</span>
              </button>
            )}

            {/* Escalate Button */}
            {!['Resolved', 'Closed'].includes(complaint.status) && (
              <button
                type="button"
                onClick={() => setShowEscalateModal(true)}
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  color: '#dc2626',
                  padding: '7px 14px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Flame size={14} />
                <span>Escalate</span>
              </button>
            )}
          </div>

          {/* Right Actions */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {!isResolved && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(complaint);
                }}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  padding: '7px 16px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Edit2 size={14} />
                <span>Edit Details</span>
              </button>
            )}

            {/* If Resolved or Closed -> Allow Reopen and Close */}
            {isResolved ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowReopenModal(true)}
                  style={{
                    background: '#7e22ce',
                    border: 'none',
                    color: '#ffffff',
                    padding: '7px 16px',
                    borderRadius: '999px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <RotateCcw size={14} />
                  <span>Reopen Ticket</span>
                </button>

                {!isClosed && (
                  <button
                    type="button"
                    onClick={handleExecuteClose}
                    style={{
                      background: '#0f172a',
                      border: 'none',
                      color: '#ffffff',
                      padding: '7px 16px',
                      borderRadius: '999px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Close Case
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('resolution');
                  setShowInlineResolveForm(true);
                }}
                style={{
                  background: '#16a34a',
                  border: 'none',
                  color: '#ffffff',
                  padding: '7px 18px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                }}
              >
                <CheckCircle2 size={15} />
                <span>Resolve Ticket</span>
              </button>
            )}

            {/* Done button only closes modal */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#334155',
                padding: '7px 16px',
                borderRadius: '999px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>

        {/* REASSIGN MODAL DIALOG */}
        {showReassignModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10001,
              padding: '16px',
            }}
          >
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Reassign Complaint Ticket</h3>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Select Authorized Staff Member
                </label>
                <select
                  value={reassignUser}
                  onChange={(e) => setReassignUser(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                >
                  <option value="Unassigned">Unassigned</option>
                  {recommendedAssignees.length > 0 && (
                    <optgroup label="⭐ Recommended (Department Specialists)">
                      {recommendedAssignees.map((item) => (
                        <option key={item.user._id} value={item.user.name}>
                          {item.user.name} ({item.user.department || 'Operations'}) — {item.availability?.badge || item.matchLabel}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label={recommendedAssignees.length > 0 ? "Other Team Members" : "All Authorized Members"}>
                    {otherAssignees.map((item) => (
                      <option key={item.user._id} value={item.user.name}>
                        {item.user.name} ({item.user.role || 'Member'}) — {item.availability?.badge || item.user.department || 'Operations'}
                      </option>
                    ))}
                  </optgroup>
                </select>

                {/* Live Availability & Field Service Status Card */}
                {selectedAssigneeInfo?.availability && (
                  <div
                    style={{
                      marginTop: '6px',
                      background: selectedAssigneeInfo.availability.bgColor,
                      border: `1px solid ${selectedAssigneeInfo.availability.borderColor}`,
                      borderRadius: '8px',
                      padding: '7px 11px',
                      fontSize: '0.75rem',
                      color: selectedAssigneeInfo.availability.color,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Clock size={13} style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Live Availability:</strong> {selectedAssigneeInfo.availability.etaText}
                    </span>
                  </div>
                )}

                {/* RED Warning when NO employee from the related department exists in user's team */}
                {recommendedAssignees.length === 0 && complaint?.category && (
                  <div
                    style={{
                      marginTop: '6px',
                      background: '#fef2f2',
                      border: '1px solid #fca5a5',
                      borderRadius: '8px',
                      padding: '7px 11px',
                      fontSize: '0.76rem',
                      color: '#b91c1c',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                      lineHeight: 1.4,
                    }}
                  >
                    <AlertCircle size={14} color="#dc2626" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>
                      <strong>No Related-Field Employee Available:</strong> No user in your team belongs to{' '}
                      <strong>{getRecommendedDepartment(complaint?.category)}</strong>.
                      {selectedAssigneeInfo
                        ? ` (${selectedAssigneeInfo.user.name} is in ${selectedAssigneeInfo.user.department || 'another department'}).`
                        : ''}
                    </span>
                  </div>
                )}

                {/* Smart Skill & Location Match Assistant Badge */}
                {selectedAssigneeInfo && selectedAssigneeInfo.isRecommended && (
                  <div
                    style={{
                      marginTop: '6px',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      padding: '7px 11px',
                      fontSize: '0.76rem',
                      color: '#166534',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <CheckCircle2 size={13} color="#16a34a" style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Smart Match:</strong> {selectedAssigneeInfo.user.name} is in{' '}
                      <strong>{selectedAssigneeInfo.user.department || 'Operations'}</strong> department,
                      ideal for <strong>{complaint?.category || 'this ticket'}</strong>.
                    </span>
                  </div>
                )}
                {selectedAssigneeInfo && !selectedAssigneeInfo.isRecommended && recommendedAssignees.length > 0 && (
                  <div
                    style={{
                      marginTop: '6px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      padding: '7px 11px',
                      fontSize: '0.76rem',
                      color: '#b91c1c',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <AlertCircle size={13} color="#dc2626" style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Department Mismatch:</strong> {selectedAssigneeInfo.user.name} is in{' '}
                      <strong>{selectedAssigneeInfo.user.department || 'Operations'}</strong>. Recommended for{' '}
                      <strong>{complaint?.category}</strong> is{' '}
                      <strong>{getRecommendedDepartment(complaint?.category)}</strong>.
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Reassignment Reason
                </label>
                <input
                  type="text"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="e.g. Workload balancing / Category expertise"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteReassign}
                  disabled={submittingReassign}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 700, cursor: submittingReassign ? 'not-allowed' : 'pointer', fontSize: '0.82rem' }}
                >
                  {submittingReassign ? 'Assigning...' : 'Confirm Reassign'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ESCALATE MODAL DIALOG */}
        {showEscalateModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10001,
              padding: '16px',
            }}
          >
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
                <Flame size={20} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Escalate Complaint Ticket</h3>
              </div>

              {/* Informational notice */}
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '9px 12px', fontSize: '0.78rem', color: '#991b1b', lineHeight: 1.45 }}>
                Ticket <strong>{complaint.ticketNumber}</strong> will be escalated directly to your immediate reporting manager for priority review.
              </div>

              {/* Validation Error Banner */}
              {escalateValidationError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '8px 12px', fontSize: '0.78rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{escalateValidationError}</span>
                </div>
              )}

              {/* Notice if no immediate reporting manager exists (e.g. Super Admin) */}
              {activeEscalationRecipients.length === 0 && (
                <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8rem', color: '#92400e', lineHeight: 1.45, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <AlertCircle size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>No Higher Authority Available:</strong> You are currently at the highest organizational tier (Super Admin / Top-Level Authority). Escalation is not applicable as there is no higher authority in the reporting hierarchy.
                  </div>
                </div>
              )}

              {/* FIELD 1: Escalate To */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>ESCALATE TO <span style={{ color: '#dc2626' }}>*</span></span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>Immediate Reporting Manager</span>
                </label>
                <select
                  value={escalateTo}
                  onChange={(e) => {
                    setEscalateTo(e.target.value);
                    if (escalateValidationError) setEscalateValidationError('');
                  }}
                  disabled={submittingEscalate || activeEscalationRecipients.length === 0}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    background: activeEscalationRecipients.length === 0 ? '#f8fafc' : '#ffffff',
                    color: activeEscalationRecipients.length === 0 ? '#94a3b8' : '#0f172a',
                    outline: 'none',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    cursor: activeEscalationRecipients.length === 0 ? 'not-allowed' : 'default',
                  }}
                >
                  {activeEscalationRecipients.length === 0 ? (
                    <option value="">No eligible immediate reporting manager available</option>
                  ) : (
                    activeEscalationRecipients.map((u) => (
                      <option key={u._id || u.id} value={u._id || u.id}>
                        {u.name} — {u.role || u.designation || 'Staff'} {u.department ? `(${u.department})` : ''} (Immediate Reporting Manager)
                      </option>
                    ))
                  )}
                </select>
                {selectedEscalateRecipient && (
                  <span style={{ fontSize: '0.74rem', color: '#16a34a', marginTop: '5px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                    <CheckCircle2 size={12} />
                    <span>Immediate reporting manager: <strong>{selectedEscalateRecipient.name}</strong> ({selectedEscalateRecipient.role})</span>
                  </span>
                )}
              </div>

              {/* FIELD 2: Escalation Reason / Justification */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  ESCALATION REASON / JUSTIFICATION <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  value={escalateReason}
                  onChange={(e) => {
                    setEscalateReason(e.target.value);
                    if (escalateValidationError) setEscalateValidationError('');
                  }}
                  disabled={submittingEscalate || activeEscalationRecipients.length === 0}
                  placeholder="Explain why this ticket requires higher-level intervention (e.g. Critical SLA breach risk, customer dissatisfaction, technical blocker)..."
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'vertical',
                    background: activeEscalationRecipients.length === 0 ? '#f8fafc' : '#ffffff',
                    color: '#0f172a',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEscalateModal(false);
                    setEscalateValidationError('');
                  }}
                  disabled={submittingEscalate}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    cursor: submittingEscalate ? 'not-allowed' : 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteEscalate}
                  disabled={submittingEscalate || !escalateReason.trim() || !escalateTo || activeEscalationRecipients.length === 0}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: submittingEscalate || !escalateReason.trim() || !escalateTo || activeEscalationRecipients.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: submittingEscalate || !escalateReason.trim() || !escalateTo || activeEscalationRecipients.length === 0 ? 0.5 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Flame size={14} />
                  <span>{submittingEscalate ? 'Escalating...' : 'Confirm Escalation'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REOPEN MODAL DIALOG */}
        {showReopenModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10001,
              padding: '16px',
            }}
          >
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7e22ce' }}>
                <RotateCcw size={20} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Reopen Complaint Ticket</h3>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Reopening Reason
                </label>
                <textarea
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. Issue reoccurred following recent update..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteReopen}
                  disabled={submittingReopen || !reopenReason.trim()}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#7e22ce', color: '#ffffff', fontWeight: 700, cursor: submittingReopen ? 'not-allowed' : 'pointer', fontSize: '0.82rem' }}
                >
                  {submittingReopen ? 'Reopening...' : 'Confirm Reopen'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ESCALATION SUCCESS IN-APP TOAST NOTIFICATION */}
        {escalationSuccessToast && (
          <div
            style={{
              position: 'fixed',
              top: '28px',
              right: '28px',
              zIndex: 10005,
              background: '#f0fdf4',
              border: '1.5px solid #86efac',
              borderLeft: '5px solid #16a34a',
              borderRadius: '12px',
              boxShadow: '0 12px 30px -4px rgba(22, 163, 74, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              padding: '14px 18px',
              maxWidth: '440px',
              width: 'calc(100% - 56px)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            role="status"
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#14532d' }}>
                  {escalationSuccessToast.title}
                </h4>
                <button
                  type="button"
                  onClick={() => setEscalationSuccessToast(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#15803d',
                    cursor: 'pointer',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Dismiss notification"
                  aria-label="Dismiss notification"
                >
                  <X size={16} />
                </button>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#166534', lineHeight: 1.45 }}>
                {escalationSuccessToast.message}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintDetailModal;

