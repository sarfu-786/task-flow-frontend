import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { subscriptionApi } from '../services/api';
import { socketService } from '../services/socket';

const SubscriptionContext = createContext(null);

export const DEFAULT_MODULE_CATALOG = {
  leads: {
    id: 'leads',
    name: 'Lead Management',
    description: 'CRM sales pipeline, lead scoring, deal values & coordinator routing',
    annualPriceUSD: 120,
    annualPriceINR: 9999,
    icon: 'Target',
    color: '#2563eb',
    features: [
      'Interactive pipeline stages (New to Won)',
      'Lead scoring & deal value estimation',
      'Sales Coordinator assignment & tracking',
      'One-click conversion to Opportunity & Projects',
    ],
  },
  complaints: {
    id: 'complaints',
    name: 'Complaint Management',
    description: 'Post-sales ticketing, SLA countdown alerts, RCA, CSAT & service routing',
    annualPriceUSD: 100,
    annualPriceINR: 7999,
    icon: 'AlertCircle',
    color: '#dc2626',
    features: [
      'SLA countdown monitors & breach alerts',
      'Root Cause Analysis (RCA) & resolution logs',
      'Customer Satisfaction (CSAT 1-5★) rating',
      'Service Coordinator assignment & escalation',
    ],
  },
  tasks: {
    id: 'tasks',
    name: 'Task Management',
    description: 'Organizational task workflows, hierarchy assignment, priority matrix & status tracking',
    annualPriceUSD: 80,
    annualPriceINR: 5999,
    icon: 'CheckSquare',
    color: '#0891b2',
    features: [
      'Hierarchy-aware task delegation & assignments',
      'Priority & SLA expected date deadline tracking',
      'Task category filters (Internet, Documentation, Social, Backend)',
      '1-click status completion and review remarks',
    ],
  },
  projects: {
    id: 'projects',
    name: 'Project Management',
    description: 'Project lifecycle, milestone checklists, budget monitoring & deliverable tasks',
    annualPriceUSD: 150,
    annualPriceINR: 11999,
    icon: 'FolderKanban',
    color: '#059669',
    features: [
      'Milestone checklists with auto progress % calculation',
      'Budget tracking & schedule health monitors',
      'Integrated team deliverable task allocations',
      'Project status lifecycle (Planning to Completed)',
    ],
  },
};

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(() => {
    try {
      const saved = localStorage.getItem('taskflow_subscription');
      return saved
        ? JSON.parse(saved)
        : {
            organizationName: 'TaskFlow Enterprise Client',
            activeModules: ['leads', 'complaints', 'tasks', 'projects'],
            userSeats: 12,
            currency: 'USD',
            totalAnnualBilling: 5400,
            activeModuleCount: 4,
            breakdown: [],
          };
    } catch {
      return {
        organizationName: 'TaskFlow Enterprise Client',
        activeModules: ['leads', 'complaints', 'tasks', 'projects'],
        userSeats: 12,
        currency: 'USD',
        totalAnnualBilling: 5400,
        activeModuleCount: 4,
        breakdown: [],
      };
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch subscription data
  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await subscriptionApi.getSubscription();
      if (res && res.success && res.data) {
        setSubscription(res.data);
        localStorage.setItem('taskflow_subscription', JSON.stringify(res.data));
      }
    } catch (err) {
      console.warn('Subscription fetch notice:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Socket listener for real-time module & seat changes
  useEffect(() => {
    fetchSubscription();

    const unsub1 = socketService.on('modules_updated', (updatedData) => {
      if (updatedData) {
        setSubscription(updatedData);
        localStorage.setItem('taskflow_subscription', JSON.stringify(updatedData));
      }
    });

    const unsub2 = socketService.on('subscription_updated', (updatedData) => {
      if (updatedData) {
        setSubscription(updatedData);
        localStorage.setItem('taskflow_subscription', JSON.stringify(updatedData));
      }
    });

    return () => {
      if (unsub1) unsub1();
      if (unsub2) unsub2();
    };
  }, [fetchSubscription]);

  // Helper: check if a specific module is active
  const isModuleActive = useCallback(
    (moduleId) => {
      if (!subscription || !Array.isArray(subscription.activeModules)) return true;
      return subscription.activeModules.includes(moduleId);
    },
    [subscription]
  );

  // Toggle module on/off
  const toggleModule = async (moduleId) => {
    const currentModules = subscription.activeModules || ['leads', 'complaints', 'tasks', 'projects'];
    let nextModules;
    if (currentModules.includes(moduleId)) {
      // Don't allow disabling all modules (at least 1 must remain active)
      if (currentModules.length === 1) {
        throw new Error('At least one module must remain active in your subscription.');
      }
      nextModules = currentModules.filter((m) => m !== moduleId);
    } else {
      nextModules = [...currentModules, moduleId];
    }

    try {
      setLoading(true);
      const res = await subscriptionApi.updateModules(nextModules);
      if (res && res.success && res.data) {
        setSubscription(res.data);
        localStorage.setItem('taskflow_subscription', JSON.stringify(res.data));
        return res.data;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user seats
  const updateSeats = async (count) => {
    const newSeats = Math.max(1, parseInt(count, 10));
    try {
      setLoading(true);
      const res = await subscriptionApi.updateSeats(newSeats);
      if (res && res.success && res.data) {
        setSubscription(res.data);
        localStorage.setItem('taskflow_subscription', JSON.stringify(res.data));
        return res.data;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Set currency USD / INR
  const setCurrency = async (cur) => {
    try {
      setLoading(true);
      const res = await subscriptionApi.updateCurrency(cur);
      if (res && res.success && res.data) {
        setSubscription(res.data);
        localStorage.setItem('taskflow_subscription', JSON.stringify(res.data));
        return res.data;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        activeModules: subscription.activeModules || ['leads', 'complaints', 'tasks', 'projects'],
        userSeats: subscription.userSeats || 12,
        currency: subscription.currency || 'USD',
        totalAnnualBilling: subscription.totalAnnualBilling || 0,
        breakdown: subscription.breakdown || [],
        catalog: DEFAULT_MODULE_CATALOG,
        loading,
        error,
        fetchSubscription,
        isModuleActive,
        toggleModule,
        updateSeats,
        setCurrency,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
