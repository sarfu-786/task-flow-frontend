/**
 * Intelligent Complaint Routing Helper (Skill & Location Aware Dispatch)
 * Matches complaint category with employee department, submitter location,
 * and Live Availability / Ongoing Service Workload (ETA).
 */

// Comprehensive Category to Department keyword mappings
// IMPORTANT: Specific categories MUST come before generic "Customer Support & Helpdesk"
// so phrases like "IT Support" or "Legacy Support" never leak into Customer Support.
const CATEGORY_DEPARTMENT_MAP = [
  {
    categoryKeywords: ['technical', 'it support', 'backend', 'system', 'glitch', 'crash', 'freeze', 'sync', 'api', 'database', 'server', 'code', 'bug', 'hardware', 'access', '2fa', 'saml'],
    departmentKeywords: ['backend', 'technical', 'it support', 'systems', 'engineer', 'development', 'tech', 'it '],
    recommendedDeptName: 'Technical & IT Support (Backend & Systems)',
  },
  {
    categoryKeywords: ['internet', 'network', 'wifi', 'broadband', 'bandwidth', 'dns', 'vpn', 'router', 'modem', 'firewall', 'latency'],
    departmentKeywords: ['internet', 'network', 'infrastructure', 'telecom'],
    recommendedDeptName: 'Internet & Network Work (Legacy Support)',
  },
  {
    categoryKeywords: ['sales', 'sells', 'sell', 'sale', 'pricing', 'quote', 'quotation', 'commercial', 'contract', 'deal', 'demo', 'proposal', 'lead'],
    departmentKeywords: ['sales', 'sells', 'sell', 'sale', 'business development', 'commercial'],
    recommendedDeptName: 'Sales & Business Development (Sells)',
  },
  {
    categoryKeywords: ['operations', 'field', 'logistics', 'delivery', 'shipment', 'dispatch', 'tracking', 'on-site', 'installation', 'transit', 'defect', 'product', 'damage', 'physical'],
    departmentKeywords: ['operations', 'logistics', 'field', 'dispatch', 'supply chain'],
    recommendedDeptName: 'Operations & Field Logistics',
  },
  {
    categoryKeywords: ['account', 'accounts', 'billing', 'bill', 'finance', 'invoice', 'payment', 'refund', 'charge', 'tax', 'gst', 'subscription', 'deduction'],
    departmentKeywords: ['accounts', 'account', 'billing', 'finance', 'invoicing'],
    recommendedDeptName: 'Accounts & Billing (Finance)',
  },
  {
    categoryKeywords: ['documentation', 'quality', 'back office', 'compliance', 'regulatory', 'audit', 'kyc', 'verification', 'records', 'sop'],
    departmentKeywords: ['documentation', 'quality', 'back office', 'compliance', 'audit'],
    recommendedDeptName: 'Documentation & Quality (Back Office)',
  },
  {
    categoryKeywords: ['social media', 'social', 'marketing', 'campaign', 'pr', 'public relations', 'brand', 'promotional'],
    departmentKeywords: ['social media', 'social', 'marketing', 'pr', 'brand'],
    recommendedDeptName: 'Social Media & Marketing',
  },
  {
    categoryKeywords: ['customer support', 'helpdesk', 'general support', 'help', 'service', 'inquiry', 'grievance', 'assistance', 'feedback', 'communication', 'support'],
    departmentKeywords: ['customer support', 'helpdesk', 'customer service', 'client support', 'client care'],
    recommendedDeptName: 'Customer Support & Helpdesk',
  },
];

/**
 * Checks if a user's department strictly matches a complaint's category (1-to-1, no cross-department leakage)
 */
export const matchDepartmentCategory = (category = '', department = '') => {
  const cat = (category || '').toLowerCase().trim();
  const dept = (department || '').toLowerCase().trim();
  if (!cat || !dept) return false;

  // Direct exact match
  if (cat === dept) return true;

  // Strip brackets / extra notes for clean comparison: e.g. "Accounts & Billing (Finance)" -> "Accounts & Billing"
  const cleanCat = cat.replace(/\s*\([^)]*\)/g, '').trim();
  const cleanDept = dept.replace(/\s*\([^)]*\)/g, '').trim();
  if (cleanCat && cleanDept && cleanCat === cleanDept) {
    return true;
  }

  // Find the SINGLE most specific category rule first (strict 1-to-1 match, never fall through)
  const matchedRule = CATEGORY_DEPARTMENT_MAP.find((mapping) =>
    mapping.categoryKeywords.some((kw) => cleanCat.includes(kw) || cat.includes(kw))
  );

  if (matchedRule) {
    return matchedRule.departmentKeywords.some(
      (kw) => cleanDept.includes(kw) || dept.includes(kw)
    );
  }

  // Fallback only if category is completely custom/unmapped
  return cleanCat.length >= 4 && cleanDept.length >= 4 && (cleanCat.includes(cleanDept) || cleanDept.includes(cleanCat));
};

/**
 * Gets human-readable recommended department name for a category
 */
export const getRecommendedDepartment = (category = '') => {
  const cat = (category || '').toLowerCase().trim();
  if (!cat) return 'Customer Support & Helpdesk';

  for (const mapping of CATEGORY_DEPARTMENT_MAP) {
    if (mapping.categoryKeywords.some((kw) => cat.includes(kw))) {
      return mapping.recommendedDeptName;
    }
  }
  return 'Customer Support & Helpdesk';
};

/**
 * Checks if user's location/city matches the complaint's captured location
 */
