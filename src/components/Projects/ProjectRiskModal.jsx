import React, { useState, useEffect } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';

export const ProjectRiskModal = ({ isOpen, onClose, project: propProject, initialRisk = null }) => {
  const { addRisk, updateRisk, selectedProject, projects } = useProjects();
  const { user: currentUser } = useAuth();

  const currentProject = propProject || selectedProject || (projects.length > 0 ? projects[0] : null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    probability: 'Medium',
    impact: 'Medium',
    riskLevel: 'Medium',
    owner: '',
    mitigationPlan: '',
    dueDate: '',
    status: 'Identified',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Auto calculate risk level based on probability & impact
  const calculateRiskLevel = (prob, imp) => {
    if (prob === 'High' && imp === 'High') return 'Critical';
    if ((prob === 'High' && imp === 'Medium') || (prob === 'Medium' && imp === 'High')) return 'High';
    if (prob === 'Low' && imp === 'Low') return 'Low';
    return 'Medium';
  };

  const handleProbImpactChange = (field, val) => {
    const updated = { ...formData, [field]: val };
    const level = calculateRiskLevel(
      field === 'probability' ? val : formData.probability,
      field === 'impact' ? val : formData.impact
    );
    setFormData({ ...updated, riskLevel: level });
  };

  useEffect(() => {
    if (initialRisk) {
      setFormData({
        title: initialRisk.title || '',
        description: initialRisk.description || '',
        probability: initialRisk.probability || 'Medium',
        impact: initialRisk.impact || 'Medium',
        riskLevel: initialRisk.riskLevel || 'Medium',
        owner: initialRisk.owner || '',
        mitigationPlan: initialRisk.mitigationPlan || '',
        dueDate: initialRisk.dueDate ? initialRisk.dueDate.split('T')[0] : '',
        status: initialRisk.status || 'Identified',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        probability: 'Medium',
        impact: 'Medium',
        riskLevel: 'Medium',
        owner: currentProject?.managerName || currentProject?.projectManager || currentUser?.name || '',
        mitigationPlan: '',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Identified',
      });
    }
    setError(null);
  }, [initialRisk, isOpen, currentProject, currentUser]);

  if (!isOpen || !currentProject) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Risk Title is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (initialRisk && initialRisk._id) {
        await updateRisk(currentProject._id, initialRisk._id, formData);
      } else {
        await addRisk(currentProject._id, formData);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save risk item.');
    } finally {
      setSubmitting(false);
    }
  };

  const projectMembers = [
    ...(currentProject.teamMembers || []).map((m) => m.name || m.user),
    currentProject.managerName,
    currentProject.projectManager,
    currentProject.ownerName,
    currentProject.projectOwner,
    currentUser?.name,
  ].filter(Boolean);

  const uniqueMembers = Array.from(new Set(projectMembers));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                {initialRisk ? 'Edit Project Risk' : 'Register Risk & Mitigation'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
              Risk Title / Threat Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Third-party payment gateway API rate limiting"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
            />
          </div>

          {/* Probability & Impact Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                Probability
              </label>
              <div className="relative">
                <select
                  value={formData.probability}
                  onChange={(e) => handleProbImpactChange('probability', e.target.value)}
                  className="w-full h-10 px-3.5 pr-9 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="Low">Low (Unlikely)</option>
                  <option value="Medium">Medium (Moderate)</option>
                  <option value="High">High (Probable)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                Impact
              </label>
              <div className="relative">
                <select
                  value={formData.impact}
                  onChange={(e) => handleProbImpactChange('impact', e.target.value)}
                  className="w-full h-10 px-3.5 pr-9 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="Low">Low (Minor)</option>
                  <option value="Medium">Medium (Moderate)</option>
                  <option value="High">High (Severe)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                Risk Level (Computed)
              </label>
              <div
                className={`h-10 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center border ${
                  formData.riskLevel === 'Critical'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    : formData.riskLevel === 'High'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                }`}
              >
                {formData.riskLevel}
              </div>
            </div>
          </div>

          {/* Mitigation Plan */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
              Mitigation Plan & Contingency Strategy
            </label>
            <textarea
              rows={3}
              placeholder="Action plan to eliminate or mitigate the risk probability and impact..."
              value={formData.mitigationPlan}
              onChange={(e) => setFormData({ ...formData, mitigationPlan: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-white"
            />
          </div>

          {/* Owner, Due Date, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                Risk Owner
              </label>
              <div className="relative">
                <select
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  className="w-full h-10 px-3.5 pr-9 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="Unassigned">Unassigned</option>
                  {uniqueMembers.map((name, idx) => (
                    <option key={idx} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                Review Target Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                Risk Status
              </label>
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-10 px-3.5 pr-9 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="Identified">Identified</option>
                  <option value="Mitigated">Mitigated</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Closed">Closed</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
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
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20 transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {submitting ? 'Saving...' : initialRisk ? 'Update Risk' : 'Register Risk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectRiskModal;
