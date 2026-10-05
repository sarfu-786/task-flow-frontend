import React, { useState, useEffect, useMemo } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { projectApi } from '../../services/api';
import {
  FileText,
  Filter,
  Printer,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronDown,
  TrendingUp,
  BarChart2,
  FolderKanban,
  CheckCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const getManagerName = (p) => {
  if (p.managerName) return p.managerName;
  if (p.projectManager) {
    if (typeof p.projectManager === 'object') return p.projectManager.name || p.projectManager.username || 'Unassigned';
    return String(p.projectManager);
  }
  if (p.manager) {
    if (typeof p.manager === 'object') return p.manager.name || p.manager.username || 'Unassigned';
    return String(p.manager);
  }
  return 'Unassigned';
};

const getClientName = (p) => {
  if (p.clientName) return p.clientName;
  if (p.client) {
    if (typeof p.client === 'object') return p.client.name || p.client.company || 'Internal';
    return String(p.client);
  }
  return 'Internal';
};

const generateLocalReport = (type, projects, statusFilter) => {
  const list = Array.isArray(projects) ? projects : [];
  let filtered = list;
  if (statusFilter && statusFilter !== 'all') {
    filtered = filtered.filter((p) => p.status === statusFilter);
  }

  const now = new Date();
  let rows = [];

  switch (type) {
    // ----------------------------------------------------
    // Category 1: PROJECT REPORTS
    // ----------------------------------------------------
    case 'status':
    case 'status-progress':
      rows = filtered.map((p) => ({
        'Project Code': p.projectCode || 'PRJ-000',
        'Project Name': p.name || '',
        'Client': getClientName(p),
        'Project Manager': getManagerName(p),
        'Status': p.status || 'Planning',
        'Priority': p.priority || 'Medium',
        'Progress': `${p.progress || 0}%`,
        'Start Date': p.startDate ? new Date(p.startDate).toISOString().slice(0, 10) : '—',
        'Target Date': p.targetDate ? new Date(p.targetDate).toISOString().slice(0, 10) : '—',
        'Budget': `$${Number(p.budget || 0).toLocaleString()}`,
      }));
      break;

    case 'progress':
      rows = filtered.map((p) => {
        const tasks = p.tasks || [];
        const completedTasks = tasks.filter((t) => ['Done', 'Completed', 'Closed'].includes(t.status)).length;
        const milestones = p.milestones || [];
        const completedMilestones = milestones.filter((m) => m.isCompleted || m.status === 'Completed').length;
        return {
          'Project Code': p.projectCode || 'PRJ-000',
          'Project Name': p.name || '',
          'Manager': getManagerName(p),
          'Progress': `${p.progress || 0}%`,
          'Status': p.status || 'Planning',
          'Phases Count': (p.phases || []).length,
          'Milestones Completed': `${completedMilestones} / ${milestones.length}`,
          'Tasks Completed': `${completedTasks} / ${tasks.length}`,
          'Billing Type': p.billingType || 'Fixed Cost',
        };
      });
      break;

    case 'timeline':
    case 'timeline-delays':
      rows = filtered.map((p) => {
        const target = p.targetDate ? new Date(p.targetDate) : null;
        let scheduleStatus = 'On Schedule';
        if (target) {
          const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
          if (p.status === 'Completed' || p.status === 'Closed') {
            scheduleStatus = 'Delivered';
          } else if (diffDays < 0) {
            scheduleStatus = `Overdue by ${Math.abs(diffDays)}d`;
          } else if (diffDays <= 7) {
            scheduleStatus = `Due in ${diffDays}d (Urgent)`;
          } else {
            scheduleStatus = `Due in ${diffDays}d`;
          }
        }
        return {
          'Project Code': p.projectCode || 'PRJ-000',
          'Project Name': p.name || '',
          'Client': getClientName(p),
          'Start Date': p.startDate ? new Date(p.startDate).toISOString().slice(0, 10) : '—',
          'Target Date': target ? target.toISOString().slice(0, 10) : '—',
          'Schedule Status': scheduleStatus,
          'Progress': `${p.progress || 0}%`,
          'Project Manager': getManagerName(p),
        };
      });
      break;

    case 'delays':
      rows = filtered
        .filter((p) => {
          const isDone = ['Completed', 'Closed'].includes(p.status);
          return !isDone && p.targetDate && new Date(p.targetDate) < now;
        })
        .map((p) => {
          const target = new Date(p.targetDate);
          const delayDays = Math.ceil((now - target) / (1000 * 60 * 60 * 24));
          const openIssues = (p.issues || []).filter((i) => !['Closed', 'Resolved'].includes(i.status)).length;
          return {
            'Project Code': p.projectCode || 'PRJ-000',
            'Project Name': p.name || '',
            'Manager': getManagerName(p),
            'Target Date': target.toISOString().slice(0, 10),
            'Delay Duration': `${delayDays} days overdue`,
            'Current Status': p.status || 'Planning',
            'Priority': p.priority || 'High',
            'Progress': `${p.progress || 0}%`,
            'Open Defects': openIssues,
          };
        });
      break;

    case 'manager':
      const mgrMap = {};
      filtered.forEach((p) => {
        const mgr = getManagerName(p);
        if (!mgrMap[mgr]) {
          mgrMap[mgr] = {
            'Project Manager': mgr,
            'Total Projects': 0,
            'In Execution': 0,
            'Delivered': 0,
            'Total Budget ($)': 0,
            'Total Progress': 0,
          };
        }
        mgrMap[mgr]['Total Projects'] += 1;
        if (['In Progress', 'Planning', 'Approved', 'Under Review', 'Active'].includes(p.status)) {
          mgrMap[mgr]['In Execution'] += 1;
        }
        if (['Completed', 'Closed'].includes(p.status)) {
          mgrMap[mgr]['Delivered'] += 1;
        }
        mgrMap[mgr]['Total Budget ($)'] += Number(p.budget) || 0;
        mgrMap[mgr]['Total Progress'] += Number(p.progress) || 0;
      });
      rows = Object.values(mgrMap).map((m) => ({
        ...m,
        'Total Budget ($)': `$${m['Total Budget ($)'].toLocaleString()}`,
        'Avg Progress': `${m['Total Projects'] > 0 ? Math.round(m['Total Progress'] / m['Total Projects']) : 0}%`,
      }));
      break;

    case 'client':
      const clMap = {};
      filtered.forEach((p) => {
        const cl = getClientName(p);
        if (!clMap[cl]) {
          clMap[cl] = {
            'Client Account': cl,
            'Total Projects': 0,
            'Active Deliverables': 0,
            'Delivered': 0,
            'Portfolio Valuation': 0,
          };
        }
        clMap[cl]['Total Projects'] += 1;
        if (['In Progress', 'Planning', 'Approved', 'Active'].includes(p.status)) clMap[cl]['Active Deliverables'] += 1;
        if (['Completed', 'Closed'].includes(p.status)) clMap[cl]['Delivered'] += 1;
        clMap[cl]['Portfolio Valuation'] += Number(p.budget) || 0;
      });
      rows = Object.values(clMap).map((c) => ({
        ...c,
        'Portfolio Valuation': `$${c['Portfolio Valuation'].toLocaleString()}`,
      }));
      break;

    // ----------------------------------------------------
    // Category 2: TASK REPORTS
    // ----------------------------------------------------
    case 'task_status':
      filtered.forEach((p) => {
        (p.tasks || []).forEach((t) => {
          rows.push({
            'Task Code': t.taskId || 'TSK-00',
            'Task Title': t.taskName || t.title,
            'Project': p.name,
            'Assignee': t.assignedTo || 'Unassigned',
            'Status': t.status || 'To Do',
            'Priority': t.priority || 'Medium',
            'Progress': `${t.progress || 0}%`,
            'Due Date': t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : '—',
          });
        });
      });
      break;

    case 'task_priority':
      filtered.forEach((p) => {
        (p.tasks || []).forEach((t) => {
          rows.push({
            'Task Code': t.taskId || 'TSK-00',
            'Task Title': t.taskName || t.title,
            'Priority': t.priority || 'Medium',
            'Project': p.name,
            'Assignee': t.assignedTo || 'Unassigned',
            'Status': t.status || 'To Do',
            'Estimated Hours': `${t.estimatedHours || 0} hrs`,
            'Due Date': t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : '—',
          });
        });
      });
      break;

    case 'task_owner':
      filtered.forEach((p) => {
        (p.tasks || []).forEach((t) => {
          rows.push({
            'Assignee': t.assignedTo || 'Unassigned',
            'Project Name': p.name,
            'Task Title': t.taskName || t.title,
            'Status': t.status || 'To Do',
            'Priority': t.priority || 'Medium',
            'Estimated Hours': `${t.estimatedHours || 0} hrs`,
            'Logged Hours': `${t.actualHours || 0} hrs`,
            'Due Date': t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : '—',
          });
        });
      });
      break;

    case 'task_overdue':
      filtered.forEach((p) => {
        (p.tasks || []).forEach((t) => {
          const isDone = ['Done', 'Completed', 'Closed'].includes(t.status);
          if (!isDone && t.dueDate && new Date(t.dueDate) < now) {
            const overdueDays = Math.ceil((now - new Date(t.dueDate)) / (1000 * 60 * 60 * 24));
            rows.push({
              'Task Code': t.taskId || 'TSK-00',
              'Task Title': t.taskName || t.title,
              'Project': p.name,
              'Assignee': t.assignedTo || 'Unassigned',
              'Due Date': new Date(t.dueDate).toISOString().slice(0, 10),
              'Overdue Days': `${overdueDays} days`,
              'Priority': t.priority || 'High',
              'Status': t.status || 'In Progress',
            });
          }
        });
      });
      break;

    case 'milestone_tasks':
      filtered.forEach((p) => {
        (p.milestones || []).forEach((m) => {
          const milestoneTasks = (p.tasks || []).filter((t) => t.milestoneTitle === m.title || t.phaseName === m.phaseName);
          const doneCount = milestoneTasks.filter((t) => ['Done', 'Completed'].includes(t.status)).length;
          rows.push({
            'Milestone Title': m.title,
            'Phase Name': m.phaseName || 'General Phase',
            'Project Name': p.name,
            'Total Tasks': milestoneTasks.length,
            'Completed Tasks': doneCount,
            'Progress': `${milestoneTasks.length > 0 ? Math.round((doneCount / milestoneTasks.length) * 100) : m.isCompleted ? 100 : 0}%`,
            'Milestone Status': m.isCompleted || m.status === 'Completed' ? 'Completed' : 'In Progress',
          });
        });
      });
      break;

    // ----------------------------------------------------
    // Category 3: RESOURCE REPORTS
    // ----------------------------------------------------
    case 'workload':
    case 'resource-workload':
      const userTaskMap = {};
      filtered.forEach((p) => {
        (p.tasks || []).forEach((t) => {
          const assignee = t.assignedTo || 'Unassigned';
          if (!userTaskMap[assignee]) {
            userTaskMap[assignee] = {
              'Employee Name': assignee,
              'Department': p.department || 'Engineering',
              'Role': 'Team Member',
              'Assigned Tasks': 0,
              'Completed Tasks': 0,
              'Pending Tasks': 0,
              'Estimated Hours': 0,
              'Logged Hours': 0,
            };
          }
          userTaskMap[assignee]['Assigned Tasks'] += 1;
          if (['Done', 'Completed', 'Closed'].includes(t.status)) userTaskMap[assignee]['Completed Tasks'] += 1;
          else userTaskMap[assignee]['Pending Tasks'] += 1;
          userTaskMap[assignee]['Estimated Hours'] += Number(t.estimatedHours) || 0;
          userTaskMap[assignee]['Logged Hours'] += Number(t.actualHours) || 0;
        });
      });
      rows = Object.values(userTaskMap)
        .filter((u) => u['Assigned Tasks'] > 0 || u['Logged Hours'] > 0)
        .map((u) => ({
          ...u,
          'Estimated Hours': `${u['Estimated Hours']} hrs`,
          'Logged Hours': `${u['Logged Hours']} hrs`,
          'Completion Rate': `${u['Assigned Tasks'] > 0 ? Math.round((u['Completed Tasks'] / u['Assigned Tasks']) * 100) : 0}%`,
        }));
      break;

    case 'assigned_vs_done':
      const doneMap = {};
      filtered.forEach((p) => {
        (p.tasks || []).forEach((t) => {
          const assignee = t.assignedTo || 'Unassigned';
          if (!doneMap[assignee]) {
            doneMap[assignee] = { 'Employee Name': assignee, 'Assigned Tasks': 0, 'Completed Tasks': 0, 'Pending Tasks': 0 };
          }
          doneMap[assignee]['Assigned Tasks'] += 1;
          if (['Done', 'Completed', 'Closed'].includes(t.status)) doneMap[assignee]['Completed Tasks'] += 1;
          else doneMap[assignee]['Pending Tasks'] += 1;
        });
      });
      rows = Object.values(doneMap).map((d) => ({
        ...d,
        'Completion Rate': `${d['Assigned Tasks'] > 0 ? Math.round((d['Completed Tasks'] / d['Assigned Tasks']) * 100) : 0}%`,
      }));
      break;

    case 'logged_hours':
      const hoursMap = {};
      filtered.forEach((p) => {
        (p.tasks || []).forEach((t) => {
          const assignee = t.assignedTo || 'Unassigned';
          if (!hoursMap[assignee]) {
            hoursMap[assignee] = { 'Employee Name': assignee, 'Estimated Hours': 0, 'Logged Hours': 0 };
          }
          hoursMap[assignee]['Estimated Hours'] += Number(t.estimatedHours) || 0;
          hoursMap[assignee]['Logged Hours'] += Number(t.actualHours) || 0;
        });
      });
      rows = Object.values(hoursMap).map((h) => ({
        'Employee Name': h['Employee Name'],
        'Estimated Hours': `${h['Estimated Hours']} hrs`,
        'Logged Hours': `${h['Logged Hours']} hrs`,
        'Variance': `${h['Estimated Hours'] - h['Logged Hours']} hrs`,
        'Utilization %': `${h['Estimated Hours'] > 0 ? Math.round((h['Logged Hours'] / h['Estimated Hours']) * 100) : 0}%`,
      }));
      break;

    case 'billable':
      const billMap = {};
      filtered.forEach((p) => {
        (p.timesheets || []).forEach((ts) => {
          const user = ts.userName || ts.user || 'Team Member';
          if (!billMap[user]) {
            billMap[user] = { 'Employee Name': user, 'Billable Hours': 0, 'Non-Billable Hours': 0, 'Total Hours': 0 };
          }
          const hrs = Number(ts.hours || ts.totalHours) || 0;
          billMap[user]['Total Hours'] += hrs;
          if (ts.isBillable) billMap[user]['Billable Hours'] += hrs;
          else billMap[user]['Non-Billable Hours'] += hrs;
        });
      });
      rows = Object.values(billMap).map((b) => ({
        'Employee Name': b['Employee Name'],
        'Billable Hours': `${b['Billable Hours']} hrs`,
        'Non-Billable Hours': `${b['Non-Billable Hours']} hrs`,
        'Total Hours': `${b['Total Hours']} hrs`,
        'Billable Ratio': `${b['Total Hours'] > 0 ? Math.round((b['Billable Hours'] / b['Total Hours']) * 100) : 0}%`,
      }));
      break;

    // ----------------------------------------------------
    // Category 4: FINANCIAL REPORTS
    // ----------------------------------------------------
    case 'budget_overview':
    case 'budget-variance':
      rows = filtered.map((p) => {
        const budget = Number(p.budget) || 0;
        const actual = Number(p.actualCost) || 0;
        const variance = budget - actual;
        const util = budget > 0 ? Math.round((actual / budget) * 100) : 0;
        return {
          'Project Code': p.projectCode || 'PRJ-000',
          'Project Name': p.name,
          'Client': getClientName(p),
          'Billing Type': p.billingType || 'Fixed Cost',
          'Total Budget': `$${budget.toLocaleString()}`,
          'Actual Cost': `$${actual.toLocaleString()}`,
          'Remaining Margin': `$${variance.toLocaleString()}`,
          'Budget Utilization': `${util}%`,
          'Status': p.status,
        };
      });
      break;

    case 'cost_variance':
      rows = filtered.map((p) => {
        const budget = Number(p.budget) || 0;
        const actual = Number(p.actualCost) || 0;
        const variance = budget - actual;
        return {
          'Project Code': p.projectCode || 'PRJ-000',
          'Project Name': p.name,
          'Allocated Budget': `$${budget.toLocaleString()}`,
          'Actual Cost Incurred': `$${actual.toLocaleString()}`,
          'Variance ($)': `$${variance.toLocaleString()}`,
          'Margin Health': variance >= 0 ? 'Within Budget' : 'Over Budget (Cost Overrun)',
        };
      });
      break;

    case 'budget_utilization':
      rows = filtered.map((p) => {
        const budget = Number(p.budget) || 0;
        const actual = Number(p.actualCost) || 0;
        const util = budget > 0 ? Math.round((actual / budget) * 100) : 0;
        return {
          'Project Code': p.projectCode || 'PRJ-000',
          'Project Name': p.name,
          'Budget': `$${budget.toLocaleString()}`,
          'Actual Cost': `$${actual.toLocaleString()}`,
          'Utilization %': `${util}%`,
          'Burn Rate': util > 100 ? 'Exceeded' : util > 80 ? 'High' : 'Normal',
          'Status': p.status,
        };
      });
      break;

    case 'planned_vs_actual':
      rows = filtered.map((p) => {
        const planned = Number(p.plannedCost || p.budget) || 0;
        const actual = Number(p.actualCost) || 0;
        const planHrs = Number(p.budgetedHours) || 0;
        const actHrs = Number(p.actualHours) || 0;
        return {
          'Project Code': p.projectCode || 'PRJ-000',
          'Project Name': p.name,
          'Planned Cost': `$${planned.toLocaleString()}`,
          'Actual Cost': `$${actual.toLocaleString()}`,
          'Cost Variance': `$${(planned - actual).toLocaleString()}`,
          'Planned Hours': `${planHrs} hrs`,
          'Actual Hours': `${actHrs} hrs`,
          'Hours Variance': `${planHrs - actHrs} hrs`,
        };
      });
      break;

    // ----------------------------------------------------
    // Category 5: ISSUE & DEFECT REPORTS
    // ----------------------------------------------------
    case 'open_issues':
      filtered.forEach((p) => {
        (p.issues || [])
          .filter((i) => !['Closed', 'Resolved'].includes(i.status))
          .forEach((iss) => {
            rows.push({
              'Issue ID': iss.issueId || 'ISS-00',
              'Title': iss.title,
              'Project': p.name,
              'Severity': iss.severity || 'Medium',
              'Priority': iss.priority || 'Medium',
              'Status': iss.status || 'Open',
              'Assigned To': iss.assignedTo || 'Unassigned',
              'Reported By': iss.reportedBy || 'Team Member',
              'Due Date': iss.dueDate ? new Date(iss.dueDate).toISOString().slice(0, 10) : '—',
            });
          });
      });
      break;

    case 'severity':
    case 'issue-severity':
      filtered.forEach((p) => {
        (p.issues || []).forEach((iss) => {
          rows.push({
            'Issue ID': iss.issueId || 'ISS-00',
            'Title': iss.title,
            'Severity': iss.severity || 'Medium',
            'Impact Tier': ['Critical', 'High'].includes(iss.severity) ? 'High Priority Bug' : 'Standard Defect',
            'Project': p.name,
            'Status': iss.status || 'Open',
            'Assigned To': iss.assignedTo || 'Unassigned',
            'Reported Date': iss.createdAt ? new Date(iss.createdAt).toISOString().slice(0, 10) : '—',
          });
        });
      });
      break;

    case 'issue_assignee':
      const issAssigneeMap = {};
      filtered.forEach((p) => {
        (p.issues || []).forEach((iss) => {
          const assignee = iss.assignedTo || 'Unassigned';
          if (!issAssigneeMap[assignee]) {
            issAssigneeMap[assignee] = {
              'Assignee Name': assignee,
              'Open Defects': 0,
              'Resolved Defects': 0,
              'Total Assigned': 0,
            };
          }
          issAssigneeMap[assignee]['Total Assigned'] += 1;
          if (['Closed', 'Resolved'].includes(iss.status)) issAssigneeMap[assignee]['Resolved Defects'] += 1;
          else issAssigneeMap[assignee]['Open Defects'] += 1;
        });
      });
      rows = Object.values(issAssigneeMap).map((a) => ({
        ...a,
        'Resolution Rate': `${a['Total Assigned'] > 0 ? Math.round((a['Resolved Defects'] / a['Total Assigned']) * 100) : 0}%`,
      }));
      break;

    case 'resolution_time':
      filtered.forEach((p) => {
        (p.issues || [])
          .filter((i) => ['Closed', 'Resolved'].includes(i.status))
          .forEach((iss) => {
            rows.push({
              'Issue ID': iss.issueId || 'ISS-00',
              'Title': iss.title,
              'Project': p.name,
              'Severity': iss.severity || 'Medium',
              'Status': iss.status,
              'Closed On': iss.updatedAt ? new Date(iss.updatedAt).toISOString().slice(0, 10) : '—',
              'Resolution Note': iss.resolution || 'Resolved as expected',
            });
          });
      });
      break;

    default:
      rows = filtered.map((p) => ({
        'Project Code': p.projectCode || 'PRJ-000',
        'Project Name': p.name || '',
        'Client': getClientName(p),
        'Category': p.category || 'General',
        'Status': p.status || 'Planning',
        'Priority': p.priority || 'Medium',
        'Progress': `${p.progress || 0}%`,
        'Budget': `$${Number(p.budget || 0).toLocaleString()}`,
        'Manager': getManagerName(p),
        'Created Date': p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : '—',
      }));
      break;
  }

  return rows;
};

export const ProjectReportsView = () => {
  const { projects = [] } = useProjects();
  const [selectedCategory, setSelectedCategory] = useState('project'); // 'project' | 'task' | 'resource' | 'financial' | 'issue'
  const [reportType, setReportType] = useState('progress');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiReportData, setApiReportData] = useState(null);

  const reportCategories = [
    { id: 'project', name: 'Project Reports', icon: Layers },
    { id: 'task', name: 'Task Reports', icon: CheckCircle2 },
    { id: 'resource', name: 'Resource Reports', icon: Clock },
    { id: 'financial', name: 'Financial Reports', icon: DollarSign },
    { id: 'issue', name: 'Issue & Bug Reports', icon: AlertTriangle },
  ];

  const subReportOptions = {
    project: [
      { id: 'progress', name: 'Project Delivery & Progress %' },
      { id: 'timeline', name: 'Timeline & Target Date Schedule' },
      { id: 'delays', name: 'Delay & Overdue Projects Audit' },
      { id: 'manager', name: 'Manager-wise Project Portfolio' },
      { id: 'client', name: 'Client-wise Project Accounts' },
    ],
    task: [
      { id: 'task_status', name: 'Task Status Breakdown' },
      { id: 'task_priority', name: 'Task Priority Analysis' },
      { id: 'task_owner', name: 'Task Owner & Assignment List' },
      { id: 'task_overdue', name: 'Overdue Project Tasks' },
      { id: 'milestone_tasks', name: 'Milestone-wise Deliverables' },
    ],
    resource: [
      { id: 'workload', name: 'Employee Workload & Capacity' },
      { id: 'assigned_vs_done', name: 'Assigned vs Completed Tasks' },
      { id: 'logged_hours', name: 'Logged vs Estimated Hours' },
      { id: 'billable', name: 'Billable vs Non-Billable Hours' },
    ],
    financial: [
      { id: 'budget_overview', name: 'Project Budget & Cost Overview' },
      { id: 'cost_variance', name: 'Cost Variance & Margin Analysis' },
      { id: 'budget_utilization', name: 'Budget Utilization % Report' },
      { id: 'planned_vs_actual', name: 'Planned vs Actual Financials' },
    ],
    issue: [
      { id: 'open_issues', name: 'Open Defect & Issue Register' },
      { id: 'severity', name: 'Issues by Severity & Impact' },
      { id: 'issue_assignee', name: 'Assignee-wise Bug Resolution' },
      { id: 'resolution_time', name: 'Closed Issues & Resolution Log' },
    ],
  };

  // Synchronously compute local rows so data is always instantly ready with zero layout jump
  const fallbackRows = useMemo(() => {
    return generateLocalReport(reportType, projects, statusFilter);
  }, [reportType, projects, statusFilter]);

  // Fetch report data in background smoothly without clearing view
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setApiReportData(null);

    const fetchReport = async () => {
      try {
        const getFn = (projectApi && typeof projectApi.getReport === 'function')
          ? projectApi.getReport
          : (projectApi && typeof projectApi.getProjectReport === 'function')
          ? projectApi.getProjectReport
          : null;

        if (getFn) {
          const res = await getFn(reportType, {
            category: selectedCategory,
            status: statusFilter,
          });

          if (isMounted && res) {
            const dataArr = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : null);
            if (dataArr && dataArr.length > 0) {
              setApiReportData(dataArr);
            }
          }
        }
      } catch (err) {
        // Fallback is already displayed seamlessly
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReport();

    return () => {
      isMounted = false;
    };
  }, [reportType, selectedCategory, statusFilter]);

  const activeRows = (apiReportData && apiReportData.length > 0) ? apiReportData : fallbackRows;

  // Filter report rows by search term
  const filteredRows = useMemo(() => {
    if (!searchTerm) return activeRows;
    const term = searchTerm.toLowerCase();
    return (activeRows || []).filter((row) =>
      Object.values(row).some((val) =>
        String(val || '').toLowerCase().includes(term)
      )
    );
  }, [activeRows, searchTerm]);

  // Dynamic MIS Summary Metrics based on currently filtered/selected report
  const summaryMetrics = useMemo(() => {
    const rows = filteredRows || [];
    const total = rows.length;

    let onTrackCount = 0;
    let atRiskCount = 0;
    let completedCount = 0;

    rows.forEach((row) => {
      const statusVal = String(
        row['Status'] ||
        row['Current Status'] ||
        row['Milestone Status'] ||
        row['Schedule Status'] ||
        row['Margin Health'] ||
        ''
      ).toLowerCase();

      const priorityVal = String(row['Priority'] || row['Severity'] || '').toLowerCase();
      const delayVal = String(row['Delay Duration'] || row['Overdue Days'] || '');

      if (
        statusVal.includes('completed') ||
        statusVal.includes('closed') ||
        statusVal.includes('delivered') ||
        statusVal.includes('resolved') ||
        statusVal.includes('done')
      ) {
        completedCount++;
      } else if (
        statusVal.includes('overdue') ||
        statusVal.includes('risk') ||
        statusVal.includes('cancelled') ||
        statusVal.includes('on hold') ||
        statusVal.includes('over budget') ||
        delayVal.length > 0 ||
        priorityVal.includes('critical') ||
        priorityVal.includes('urgent')
      ) {
        atRiskCount++;
      } else {
        onTrackCount++;
      }
    });

    return {
      total,
      onTrack: onTrackCount,
      atRisk: atRiskCount,
      completed: completedCount,
    };
  }, [filteredRows]);

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  // Helper to render enterprise cell content with badges and progress indicators
  const renderCellContent = (key, val) => {
    const strVal = String(val ?? '');
    const kLower = key.toLowerCase();
    const isStatus = kLower.includes('status') || kLower.includes('schedule') || kLower.includes('margin health');
    const isPriority = kLower.includes('priority') || kLower.includes('severity') || kLower.includes('impact');
    const isProgress = kLower.includes('progress') || kLower.includes('completion') || kLower.includes('utilization') || kLower.includes('ratio');

    // Progress visualization
    if (isProgress && strVal.includes('%')) {
      const num = parseInt(strVal, 10) || 0;
      const progressColor = num >= 100 ? '#10b981' : num >= 60 ? '#2563eb' : num >= 30 ? '#f59e0b' : '#64748b';
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '100px' }}>
          <div
            style={{
              flex: 1,
              height: '5px',
              borderRadius: '999px',
              backgroundColor: '#e2e8f0',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(num, 100)}%`,
                height: '100%',
                backgroundColor: progressColor,
                borderRadius: '999px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', minWidth: '32px', textAlign: 'right' }}>
            {strVal}
          </span>
        </div>
      );
    }

    // Status Badges
    if (isStatus) {
      if (['Completed', 'Delivered', 'Closed', 'Resolved', 'Within Budget'].some((s) => strVal.toLowerCase().includes(s.toLowerCase()))) {
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2.5px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0',
            }}
          >
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#059669' }} />
            {strVal}
          </span>
        );
      }
      if (['In Progress', 'Active', 'Approved', 'On Schedule'].some((s) => strVal.toLowerCase().includes(s.toLowerCase()))) {
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2.5px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
            }}
          >
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
            {strVal}
          </span>
        );
      }
      if (['Planning', 'Under Review', 'To Do'].some((s) => strVal.toLowerCase().includes(s.toLowerCase()))) {
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2.5px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#f8fafc',
              color: '#475569',
              border: '1px solid #cbd5e1',
            }}
          >
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#94a3b8' }} />
            {strVal}
          </span>
        );
      }
      if (['On Hold'].some((s) => strVal.toLowerCase().includes(s.toLowerCase()))) {
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2.5px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#fffbeb',
              color: '#d97706',
              border: '1px solid #fde68a',
            }}
          >
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#d97706' }} />
            {strVal}
          </span>
        );
      }
      if (['Overdue', 'Cancelled', 'Over Budget', 'Due in', 'At Risk'].some((s) => strVal.toLowerCase().includes(s.toLowerCase()))) {
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2.5px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
            }}
          >
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
            {strVal}
          </span>
        );
      }
    }

    // Priority / Severity Badges
    if (isPriority) {
      if (['Critical', 'Urgent', 'High Priority Bug'].some((p) => strVal.toLowerCase().includes(p.toLowerCase()))) {
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2.5px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
            }}
          >
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#b91c1c' }} />
            {strVal}
          </span>
        );
      }
      if (['High'].some((p) => strVal.toLowerCase() === p.toLowerCase())) {
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2.5px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#fff7ed',
              color: '#c2410c',
              border: '1px solid #fed7aa',
            }}
          >
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#c2410c' }} />
            {strVal}
          </span>
        );
      }
      if (['Medium'].some((p) => strVal.toLowerCase() === p.toLowerCase())) {
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2.5px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
            }}
          >
            {strVal}
          </span>
        );
      }
      if (['Low', 'Standard Defect'].some((p) => strVal.toLowerCase().includes(p.toLowerCase()))) {
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2.5px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#f8fafc',
              color: '#64748b',
              border: '1px solid #e2e8f0',
            }}
          >
            {strVal}
          </span>
        );
      }
    }

    // Monies / Financials
    if (strVal.startsWith('$')) {
      return (
        <span style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace, sans-serif' }}>
          {strVal}
        </span>
      );
    }

    return strVal || '—';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Category Segmented Pills */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '2px',
          scrollbarWidth: 'none',
        }}
      >
        {reportCategories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setReportType(subReportOptions[cat.id][0].id);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 14px',
                borderRadius: '10px',
                fontWeight: isActive ? 700 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: isActive ? '#0284c7' : '#ffffff',
                color: isActive ? '#ffffff' : '#475569',
                border: isActive ? '1px solid #0284c7' : '1px solid #e2e8f0',
                boxShadow: isActive ? '0 3px 10px rgba(2, 132, 199, 0.22)' : '0 1px 2px rgba(0,0,0,0.02)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <Icon size={15} />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Control Bar: Report selector, Status filter, Search Records */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '12px 16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          {/* Select Specific Report */}
          <div style={{ minWidth: '220px', flex: '1 1 220px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '10.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#64748b',
                marginBottom: '3px',
              }}
            >
              Select Report
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 32px 0 12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#1e293b',
                  cursor: 'pointer',
                  appearance: 'none',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                }}
              >
                {(subReportOptions[selectedCategory] || []).map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: '150px', flex: '0 1 170px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '10.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#64748b',
                marginBottom: '3px',
              }}
            >
              Status
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 32px 0 12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#1e293b',
                  cursor: 'pointer',
                  appearance: 'none',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <option value="all">All Statuses</option>
                <option value="In Progress">In Progress</option>
                <option value="Active">Active</option>
                <option value="Planning">Planning</option>
                <option value="Approved">Approved</option>
                <option value="Under Review">Under Review</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          {/* Search Records */}
          <div style={{ minWidth: '220px', flex: '1 1 240px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '10.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#64748b',
                marginBottom: '3px',
              }}
            >
              Search Records
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '11px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search project, code, client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  height: '36px',
                  paddingLeft: '32px',
                  paddingRight: '12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  color: '#1e293b',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        {/* Print Report Action Button */}
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingTop: '16px' }}>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              height: '36px',
              padding: '0 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              color: '#334155',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.borderColor = '#94a3b8';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            title="Print Current Report View"
          >
            <Printer size={14} color="#475569" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 3. Enterprise Report Table Container (Dynamic Height - No Huge Empty Space) */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Report Card Subheader with Dynamic Record Count */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} style={{ color: '#0284c7' }} />
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
              {subReportOptions[selectedCategory]?.find((s) => s.id === reportType)?.name || 'Report View'}
            </h4>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {loading && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#0284c7', fontWeight: 700 }}>
                <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Syncing...</span>
              </span>
            )}
            <span
              style={{
                fontSize: '11.5px',
                color: '#475569',
                fontWeight: 700,
                backgroundColor: '#ffffff',
                padding: '3px 9px',
                borderRadius: '999px',
                border: '1px solid #cbd5e1',
              }}
            >
              {filteredRows.length} {filteredRows.length === 1 ? 'record' : 'records'} generated
            </span>
          </div>
        </div>

        {/* Dynamic Table Body / Empty State */}
        {filteredRows.length === 0 ? (
          <div
            style={{
              padding: '48px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                marginBottom: '10px',
              }}
            >
              <Search size={22} />
            </div>
            <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>
              No records found
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              Try changing your filters or search criteria.
            </p>
          </div>
        ) : (
          <div
            style={{
              overflowX: 'auto',
              overflowY: 'auto',
              maxHeight: '480px',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '12.5px',
              }}
            >
              <thead
                style={{
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  color: '#475569',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  fontSize: '10.5px',
                  letterSpacing: '0.04em',
                  position: 'sticky',
                  top: 0,
                  zIndex: 2,
                }}
              >
                <tr>
                  {Object.keys(filteredRows[0]).map((key) => (
                    <th
                      key={key}
                      style={{
                        padding: '10px 16px',
                        whiteSpace: 'nowrap',
                        backgroundColor: '#f8fafc',
                      }}
                    >
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#fafafa';
                    }}
                  >
                    {Object.entries(row).map(([k, val], valIdx) => (
                      <td
                        key={valIdx}
                        style={{
                          padding: '10px 16px',
                          color: '#1e293b',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle',
                        }}
                      >
                        {renderCellContent(k, val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectReportsView;
