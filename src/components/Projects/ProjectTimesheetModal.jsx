import React, { useState, useEffect } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Clock,
  Calendar,
  Layers,
  DollarSign,
  AlertCircle,
  FileText,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

export const ProjectTimesheetModal = ({
  isOpen,
  onClose,
  project: propProject,
  initialTimesheet = null,
}) => {
  const { addTimesheet, selectedProject, projects } = useProjects();
  const { user: currentUser } = useAuth();

  const currentProject = propProject || selectedProject || (projects.length > 0 ? projects[0] : null);

  const [formData, setFormData] = useState({
    user: '',
    date: '',
    phase: '',
    milestone: '',
    task: '',
    startTime: '09:00',
    endTime: '17:00',
    hours: 8,
    isBillable: true,
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Auto calculate total hours from startTime & endTime
  const calculateHours = (start, end) => {
    if (!start || !end) return 8;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const diff = h2 * 60 + m2 - (h1 * 60 + m1);
    return diff > 0 ? Number((diff / 60).toFixed(2)) : 0;
  };

  const handleTimeChange = (field, val) => {
    const updated = { ...formData, [field]: val };
    const start = field === 'startTime' ? val : formData.startTime;
    const end = field === 'endTime' ? val : formData.endTime;
    const hrs = calculateHours(start, end);
    setFormData({ ...updated, hours: hrs });
  };

  useEffect(() => {
    if (initialTimesheet) {
      setFormData({
        user: initialTimesheet.user || currentUser?.name || '',
        date: initialTimesheet.date ? initialTimesheet.date.split('T')[0] : '',
        phase: initialTimesheet.phase || '',
        milestone: initialTimesheet.milestone || '',
        task: initialTimesheet.task || '',
        startTime: initialTimesheet.startTime || '09:00',
        endTime: initialTimesheet.endTime || '17:00',
        hours: initialTimesheet.hours || 8,
        isBillable: initialTimesheet.isBillable !== false,
        notes: initialTimesheet.notes || '',
      });
    } else {
      setFormData({
        user: currentUser?.name || 'Current User',
        date: new Date().toISOString().split('T')[0],
        phase: currentProject?.phases?.[0]?.name || '',
        milestone: currentProject?.milestones?.[0]?.name || '',
        task: currentProject?.tasks?.[0]?.taskName || currentProject?.tasks?.[0]?.title || '',
        startTime: '09:00',
        endTime: '17:00',
        hours: 8,
        isBillable: true,
        notes: '',
      });
    }
    setError(null);
  }, [initialTimesheet, isOpen, currentProject, currentUser]);

  if (!isOpen || !currentProject) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.hours || formData.hours <= 0) {
      setError('Logged hours must be greater than 0.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await addTimesheet(currentProject._id, formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to log timesheet.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Log Time & Timesheet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Project: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{currentProject.name || currentProject.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Member & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                Team Member
              </label>
              <input
                type="text"
                readOnly
                value={formData.user}
                className="w-full h-10 px-3.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Task or Activity */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
              Related Task / Deliverable
            </label>
            <div className="relative">
              <select
                value={formData.task}
                onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                className="w-full h-10 px-3.5 pr-9 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              >
                <option value="General Project Work">General Project Work</option>
                {(currentProject.tasks || []).map((t, idx) => (
                  <option key={idx} value={t.taskName || t.title}>
                    {t.taskName || t.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Time range & Hours */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleTimeChange('startTime', e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                Total Hours
              </label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Billable checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="billableCheck"
              checked={formData.isBillable}
              onChange={(e) => setFormData({ ...formData, isBillable: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            <label htmlFor="billableCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Mark this time entry as Billable to Client
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
              Work Notes & Summary
            </label>
            <textarea
              rows={3}
              placeholder="What deliverables or tickets were worked on during this time?"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              {submitting ? 'Logging...' : 'Log Timesheet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectTimesheetModal;
