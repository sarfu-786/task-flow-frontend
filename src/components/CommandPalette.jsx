import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { useLeads } from '../context/LeadContext';
import { useProjects } from '../context/ProjectContext';
import { useComplaints } from '../context/ComplaintContext';
import { useUserManagement } from '../context/UserContext';
import { exportToCSV, printPDFReport } from '../services/exportUtils';
import {
  Search,
  CheckSquare,
  ListTodo,
  Target,
  Briefcase,
  LifeBuoy,
  FolderKanban,
  Users,
  Network,
  CreditCard,
  User,
  Plus,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Sparkles,
  Command,
  CornerDownLeft,
  X,
} from 'lucide-react';

export const CommandPalette = ({ isOpen, onClose, setActiveSection }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const { user, isSuperAdmin, isManager } = useAuth();
  const { tasks, openCreateModal: openCreateTaskModal } = useTasks();
  const { leads, openCreateModal: openCreateLeadModal } = useLeads();
  const { projects, openCreateModal: openCreateProjectModal } = useProjects();
  const { complaints, openCreateModal: openCreateComplaintModal } = useComplaints();
  const { users } = useUserManagement();

  // Reset query and focus on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle Export Helpers
  const handleExportTasksCSV = () => {
    const columns = [
      { key: '_index', label: 'Sr.' },
      { key: 'description', label: 'Description' },
      { key: 'taskType', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'assignedTo', label: 'Assigned To' },
      { key: 'assignedBy', label: 'Assigned By' },
      {
        key: 'expectedDate',
        label: 'Due Date',
        formatter: (v) => (v ? new Date(v).toLocaleDateString('en-US') : '—'),
      },
      { key: 'remark', label: 'Instructions' },
      { key: 'completionRemark', label: 'Completion Remark' },
    ];
    exportToCSV('TaskFlow_Tasks', tasks, columns);
    onClose();
  };

  const handlePrintTasksPDF = () => {
    const columns = [
      { key: 'description', label: 'Task Description' },
      { key: 'taskType', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'assignedTo', label: 'Assignee' },
      {
        key: 'expectedDate',
        label: 'Due Date',
        formatter: (v) => (v ? new Date(v).toLocaleDateString('en-US') : '—'),
      },
    ];
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const todo = tasks.filter((t) => t.status === 'To Do').length;

    printPDFReport(
      'Task Operations Report',
      'All active organizational deliverables and assignments',
      columns,
      tasks,
      [
        { label: 'Total Tasks', value: tasks.length, color: '#2563eb' },
        { label: 'Completed', value: completed, color: '#059669' },
        { label: 'In Progress', value: inProgress, color: '#d97706' },
        { label: 'Pending To-Do', value: todo, color: '#6366f1' },
      ]
    );
    onClose();
  };

  const handleExportLeadsCSV = () => {
    const columns = [
      { key: '_index', label: 'Sr.' },
      { key: 'name', label: 'Lead Name' },
      { key: 'company', label: 'Company' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'dealValue', label: 'Deal Value' },
      { key: 'source', label: 'Source' },
      { key: 'assignedTo', label: 'Assigned To' },
    ];
    exportToCSV('TaskFlow_Leads', leads, columns);
    onClose();
  };

  const handlePrintLeadsPDF = () => {
    const columns = [
      { key: 'name', label: 'Lead / Contact' },
      { key: 'company', label: 'Company' },
      { key: 'email', label: 'Email' },
      { key: 'status', label: 'Status' },
      { key: 'dealValue', label: 'Deal Value', formatter: (v, r) => `${r.currency === 'INR' ? '₹' : '$'}${Number(v || 0).toLocaleString()}` },
      { key: 'source', label: 'Source' },
      { key: 'assignedTo', label: 'Assigned To' },
    ];
    const qualified = leads.filter((l) => l.status === 'Qualified').length;
    const converted = leads.filter((l) => l.status === 'Converted').length;

    printPDFReport(
      'Sales Leads & CRM Pipeline Report',
      'Organizational prospect opportunities and deal pipeline',
      columns,
      leads,
      [
        { label: 'Total Leads', value: leads.length, color: '#2563eb' },
        { label: 'Qualified', value: qualified, color: '#059669' },
        { label: 'Converted Deals', value: converted, color: '#7c3aed' },
      ]
    );
    onClose();
  };

  const handleExportProjectsCSV = () => {
    const columns = [
      { key: '_index', label: 'Sr.' },
      { key: 'projectCode', label: 'Code' },
      { key: 'name', label: 'Project Name' },
      { key: 'clientName', label: 'Client' },
      { key: 'category', label: 'Category' },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'budget', label: 'Budget' },
      { key: 'progress', label: 'Progress (%)' },
      { key: 'managerName', label: 'Project Lead' },
    ];
    exportToCSV('TaskFlow_Projects', projects, columns);
    onClose();
  };

  const handlePrintProjectsPDF = () => {
    const columns = [
      { key: 'projectCode', label: 'Code' },
      { key: 'name', label: 'Project Name' },
      { key: 'clientName', label: 'Client' },
      { key: 'status', label: 'Status' },
      { key: 'budget', label: 'Budget', formatter: (v, r) => `${r.currency === 'INR' ? '₹' : '$'}${Number(v || 0).toLocaleString()}` },
      { key: 'progress', label: 'Progress', formatter: (v) => `${v || 0}%` },
      { key: 'managerName', label: 'Lead' },
    ];
    const completed = projects.filter((p) => p.status === 'Completed').length;
    const inProgress = projects.filter((p) => p.status === 'In Progress').length;
    const totalBudget = projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);

    printPDFReport(
      'Client Projects Deliverables Report',
      'Portfolio overview, sprint status, and delivery milestones',
      columns,
      projects,
      [
        { label: 'Total Projects', value: projects.length, color: '#2563eb' },
        { label: 'In Execution', value: inProgress, color: '#0284c7' },
        { label: 'Delivered', value: completed, color: '#059669' },
        { label: 'Total Budget', value: `$${totalBudget.toLocaleString()}`, color: '#7c3aed' },
      ]
    );
    onClose();
  };

  // Build searchable items
  const items = useMemo(() => {
    const list = [];

    // 1. Navigation items
    const navItems = [
      {
        id: 'nav-dashboard',
        category: 'Navigation',
        title: isSuperAdmin ? 'Super Admin Dashboard' : isManager ? 'Manager Dashboard' : 'User Workspace',
        subtitle: 'Overview, team metrics, and daily workflow hub',
        icon: CheckSquare,
        action: () => {
          if (isSuperAdmin) setActiveSection('superadmin');
          else if (isManager) setActiveSection('manager');
          else setActiveSection('user-workspace');
          onClose();
        },
      },
      {
        id: 'nav-tasks',
        category: 'Navigation',
        title: 'Task Management',
        subtitle: 'View, organize, and assign team tasks (Table & Kanban)',
        icon: ListTodo,
        action: () => {
          setActiveSection('tasks');
          onClose();
        },
      },
      {
        id: 'nav-leads',
        category: 'Navigation',
        title: 'Leads CRM & Pipeline',
        subtitle: 'Prospect tracking, qualification, and sales board',
        icon: Target,
        action: () => {
          setActiveSection('leads');
          onClose();
        },
      },
      {
        id: 'nav-opps',
        category: 'Navigation',
        title: 'Sales Opportunities',
        subtitle: 'Deals negotiation, probability, and revenue forecasts',
        icon: Briefcase,
        action: () => {
          setActiveSection('opportunities');
          onClose();
        },
      },
      {
        id: 'nav-projects',
        category: 'Navigation',
        title: 'Projects & Milestones',
        subtitle: 'Client deliverables, execution sprints, and budget tracking',
        icon: FolderKanban,
        action: () => {
          setActiveSection('projects');
          onClose();
        },
      },
      {
        id: 'nav-complaints',
        category: 'Navigation',
        title: 'Complaints & Support',
        subtitle: 'Customer issue tickets, SLA tracking, and resolution logs',
        icon: LifeBuoy,
        action: () => {
          setActiveSection('complaints');
          onClose();
        },
      },
      {
        id: 'nav-hierarchy',
        category: 'Navigation',
        title: 'Organization Hierarchy',
        subtitle: 'Interactive visual team reporting tree and org structure',
        icon: Network,
        action: () => {
          setActiveSection('hierarchy');
          onClose();
        },
      },
      {
        id: 'nav-users',
        category: 'Navigation',
        title: 'User Management & Employees',
        subtitle: 'Manage team roster, roles, and account permissions',
        icon: Users,
        action: () => {
          setActiveSection('employees');
          onClose();
        },
      },
      {
        id: 'nav-subscription',
        category: 'Navigation',
        title: 'Subscription & Organization Plan',
        subtitle: 'Manage active modules, seats, and enterprise billing',
        icon: CreditCard,
        action: () => {
          setActiveSection('subscription');
          onClose();
        },
      },
      {
        id: 'nav-profile',
        category: 'Navigation',
        title: 'My Profile & Account Settings',
        subtitle: 'View user profile, update password, and view assigned role',
        icon: User,
        action: () => {
          window.dispatchEvent(new CustomEvent('open-my-profile'));
          onClose();
        },
      },
    ];

    list.push(...navItems);

    // 2. Quick Actions
    const quickActions = [
      {
        id: 'action-add-task',
        category: 'Quick Actions',
        title: 'Create New Task',
        subtitle: 'Assign a new task to a junior or team member',
        icon: Plus,
        color: '#2563eb',
        action: () => {
          openCreateTaskModal();
          onClose();
        },
      },
      {
        id: 'action-add-lead',
        category: 'Quick Actions',
        title: 'Add New Lead',
        subtitle: 'Register a new customer inquiry or prospect',
        icon: Plus,
        color: '#059669',
        action: () => {
          openCreateLeadModal();
          onClose();
        },
      },
      {
        id: 'action-add-project',
        category: 'Quick Actions',
        title: 'Create New Project',
        subtitle: 'Initiate a new client project deliverable with milestones',
        icon: Plus,
        color: '#7c3aed',
        action: () => {
          openCreateProjectModal();
          onClose();
        },
      },
      {
        id: 'action-add-complaint',
        category: 'Quick Actions',
        title: 'File Support Complaint',
        subtitle: 'Log a new service issue or client feedback ticket',
        icon: Plus,
        color: '#d97706',
        action: () => {
          openCreateComplaintModal();
          onClose();
        },
      },
      {
        id: 'action-export-tasks-csv',
        category: 'Reports & Export',
        title: 'Export Tasks to Excel (CSV)',
        subtitle: 'Download complete task list with statuses and assignees',
        icon: FileSpreadsheet,
        color: '#059669',
        action: handleExportTasksCSV,
      },
      {
        id: 'action-print-tasks-pdf',
        category: 'Reports & Export',
        title: 'Print Task Operations Report (PDF)',
        subtitle: 'Generate high-fidelity printable report with metrics summary',
        icon: Printer,
        color: '#2563eb',
        action: handlePrintTasksPDF,
      },
      {
        id: 'action-export-leads-csv',
        category: 'Reports & Export',
        title: 'Export Leads Pipeline to Excel (CSV)',
        subtitle: 'Download all CRM leads, deal values, and contact details',
        icon: FileSpreadsheet,
        color: '#059669',
        action: handleExportLeadsCSV,
      },
      {
        id: 'action-print-leads-pdf',
        category: 'Reports & Export',
        title: 'Print Leads & CRM Report (PDF)',
        subtitle: 'Generate printable pipeline and conversion rate summary',
        icon: Printer,
        color: '#7c3aed',
        action: handlePrintLeadsPDF,
      },
      {
        id: 'action-export-projects-csv',
        category: 'Reports & Export',
        title: 'Export Projects to Excel (CSV)',
        subtitle: 'Download deliverables summary, budgets, and milestone progress',
        icon: FileSpreadsheet,
        color: '#059669',
        action: handleExportProjectsCSV,
      },
      {
        id: 'action-print-projects-pdf',
        category: 'Reports & Export',
        title: 'Print Projects Portfolio Report (PDF)',
        subtitle: 'Generate portfolio execution and financial overview PDF',
        icon: Printer,
        color: '#0284c7',
        action: handlePrintProjectsPDF,
      },
    ];

    list.push(...quickActions);

    // 3. Live Entity Search (Tasks, Leads, Projects, Users, Complaints)
    if (query.trim().length > 1) {
      const q = query.trim().toLowerCase();

      // Tasks
      tasks.forEach((t) => {
        if (
          t.description?.toLowerCase().includes(q) ||
          t.assignedTo?.toLowerCase().includes(q) ||
          t.taskType?.toLowerCase().includes(q)
        ) {
          list.push({
            id: `task-${t._id}`,
            category: 'Tasks',
            title: t.description,
            subtitle: `${t.taskType} • Assigned to ${t.assignedTo || 'Unassigned'} • [${t.status || 'To Do'}]`,
            icon: ListTodo,
            badge: t.status,
            action: () => {
              setActiveSection('tasks');
              onClose();
            },
          });
        }
      });

      // Leads
      leads.forEach((l) => {
        if (
          l.name?.toLowerCase().includes(q) ||
          l.company?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q)
        ) {
          list.push({
            id: `lead-${l._id}`,
            category: 'Leads',
            title: l.name,
            subtitle: `${l.company ? l.company + ' • ' : ''}${l.currency === 'INR' ? '₹' : '$'}${(Number(l.dealValue) || 0).toLocaleString()} • [${l.status || 'New'}]`,
            icon: Target,
            badge: l.status,
            action: () => {
              setActiveSection('leads');
              onClose();
            },
          });
        }
      });

      // Projects
      projects.forEach((p) => {
        if (
          p.name?.toLowerCase().includes(q) ||
          p.clientName?.toLowerCase().includes(q) ||
          p.projectCode?.toLowerCase().includes(q)
        ) {
          list.push({
            id: `proj-${p._id}`,
            category: 'Projects',
            title: `${p.projectCode ? p.projectCode + ' - ' : ''}${p.name}`,
            subtitle: `Client: ${p.clientName} • Progress: ${p.progress || 0}% • [${p.status || 'Planning'}]`,
            icon: FolderKanban,
            badge: p.status,
            action: () => {
              setActiveSection('projects');
              onClose();
            },
          });
        }
      });

      // Users
      (users || []).forEach((u) => {
        if (
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.department?.toLowerCase().includes(q)
        ) {
          list.push({
            id: `user-${u._id || u.id}`,
            category: 'Team Members',
            title: u.name,
            subtitle: `${u.role || 'User'} • ${u.department || 'General'} • ${u.email || ''}`,
            icon: Users,
            badge: u.role,
            action: () => {
              setActiveSection('employees');
              onClose();
            },
          });
        }
      });

      // Complaints
      complaints.forEach((c) => {
        if (
          c.subject?.toLowerCase().includes(q) ||
          c.complaintCode?.toLowerCase().includes(q) ||
          c.clientName?.toLowerCase().includes(q)
        ) {
          list.push({
            id: `comp-${c._id}`,
            category: 'Complaints',
            title: `${c.complaintCode ? c.complaintCode + ': ' : ''}${c.subject}`,
            subtitle: `Client: ${c.clientName || 'General'} • Priority: ${c.priority} • [${c.status}]`,
            icon: LifeBuoy,
            badge: c.status,
            action: () => {
              setActiveSection('complaints');
              onClose();
            },
          });
        }
      });
    }

    // Filter items by search query
    if (!query.trim()) return list;

    const q = query.trim().toLowerCase();
    return list.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q)
    );
  }, [
    query,
    isSuperAdmin,
    isManager,
    tasks,
    leads,
    projects,
    complaints,
    users,
    setActiveSection,
    onClose,
  ]);

  // Adjust selection bounds
  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(Math.max(0, items.length - 1));
    }
  }, [items, selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex] && items[selectedIndex].action) {
        items[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('.command-item-active');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="command-palette-backdrop fade-in"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '80px 16px 20px',
      }}
    >
      <div
        className="command-palette-modal slide-down"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '640px',
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '520px',
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            background: '#ffffff',
          }}
        >
          <Search size={20} color="#64748b" />
          <input
            ref={inputRef}
            type="text"
            className="command-input"
            placeholder="Type a command, section, task, lead, or project..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              color: '#0f172a',
              background: 'transparent',
            }}
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                if (inputRef.current) inputRef.current.focus();
              }}
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
              }}
            >
              <X size={14} />
            </button>
          ) : (
            <kbd
              style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '2px 7px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#64748b',
              }}
            >
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="custom-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px',
            maxHeight: '400px',
          }}
        >
          {items.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <Search size={32} style={{ margin: '0 auto 10px', color: '#cbd5e1' }} />
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#475569' }}>
                No matching results found for "{query}"
              </div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                Try searching for tasks, leads, projects, or action names.
              </div>
            </div>
          ) : (
            items.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              const IconComp = item.icon || ChevronRight;

              // Check if previous item had the same category for divider
              const isFirstOfCategory = idx === 0 || items[idx - 1].category !== item.category;

              return (
                <React.Fragment key={item.id}>
                  {isFirstOfCategory && (
                    <div
                      style={{
                        padding: '10px 12px 4px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                      }}
                    >
                      {item.category}
                    </div>
                  )}

                  <div
                    className={`command-item ${isSelected ? 'command-item-active' : ''}`}
                    onClick={() => item.action && item.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: isSelected ? '#eff6ff' : 'transparent',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isSelected ? '#dbeafe' : '#f8fafc',
                          color: item.color || (isSelected ? '#2563eb' : '#64748b'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IconComp size={16} />
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: isSelected ? 700 : 600,
                            color: isSelected ? '#1e40af' : '#1e293b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: isSelected ? '#3b82f6' : '#64748b',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: '#f1f5f9',
                            color: '#475569',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}

                      {isSelected && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#2563eb',
                            background: '#ffffff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            padding: '2px 6px',
                          }}
                        >
                          <span>Select</span>
                          <CornerDownLeft size={11} />
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '10px 18px',
            background: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.74rem',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span>
              <kbd style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '1px 5px', fontWeight: 700 }}>↑</kbd>{' '}
              <kbd style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '1px 5px', fontWeight: 700 }}>↓</kbd> to navigate
            </span>
            <span>
              <kbd style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '1px 5px', fontWeight: 700 }}>↵</kbd> to select
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={12} color="#2563eb" />
            <span style={{ fontWeight: 600 }}>TaskFlow Command Hub</span>
          </div>
        </div>
      </div>
    </div>
  );
};
