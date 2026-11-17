/**
 * Standard Organizational Departments and Complaint Categories
 * 1-to-1 sync between Organization Fields (User Department) and Support Work (Complaint Categories)
 */

export const CORE_DEPARTMENTS = [
  {
    id: 'Customer Support & Helpdesk',
    name: 'Customer Support & Helpdesk',
    badgeLabel: 'Customer Support & Helpdesk ⭐',
    subtitle: 'Main CRM Department - Client queries, ticket triage & escalation',
    color: '#059669',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  {
    id: 'Technical & IT Support (Backend & Systems)',
    name: 'Technical & IT Support (Backend & Systems)',
    badgeLabel: 'Technical & IT Support',
    subtitle: 'Backend services, database, system crashes, APIs & bug fixes',
    color: '#1d4ed8',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  {
    id: 'Sales & Business Development (Sells)',
    name: 'Sales & Business Development (Sells)',
    badgeLabel: 'Sales & BD (Sells)',
    subtitle: 'Commercial terms, pricing, plan renewal & client proposals',
    color: '#4f46e5',
    bgColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  {
    id: 'Operations & Field Logistics',
    name: 'Operations & Field Logistics',
    badgeLabel: 'Operations & Logistics',
    subtitle: 'Shipment tracking, courier dispatch, physical defects & on-site visits',
    color: '#c2410c',
    bgColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  {
    id: 'Accounts & Billing (Finance)',
    name: 'Accounts & Billing (Finance)',
    badgeLabel: 'Accounts & Billing',
    subtitle: 'Invoicing, duplicate charges, refunds, GST & payment gateways',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
  },
  {
    id: 'Documentation & Quality (Back Office)',
    name: 'Documentation & Quality (Back Office)',
    badgeLabel: 'Documentation & Quality',
    subtitle: 'KYC, regulatory compliance, data records & quality audits',
    color: '#0f766e',
    bgColor: '#f0fdfa',
    borderColor: '#99f6e4',
  },
  {
    id: 'Social Media & Marketing',
    name: 'Social Media & Marketing',
    badgeLabel: 'Social Media & Marketing',
    subtitle: 'Social channels, public grievances, PR & campaign queries',
    color: '#db2777',
    bgColor: '#fdf2f8',
    borderColor: '#fbcfe8',
  },
  {
    id: 'Internet & Network Work (Legacy Support)',
    name: 'Internet & Network Work (Legacy Support)',
    badgeLabel: 'Internet & Network Work',
    subtitle: 'Network connectivity, DNS, broadband, routers & VPN',
    color: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
];

export const PRIMARY_CATEGORY_NAMES = CORE_DEPARTMENTS.map((d) => d.id);

export const LEGACY_DEPARTMENTS = [
  'Internet Work',
  'Documentation',
  'Backend Work',
  'Social Media',
  'Operations',
  'Sells',
  'Accounts',
];

export const COMPLAINT_CATEGORIES = {
  // 1. Customer Support & Helpdesk
  'Customer Support & Helpdesk': [
    'General Inquiry / Help',
    'Onboarding & Setup Assistance',
    'Product Feedback & Suggestions',
    'Staff Communication & Behaviour',
    'Response SLA Delay',
    'Escalated Grievance',
    'Other Customer Query',
  ],

  // 2. Technical & IT Support (Backend & Systems)
  'Technical & IT Support (Backend & Systems)': [
    'System Crash & Downtime',
    'UI Freeze & Page Errors',
    'Database & Server Issues',
    'API & Integration Failure',
    'Sync & Realtime Lag',
    'Authentication & 2FA Access',
    'Other Technical Glitch',
  ],

  // 3. Sales & Business Development (Sells)
  'Sales & Business Development (Sells)': [
    'Pricing & Quotation Inquiry',
    'Plan Upgrade & Renewal',
    'Commercial Contract Terms',
    'Sales Rep Follow-up Missed',
    'Demo & Proposal Request',
    'Deal Negotiation Assistance',
    'Other Sales Query',
  ],

  // 4. Operations & Field Logistics
  'Operations & Field Logistics': [
    'Delivery & Shipment Delay',
    'Damaged / Missing Shipment',
    'Field Executive Service Call',
    'Hardware & Device Malfunction',
    'Dispatch & Tracking Error',
    'On-site Installation Issue',
    'Other Operations Work',
  ],

  // 5. Accounts & Billing (Finance)
  'Accounts & Billing (Finance)': [
    'Incorrect Invoice Amount',
    'Payment Gateway / Charge Failure',
    'Duplicate Deduction / Charge',
    'Refund Processing Delay',
    'Tax & GST Discrepancy',
    'Subscription Auto-Renewal Issue',
    'Other Billing Inquiry',
  ],

  // 6. Documentation & Quality (Back Office)
  'Documentation & Quality (Back Office)': [
    'Missing / Incomplete Documents',
    'KYC & Verification Failure',
    'Compliance & Regulatory Audit',
    'Data Entry / Record Inaccuracy',
    'SOP & Standard Process Defect',
    'Quality Inspection Failure',
    'Other Documentation Issue',
  ],

  // 7. Social Media & Marketing
  'Social Media & Marketing': [
    'Social Channel Escalation / Post',
    'Campaign & Promotional Offer Query',
    'Ad Campaign Lead Discrepancy',
    'Public Relations / Brand Query',
    'Marketing Email Unsubscribe / Spam',
    'Community Forum Moderation',
    'Other Marketing Issue',
  ],

  // 8. Internet & Network Work (Legacy Support)
  'Internet & Network Work (Legacy Support)': [
    'Network Outage & Disconnection',
    'Bandwidth Speed & High Latency',
    'DNS & Domain Configuration',
    'VPN & Remote Gateway Error',
    'Modem & Router Hardware Issue',
    'Firewall & Port Restriction',
    'Other Network Problem',
  ],

  // Clean Short Aliases (for direct programmatic calls)
  'Customer Support': [
    'General Inquiry / Help',
    'Onboarding & Setup Assistance',
    'Product Feedback & Suggestions',
    'Staff Communication & Behaviour',
    'Response SLA Delay',
    'Escalated Grievance',
    'Other Customer Query',
  ],
  'Technical & IT Support': [
    'System Crash & Downtime',
    'UI Freeze & Page Errors',
    'Database & Server Issues',
    'API & Integration Failure',
    'Sync & Realtime Lag',
    'Authentication & 2FA Access',
    'Other Technical Glitch',
  ],
  'Sales & Business Development': [
    'Pricing & Quotation Inquiry',
    'Plan Upgrade & Renewal',
    'Commercial Contract Terms',
    'Sales Rep Follow-up Missed',
    'Demo & Proposal Request',
    'Other Sales Query',
  ],
  'Accounts & Billing': [
    'Incorrect Invoice Amount',
    'Payment Gateway / Charge Failure',
    'Duplicate Deduction / Charge',
    'Refund Processing Delay',
    'Tax & GST Discrepancy',
    'Other Billing Inquiry',
  ],
  'Documentation & Quality': [
    'Missing / Incomplete Documents',
    'KYC & Verification Failure',
    'Compliance & Regulatory Audit',
    'Data Entry / Record Inaccuracy',
    'Other Documentation Issue',
  ],
  'Internet & Network Work': [
    'Network Outage & Disconnection',
    'Bandwidth Speed & High Latency',
    'DNS & Domain Configuration',
    'VPN & Remote Gateway Error',
    'Other Network Problem',
  ],

  // Backward Compatible Legacy Categories
  'Technical Glitch': [
    'System Crash',
    'Page Freeze',
    'Sync Error',
    'API Timeout',
    'Database Connection',
    'Performance Lag',
    'Other Technical',
  ],
  'Product Defect': [
    'Physical Damage',
    'Missing Component',
    'Packaging Issue',
    'Firmware Error',
    'Manufacturing Flaw',
    'Specification Mismatch',
    'Other Defect',
  ],
  'Service Delay': [
    'Delayed Onboarding',
    'Response SLA Lag',
    'Late Delivery',
    'Maintenance Overrun',
    'Appointment Missed',
    'Other Delay',
  ],
  'Billing Query': [
    'Incorrect Invoice',
    'Duplicate Charge',
    'Refund Request',
    'Tax Discrepancy',
    'Payment Gateway Failure',
    'Subscription Renewal Issue',
    'Other Billing',
  ],
  'Hardware Fault': [
    'Power Supply Failure',
    'Screen Display Issue',
    'Sensor Malfunction',
    'Overheating',
    'Connector Broken',
    'Other Hardware',
  ],
  'Account Access': [
    'Password Reset',
    '2FA Authentication Failure',
    'Permission Denied',
    'SSO SAML Failure',
    'Account Locked',
    'User De-provisioning',
    'Other Access',
  ],
  'Quality Assurance': [
    'Code Standard Defect',
    'Process Non-Compliance',
    'Audit Finding',
    'Documentation Gap',
    'Security Vulnerability',
    'Other QA',
  ],
  'General Support': [
    'How-To Inquiry',
    'Feature Request',
    'Product Feedback',
    'General Consultation',
    'Feedback',
  ],
};

/**
 * Returns badge styling for any department or complaint category
 */
export const getCategoryBadgeStyle = (categoryOrDept = '') => {
  const target = (categoryOrDept || '').toLowerCase().trim();

  if (target.includes('technical') || target.includes('backend') || target.includes('glitch') || target.includes('hardware')) {
    return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
  }
  if (target.includes('customer support') || target.includes('helpdesk') || target.includes('general support')) {
    return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
  }
  if (target.includes('sale') || target.includes('sell') || target.includes('commercial')) {
    return { bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe' };
  }
  if (target.includes('operation') || target.includes('logistic') || target.includes('delivery') || target.includes('defect')) {
    return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' };
  }
  if (target.includes('account') || target.includes('bill') || target.includes('finance') || target.includes('invoice')) {
    return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' };
  }
  if (target.includes('document') || target.includes('quality') || target.includes('back office')) {
    return { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' };
  }
  if (target.includes('social') || target.includes('marketing')) {
    return { bg: '#fdf2f8', color: '#be185d', border: '#fbcfe8' };
  }
  if (target.includes('internet') || target.includes('network')) {
    return { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' };
  }

  return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
};