export const matchLocation = (complaintLocation = null, user = null) => {
  if (!complaintLocation || !user) return false;

  const userCity = (user.city || user.location || user.address || '').toLowerCase().trim();
  const compCity = (complaintLocation.city || '').toLowerCase().trim();
  const compState = (complaintLocation.state || '').toLowerCase().trim();
  const compAddress = (complaintLocation.address || '').toLowerCase().trim();

  if (!userCity) return false;

  return (
    (compCity && (userCity.includes(compCity) || compCity.includes(userCity))) ||
    (compState && (userCity.includes(compState) || compState.includes(userCity))) ||
    (compAddress && compAddress.includes(userCity))
  );
};

/**
 * Evaluates live availability and ongoing service workload for a user
 * @param {Object} user - User object
 * @param {Array} complaints - List of all complaints
 * @returns {Object} Availability details (status, eta, badge, color)
 */
export const getUserAvailability = (user = null, complaints = []) => {
  if (!user) {
    return {
      status: 'unknown',
      badge: 'Status Unknown',
      shortBadge: 'Unknown',
      etaText: 'Availability not recorded',
      color: '#64748b',
      bgColor: '#f8fafc',
      borderColor: '#e2e8f0',
      isAvailable: true,
      activeCount: 0,
    };
  }

  const activeStatuses = ['Logged', 'Open', 'In Progress', 'Assigned', 'Under Investigation', 'Reopened', 'Awaiting Customer'];
  const uid = (user._id || user.id || '').toString();
  const uName = (user.name || '').toLowerCase().trim();

  const userActiveComplaints = (complaints || []).filter((c) => {
    if (!c || !activeStatuses.includes(c.status)) return false;
    const cAssigneeId = (c.assignedTo?._id || c.assignedTo || '').toString();
    const cAssigneeName = (c.assignedToName || '').toLowerCase().trim();
    return (uid && cAssigneeId === uid) || (uName && cAssigneeName === uName);
  });

  const activeCount = userActiveComplaints.length;
  // Ongoing service or investigation
  const inProgressTicket = userActiveComplaints.find(
    (c) => c.status === 'In Progress' || c.status === 'Under Investigation'
  );

  // Case 1: In Progress / On Service
  if (inProgressTicket) {
    let estMinutes = 45;
    if (inProgressTicket.slaDeadline) {
      const msLeft = new Date(inProgressTicket.slaDeadline) - new Date();
      if (msLeft > 0) {
        estMinutes = Math.max(15, Math.round(msLeft / (1000 * 60)));
      }
    } else if (inProgressTicket.slaHours) {
      estMinutes = Math.min(180, Math.max(30, inProgressTicket.slaHours * 15));
    }

    let etaFormatted = '';
    if (estMinutes < 60) {
      etaFormatted = `~${estMinutes}m`;
    } else {
      const hrs = Math.max(1, Math.round(estMinutes / 60));
      etaFormatted = `~${hrs}h`;
    }

    const ticketNo = inProgressTicket.ticketNumber || 'active task';

    return {
      status: 'in_service',
      badge: `🟡 On Service (Est. free ${etaFormatted})`,
      shortBadge: `🟡 Busy (${etaFormatted})`,
      etaText: `Currently on service (${ticketNo}) • Est. free in ${etaFormatted}`,
      ticketNumber: ticketNo,
      activeCount,
      color: '#d97706',
      bgColor: '#fffbeb',
      borderColor: '#fde68a',
      isAvailable: false,
    };
  }

  // Case 2: High Workload (>= 3 active tickets queued)
  if (activeCount >= 3) {
    return {
      status: 'busy',
      badge: `🔴 Heavy Load (${activeCount} tickets)`,
      shortBadge: `🔴 Queue (${activeCount})`,
      etaText: `Queue active with ${activeCount} tickets • Next slot delayed`,
      ticketNumber: null,
      activeCount,
      color: '#dc2626',
      bgColor: '#fef2f2',
      borderColor: '#fecaca',
      isAvailable: false,
    };
  }

  // Case 3: Available Now (0 in progress, < 3 active)
  const isCompletelyFree = activeCount === 0;
  return {
    status: 'available',
    badge: isCompletelyFree ? '🟢 Available Now' : `🟢 Ready (${activeCount} assigned)`,
    shortBadge: '🟢 Ready',
    etaText: isCompletelyFree
      ? 'Available now • Ready for immediate dispatch'
      : `Ready for dispatch • ${activeCount} open ticket queued`,
    ticketNumber: null,
    activeCount,
    color: '#059669',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    isAvailable: true,
  };
};

/**
 * Ranks authorized users by Skill and Live Availability match against a complaint
 * @param {Array} users - list of user objects
 * @param {string} category - complaint category
 * @param {Object} location - ignored (kept for signature compatibility)
 * @param {Array} complaints - list of all complaints (for live workload & availability)
 * @returns {Array} sorted array with match metadata
 */
export const getRankedAssignees = (users = [], category = '', location = null, complaints = []) => {
  if (!Array.isArray(users)) return [];

  const evaluated = users.map((u) => {
    const isSkillMatch = matchDepartmentCategory(category, u.department);
    const availability = getUserAvailability(u, complaints);

    let matchLabel = '';
    let score = 0;

    if (isSkillMatch) {
      score += 20;
      matchLabel = `⭐ Department Match (${u.department || 'Dept'})`;
    } else {
      score += 0;
      matchLabel = u.department || 'Customer Support';
    }

    // Availability scoring bonus / penalty
    if (availability.status === 'available') {
      score += 10;
    } else if (availability.status === 'in_service') {
      score -= 5;
    } else if (availability.status === 'busy') {
      score -= 10;
    }

    return {
      user: u,
      isSkillMatch,
      isLocationMatch: false,
      isRecommended: isSkillMatch,
      availability,
      matchLabel,
      score,
    };
  });

  // Sort descending by score, keeping stable sort for equal scores
  return evaluated.sort((a, b) => b.score - a.score);
};
