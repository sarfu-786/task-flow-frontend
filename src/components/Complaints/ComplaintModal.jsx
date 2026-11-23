import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { useUserManagement } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { useOpportunities } from '../../context/OpportunityContext';
import { useProjects } from '../../context/ProjectContext';
import { AttachmentUploader } from './AttachmentUploader';
import { getRankedAssignees, getRecommendedDepartment } from '../../utils/complaintRoutingHelper';
import {
  X,
  AlertCircle,
  Clock,
  Save,
  CheckCircle2,
  Copy,
  Check,
  ChevronDown,
  Mail,
} from 'lucide-react';
import { COMPLAINT_CATEGORIES, PRIMARY_CATEGORY_NAMES } from '../../utils/complaintCategories';

const SUB_CATEGORIES = COMPLAINT_CATEGORIES;

const PRODUCTS = [
  'CRM Platform',
  'TaskFlow Pro Enterprise',
  'Payment Gateway API',
  'Mobile Application (iOS/Android)',
  'Cloud Hosting & Infrastructure',
  'User Workspace & SSO',
  'Lead & Opportunity Management',
  'Custom Integration Service',
];

export const ComplaintModal = ({ isOpen: propIsOpen, onClose: propOnClose, complaintToEdit: propComplaintToEdit }) => {
  const {
    createComplaint,
    updateComplaint,
    getCustomers,
    getSlaPolicy,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    selectedComplaint,
    setSelectedComplaint,
    allComplaints,
  } = useComplaints();
  const { users } = useUserManagement ? useUserManagement() : { users: [] };
  const { user: currentUser, isSuperAdmin, isManager } = useAuth();
  const { opportunities } = useOpportunities ? useOpportunities() : { opportunities: [] };
  const { projects } = useProjects ? useProjects() : { projects: [] };

  const isOpen = propIsOpen !== undefined ? propIsOpen : (isCreateModalOpen || isEditModalOpen);
  const complaintToEdit = propComplaintToEdit !== undefined ? propComplaintToEdit : (isEditModalOpen ? selectedComplaint : null);
  const isEdit = !!complaintToEdit;

  const [successResult, setSuccessResult] = useState(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Customer Records & Searchable Dropdown state
  const [customerRecords, setCustomerRecords] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef(null);

  // Dynamic SLA policy state
  const [slaPolicy, setSlaPolicy] = useState({
    Critical: { resolutionHours: 4, firstResponseHours: 1, label: '4 Hours Resolution / 1 Hour First Response' },
    High: { resolutionHours: 12, firstResponseHours: 2, label: '12 Hours Resolution / 2 Hours First Response' },
    Medium: { resolutionHours: 24, firstResponseHours: 4, label: '24 Hours Resolution / 4 Hours First Response' },
    Low: { resolutionHours: 48, firstResponseHours: 8, label: '48 Hours Resolution / 8 Hours First Response' },
  });

  const [formData, setFormData] = useState({
    customerId: null,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    organization: '',
    account: '',
    subject: '',
    description: '',
    category: 'Customer Support & Helpdesk',
    subCategory: 'General Inquiry / Help',
    complaintType: 'Complaint',
    productOrService: '',
    source: 'Web Portal',
    priority: 'Medium',
    severity: 'Moderate',
    slaHours: 24,
    status: 'Logged',
    assignedTo: null,
    assignedToName: 'Unassigned',
    team: 'Technical Support',
    nextFollowUpDate: '',
    nextFollowUpTime: '',
    nextFollowUpPurpose: '',
    linkedOpportunity: '',
    linkedProject: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const todayDateStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Fetch genuine customers from existing API on open
  useEffect(() => {
    if (isOpen && getCustomers) {
      let isMounted = true;
      setIsLoadingCustomers(true);
      getCustomers()
        .then((list) => {
          if (isMounted && Array.isArray(list)) {
            setCustomerRecords(list);
          }
        })
        .catch((err) => {
          console.error('[ComplaintModal] Failed to load customers:', err);
        })
        .finally(() => {
          if (isMounted) setIsLoadingCustomers(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, getCustomers]);

  // Click outside listener for customer dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch backend SLA policy dynamically
  useEffect(() => {
    if (isOpen && getSlaPolicy) {
      let isMounted = true;
      getSlaPolicy()
        .then((res) => {
          if (isMounted && res && Object.keys(res).length > 0) {
            setSlaPolicy(res);
          }
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, getSlaPolicy]);

  // Filtered customer records for searchable dropdown
  const filteredCustomers = useMemo(() => {
    const q = (formData.customerName || '').trim().toLowerCase();
    if (!q) return customerRecords;
    return customerRecords.filter((c) => {
      const nameStr = (c.customerName || c.name || '').toLowerCase();
      const orgStr = (c.organization || c.company || '').toLowerCase();
      const emailStr = (c.customerEmail || c.email || '').toLowerCase();
      const phoneStr = (c.customerPhone || c.phone || '').toLowerCase();
      return nameStr.includes(q) || orgStr.includes(q) || emailStr.includes(q) || phoneStr.includes(q);
    });
  }, [customerRecords, formData.customerName]);

  // Handle selecting customer from dropdown (restores full automatic population)
  const handleSelectCustomer = (cust) => {
    if (!cust) return;
    const nameStr = cust.customerName || cust.name || '';
    const orgStr = cust.organization || cust.company || '';
    const emailStr = cust.customerEmail || cust.email || '';
    const phoneStr = cust.customerPhone || cust.phone || cust.mobileNumber || '';
    const idVal = cust.customerId || cust._id || null;

    setFormData((prev) => ({
      ...prev,
      customerName: nameStr,
      organization: orgStr || prev.organization,
      account: orgStr || prev.account,
      customerEmail: emailStr || prev.customerEmail,
      customerPhone: phoneStr || prev.customerPhone,
      customerId: idVal,
    }));

    setFieldErrors((prev) => {
      const updated = { ...prev };
      delete updated.customerName;
      if (orgStr) delete updated.organization;
      if (emailStr) delete updated.customerEmail;
      if (phoneStr) delete updated.customerPhone;
      return updated;
    });

    setShowCustomerDropdown(false);
  };

  // Scoped list of assignable users based on strict role hierarchy
  const assignableUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    if (isSuperAdmin) return users;
    if (isManager) {
      const myId = (currentUser?._id || currentUser?.id || '').toString();
      const myName = (currentUser?.name || '').toLowerCase();
      return users.filter(
        (u) =>
          u._id === myId ||
          (u.reportsTo && (u.reportsTo === myId || u.reportsTo._id === myId)) ||
          (u.reportsToName && u.reportsToName.toLowerCase().includes(myName))
      );
    }
    const myId = (currentUser?._id || currentUser?.id || '').toString();
    return users.filter((u) => u._id === myId || (currentUser?.name && u.name === currentUser.name));
  }, [users, isSuperAdmin, isManager, currentUser]);

  // Smart Department Ranked Assignees
  const rankedAssignees = useMemo(() => {
    return getRankedAssignees(assignableUsers, formData.category, null, allComplaints);
  }, [assignableUsers, formData.category, allComplaints]);

  const recommendedAssignees = useMemo(() => {
    return rankedAssignees.filter((r) => r.isRecommended);
  }, [rankedAssignees]);

  const otherAssignees = useMemo(() => {
    return rankedAssignees.filter((r) => !r.isRecommended);
  }, [rankedAssignees]);

  const selectedAssigneeInfo = useMemo(() => {
    if (!formData.assignedToName || formData.assignedToName === 'Unassigned') return null;
    return rankedAssignees.find((r) => r.user.name === formData.assignedToName) || null;
  }, [rankedAssignees, formData.assignedToName]);

  // Automated SLA Target & Deadline calculation
  const currentSlaMeta = useMemo(() => {
    const p = formData.priority || 'Medium';
    const policy =
      slaPolicy[p] ||
      slaPolicy['Medium'] || {
        resolutionHours: 24,
        firstResponseHours: 4,
        label: '24 Hours Resolution / 4 Hours First Response',
      };
    const now = new Date();
    const resolutionDeadline = new Date(now.getTime() + policy.resolutionHours * 60 * 60 * 1000);
    const firstResponseDeadline = new Date(now.getTime() + policy.firstResponseHours * 60 * 60 * 1000);

    const formatDeadline = (d) => {
      return d.toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return {
      resolutionHours: policy.resolutionHours,
      firstResponseHours: policy.firstResponseHours,
      targetLabel: `${policy.resolutionHours}h Resolution (${policy.firstResponseHours}h First Response)`,
      firstResponseLabel: `${policy.firstResponseHours}h First Response`,
      resolutionDeadlineFormatted: formatDeadline(resolutionDeadline),
      firstResponseDeadlineFormatted: formatDeadline(firstResponseDeadline),
    };
  }, [formData.priority, slaPolicy]);

  // Initialize form state
  useEffect(() => {
    if (complaintToEdit) {
      setFormData({
        customerId: complaintToEdit.customerId || null,
        customerName: complaintToEdit.customerName || '',
        customerEmail: complaintToEdit.customerEmail || '',
        customerPhone: complaintToEdit.customerPhone || '',
        organization: complaintToEdit.organization || complaintToEdit.account || '',
        account: complaintToEdit.account || complaintToEdit.organization || '',
        subject: complaintToEdit.subject || '',
        description: complaintToEdit.description || '',
        category: complaintToEdit.category || 'Customer Support & Helpdesk',
        subCategory: complaintToEdit.subCategory || '',
        complaintType: complaintToEdit.complaintType || 'Complaint',
        productOrService: complaintToEdit.productOrService || '',
        source: complaintToEdit.source || 'Web Portal',
        priority: complaintToEdit.priority || 'Medium',
        severity: complaintToEdit.severity || 'Moderate',
        slaHours: complaintToEdit.slaHours || 24,
        status: complaintToEdit.status || 'Logged',
        assignedTo: complaintToEdit.assignedTo || null,
        assignedToName: complaintToEdit.assignedToName || 'Unassigned',
        team: complaintToEdit.team || 'Technical Support',
        nextFollowUpDate: complaintToEdit.nextFollowUpDate
          ? new Date(complaintToEdit.nextFollowUpDate).toISOString().slice(0, 10)
          : '',
        nextFollowUpTime: complaintToEdit.nextFollowUpTime || '',
        nextFollowUpPurpose: complaintToEdit.nextFollowUpPurpose || '',
        linkedOpportunity: complaintToEdit.linkedOpportunity || '',
        linkedProject: complaintToEdit.linkedProject || '',
      });
      setAttachments(complaintToEdit.attachments ? [...complaintToEdit.attachments] : []);
    } else {
      const defaultUser = currentUser || null;
      const defaultTeam = defaultUser?.department || defaultUser?.team || 'Technical Support';
      setFormData({
        customerId: null,
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        organization: '',
        account: '',
        subject: '',
        description: '',
        category: 'Customer Support & Helpdesk',
        subCategory: 'General Inquiry / Help',
        complaintType: 'Complaint',
        productOrService: '',
        source: 'Web Portal',
        priority: 'Medium',
        severity: 'Moderate',
        slaHours: 24,
        status: 'Logged',
        assignedTo: defaultUser?._id || null,
        assignedToName: defaultUser?.name || 'Unassigned',
        team: defaultTeam,
        nextFollowUpDate: '',
        nextFollowUpTime: '',
        nextFollowUpPurpose: '',
        linkedOpportunity: '',
        linkedProject: '',
      });
      setAttachments([]);
    }
    setFieldErrors({});
    setGeneralError('');
    setShowCustomerDropdown(false);
  }, [complaintToEdit, currentUser, isOpen]);

  const handleClose = () => {
    setSuccessResult(null);
    setCopiedTicket(false);
    setFieldErrors({});
    setGeneralError('');
    setShowCustomerDropdown(false);
    if (setIsCreateModalOpen) setIsCreateModalOpen(false);
    if (setIsEditModalOpen) setIsEditModalOpen(false);
    if (setSelectedComplaint) setSelectedComplaint(null);
    if (propOnClose) {
      propOnClose();
    }
  };

  const handleResetForNewComplaint = () => {
    setSuccessResult(null);
    setCopiedTicket(false);
    setFieldErrors({});
    setGeneralError('');
    setShowCustomerDropdown(false);
    const defaultUser = currentUser || null;
    const defaultTeam = defaultUser?.department || defaultUser?.team || 'Technical Support';
    setFormData({
      customerId: null,
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      organization: '',
      account: '',
      subject: '',
      description: '',
      category: 'Customer Support & Helpdesk',
      subCategory: 'General Inquiry / Help',
      complaintType: 'Complaint',
      productOrService: '',
      source: 'Web Portal',
      priority: 'Medium',
      severity: 'Moderate',
      slaHours: 24,
      status: 'Logged',
      assignedTo: defaultUser?._id || null,
      assignedToName: defaultUser?.name || 'Unassigned',
      team: defaultTeam,
      nextFollowUpDate: '',
      nextFollowUpTime: '',
      nextFollowUpPurpose: '',
      linkedOpportunity: '',
      linkedProject: '',
    });
  };

  const handleCopyTicket = (ticketNum) => {
    if (!ticketNum) return;
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ticketNum).catch(() => {});
    }
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }

    if (name === 'customerName') {
      const typed = value;
      setShowCustomerDropdown(true);

      // Auto-populate customer details if typed string matches an existing customer record
      const matched = customerRecords.find(
        (c) => (c.customerName || c.name || '').trim().toLowerCase() === typed.trim().toLowerCase()
      );
      if (matched) {
        setFormData((prev) => ({
          ...prev,
          customerName: typed,
          organization: matched.organization || matched.company || prev.organization,
          account: matched.organization || matched.company || prev.account,
          customerEmail: matched.customerEmail || matched.email || prev.customerEmail,
          customerPhone: matched.customerPhone || matched.phone || matched.mobileNumber || prev.customerPhone,
          customerId: matched.customerId || matched._id || null,
        }));
        setFieldErrors((prev) => {
          const updated = { ...prev };
          delete updated.customerName;
          if (matched.organization || matched.company) delete updated.organization;
          if (matched.customerEmail || matched.email) delete updated.customerEmail;
          if (matched.customerPhone || matched.phone) delete updated.customerPhone;
          return updated;
        });
      } else {
        setFormData((prev) => ({
          ...prev,
          customerName: typed,
          customerId: null,
        }));
      }
    } else if (name === 'category') {
      const nextRanked = getRankedAssignees(assignableUsers, value, null, allComplaints);
      const bestMatch = nextRanked.find((r) => r.isRecommended);
      if (bestMatch) {
        setFormData((prev) => ({
          ...prev,
          category: value,
          subCategory: '',
          assignedTo: bestMatch.user._id || null,
          assignedToName: bestMatch.user.name,
          team: bestMatch.user.department || bestMatch.user.team || getRecommendedDepartment(value),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          category: value,
          subCategory: '',
          assignedTo: null,
          assignedToName: 'Unassigned',
          team: getRecommendedDepartment(value),
        }));
      }
    } else if (name === 'priority') {
      const p = value;
      const policy = slaPolicy[p] || { resolutionHours: 24 };
      setFormData((prev) => ({
        ...prev,
        priority: p,
        slaHours: policy.resolutionHours,
      }));
    } else if (name === 'assignedToName') {
      const selectedU = (users || []).find((u) => u.name === value);
      const derivedTeam = selectedU?.department || selectedU?.team || 'Technical Support';
      setFormData((prev) => ({
        ...prev,
        assignedToName: value,
        assignedTo: selectedU ? selectedU._id : null,
        team: derivedTeam,
      }));
    } else if (name === 'nextFollowUpDate') {
      if (value && value < todayDateStr) {
        setFieldErrors((prev) => ({
          ...prev,
          nextFollowUpDate: 'Follow-up date cannot be in the past.',
        }));
      } else {
        setFieldErrors((prev) => {
          const updated = { ...prev };
          delete updated.nextFollowUpDate;
          return updated;
        });
      }
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    const nameTrimmed = (formData.customerName || '').trim();
    if (!nameTrimmed) {
      errors.customerName = 'Customer Name is required.';
    }

    const orgTrimmed = (formData.organization || '').trim();
    if (!orgTrimmed) {
      errors.organization = 'Organization Name is required.';
    }

    const emailTrimmed = (formData.customerEmail || '').trim().toLowerCase();
    if (!emailTrimmed) {
      errors.customerEmail = 'Email Address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrimmed)) {
        errors.customerEmail = 'Please enter a valid email address.';
      }
    }

    const phoneTrimmed = (formData.customerPhone || '').trim();
    if (!phoneTrimmed) {
      errors.customerPhone = 'Contact Number is required.';
    } else {
      const phoneDigits = phoneTrimmed.replace(/\D/g, '');
      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        errors.customerPhone = 'Please enter a valid contact number (7 to 15 digits).';
      }
    }

    const subjectTrimmed = (formData.subject || '').trim();
    if (!subjectTrimmed) {
      errors.subject = 'Complaint Subject is required.';
    }

    const descTrimmed = (formData.description || '').trim();
    if (!descTrimmed) {
      errors.description = 'Detailed Description is required.';
    }

    if (!formData.category) {
      errors.category = 'Please select a category.';
    }

    if (!formData.priority) {
      errors.priority = 'Priority is required.';
    }

    if (!formData.assignedToName || formData.assignedToName === 'Unassigned') {
      errors.assignedToName = 'Please select an authorized assignee.';
    }

    if (formData.nextFollowUpDate && formData.nextFollowUpDate < todayDateStr) {
      errors.nextFollowUpDate = 'Next follow-up date cannot be in the past.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setGeneralError('Please fill in all mandatory fields with valid information.');
      const firstField = Object.keys(errors)[0];
      const el = document.querySelector(`[name="${firstField}"]`);
      if (el) el.focus();
      return;
    }

    try {
      setSubmitting(true);
      setGeneralError('');
      setFieldErrors({});

      const payload = {
        ...formData,
        customerName: nameTrimmed,
        organization: orgTrimmed,
        account: orgTrimmed,
        customerEmail: emailTrimmed,
        customerPhone: phoneTrimmed,
        subject: subjectTrimmed,
        description: descTrimmed,
        complaintType: formData.complaintType || 'Complaint',
        productOrService: formData.productOrService || 'CRM Platform',
        source: 'Web Portal',
        severity: formData.severity || 'Moderate',
        attachments: (attachments || []).map((a) => ({
          name: a.name,
          size: a.size,
          type: a.type,
          dataUrl: a.dataUrl,
        })),
        location: null,
      };

      if (isEdit) {
        if (complaintToEdit && ['Resolved', 'Closed'].includes(complaintToEdit.status)) {
          setError('Resolved and closed complaints cannot be edited.');
          setSubmitting(false);
          return;
        }
        await updateComplaint(complaintToEdit._id, payload);
        handleClose();
      } else {
        const res = await createComplaint(payload);
        const ticketNum = res?.ticketNumber || res?.complaint?.ticketNumber;
        const emailStatus = res?.emailStatus || res?.complaint?.emailNotifications;
        setSuccessResult({
          ticketNumber: ticketNum,
          customerName: nameTrimmed,
          customerEmail: emailTrimmed,
          customerEmailStatus: emailStatus?.customer?.status || 'Sent Successfully',
          customerEmailRecipient: emailStatus?.customer?.recipient || emailTrimmed,
          customerEmailError: emailStatus?.customer?.error || '',
          managerEmailStatus: emailStatus?.manager?.status || 'Sent Successfully',
          managerEmailRecipient: emailStatus?.manager?.recipient || '',
          managerEmailRecipientName: emailStatus?.manager?.recipientName || '',
          managerEmailError: emailStatus?.manager?.error || '',
        });
      }
    } catch (err) {
      setGeneralError(err.message || 'Failed to submit complaint ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <style>{`
        .crm-form-container {
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 920px;
          max-height: 90vh;
          max-height: 90dvh;
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.22);
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .crm-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          width: 100%;
        }

        .crm-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          width: 100%;
        }

        .crm-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 4px 0;
          width: 100%;
        }

        @media (max-width: 860px) {
          .crm-grid-4 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .crm-grid-3 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 540px) {
          .crm-grid-4,
          .crm-grid-3 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="crm-form-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {successResult
                ? 'Complaint Registered'
                : isEdit
                ? `Edit Complaint (${complaintToEdit.ticketNumber})`
                : 'Log New Customer Complaint'}
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0 0' }}>
              {successResult
                ? `Ticket ${successResult.ticketNumber || ''} registered successfully`
                : isEdit
                ? 'Update complaint ticket and assignment'
                : 'Enter customer issue details, priority and assignment'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Confirmation Success View */}
        {successResult ? (
          <div
            style={{
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              overflowY: 'auto',
              flex: '1 1 auto',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '16px',
                background: '#f0fdf4',
                borderRadius: '12px',
                border: '1px solid #bbf7d0',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#10b981',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                }}
              >
                <CheckCircle2 size={26} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#065f46', margin: '0 0 4px 0' }}>
                Complaint Raised Successfully!
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#047857', margin: 0 }}>
                Customer complaint has been verified and registered in the database.
              </p>
            </div>

            <div
              style={{
                background: '#ffffff',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Unique Ticket Number
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', fontFamily: 'monospace', marginTop: '2px' }}>
                  {successResult.ticketNumber || 'CMP-GENERATED'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  Customer: <strong>{successResult.customerName}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopyTicket(successResult.ticketNumber)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: copiedTicket ? '#dcfce7' : '#ffffff',
                  color: copiedTicket ? '#15803d' : '#334155',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {copiedTicket ? <Check size={15} /> : <Copy size={15} />}
                <span>{copiedTicket ? 'Copied!' : 'Copy Ticket'}</span>
              </button>
            </div>

            {/* Email Notification Dispatch Reassurance */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '9px 14px',
                marginBottom: '18px',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Mail size={15} />
              </div>
              <div style={{ fontSize: '0.82rem', lineHeight: 1.4, color: '#166534' }}>
                <div>
                  Confirmation email with ticket summary dispatched to{' '}
                  <strong style={{ color: '#0f172a' }}>
                    {successResult.customerEmail || 'the customer'}
                  </strong>.
                </div>
                <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '1px' }}>
                  Automatic notification also routed to assigned team / manager.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '6px' }}>
              <button
                type="button"
                onClick={handleResetForNewComplaint}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Log Another Complaint
              </button>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '9px 22px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* General Error Banner */}
            {generalError && (
              <div
                style={{
                  padding: '10px 20px',
                  background: '#fef2f2',
                  borderBottom: '1px solid #fee2e2',
                  color: '#dc2626',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{generalError}</span>
              </div>
            )}

            {/* Clean, Modern Form Body without section titles */}
            <form
              onSubmit={handleSubmit}
              style={{
                overflowY: 'auto',
                flex: '1 1 auto',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Group 1: Customer Information (4 columns) */}
              <div className="crm-grid-4">
                {/* Customer Name with Searchable/Selectable Dropdown & Auto-fill */}
                <div ref={customerDropdownRef} style={{ position: 'relative' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px', display: 'block' }}>
                    Customer Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder="Select or enter customer..."
                      autoComplete="off"
                      required
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 30px 0 12px',
                        borderRadius: '8px',
                        border: fieldErrors.customerName ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                        fontSize: '0.86rem',
                        outline: 'none',
                        background: '#ffffff',
                        color: '#0f172a',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowCustomerDropdown((prev) => !prev)}
                      style={{
                        position: 'absolute',
                        right: '4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ChevronDown size={15} />
                    </button>
                  </div>

                  {/* Customer Dropdown Menu */}
                  {showCustomerDropdown && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        padding: '4px',
                      }}
                    >
                      {isLoadingCustomers ? (
                        <div style={{ padding: '10px', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
                          Loading customers...
                        </div>
                      ) : filteredCustomers.length > 0 ? (
                        filteredCustomers.map((cust) => (
                          <div
                            key={cust._id || cust.customerId || cust.customerName}
                            onClick={() => handleSelectCustomer(cust)}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              borderBottom: '1px solid #f8fafc',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>
                                {cust.customerName}
                              </span>
                              {cust.leadId && (
                                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '1px 5px', borderRadius: '4px' }}>
                                  {cust.leadId}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {cust.organization ? `${cust.organization} • ` : ''}{cust.customerEmail || cust.customerPhone || 'Customer'}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '12px', fontSize: '0.82rem', color: '#64748b', textAlign: 'center', fontWeight: 500 }}>
                          No customers found
                        </div>
                      )}
                    </div>
                  )}

                  {fieldErrors.customerName && (
                    <span style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 500, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} style={{ flexShrink: 0 }} />
                      <span>{fieldErrors.customerName}</span>
                    </span>
                  )}
                </div>

                {/* Organization Name */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px', display: 'block' }}>
                    Organization Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    placeholder="e.g. Acme Corp"
                    required
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: fieldErrors.organization ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                      fontSize: '0.86rem',
                      outline: 'none',
                      background: '#ffffff',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                    }}
                  />
                  {fieldErrors.organization && (
                    <span style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 500, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} style={{ flexShrink: 0 }} />
                      <span>{fieldErrors.organization}</span>
                    </span>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px', display: 'block' }}>
                    Email Address <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    required
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: fieldErrors.customerEmail ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                      fontSize: '0.86rem',
                      outline: 'none',
                      background: '#ffffff',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                    }}
                  />
                  {fieldErrors.customerEmail && (
                    <span style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 500, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} style={{ flexShrink: 0 }} />
                      <span>{fieldErrors.customerEmail}</span>
                    </span>
                  )}
                </div>

                {/* Contact Number */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px', display: 'block' }}>
                    Contact Number <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    required
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: fieldErrors.customerPhone ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                      fontSize: '0.86rem',
                      outline: 'none',
                      background: '#ffffff',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                    }}
                  />
                  {fieldErrors.customerPhone && (
                    <span style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 500, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} style={{ flexShrink: 0 }} />
                      <span>{fieldErrors.customerPhone}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Subtle separator */}
              <div className="crm-divider" />

              {/* Group 2: Issue Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Complaint Subject */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px', display: 'block' }}>
                    Complaint Subject <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="e.g. System latency during transaction checkout"
                    required
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: fieldErrors.subject ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                      fontSize: '0.86rem',
                      outline: 'none',
                      background: '#ffffff',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                    }}
                  />
                  {fieldErrors.subject && (
                    <span style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 500, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} style={{ flexShrink: 0 }} />
                      <span>{fieldErrors.subject}</span>
                    </span>
                  )}
                </div>

                {/* Detailed Description */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px', display: 'block' }}>
                    Detailed Description <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Provide complete description of the reported issue..."
                    required
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: fieldErrors.description ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                      fontSize: '0.86rem',
                      outline: 'none',
                      background: '#ffffff',
                      color: '#0f172a',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                  {fieldErrors.description && (
                    <span style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 500, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} style={{ flexShrink: 0 }} />
                      <span>{fieldErrors.description}</span>
                    </span>
                  )}
                </div>

                {/* Category, Sub-Category, Product/Service (3 columns) */}
                <div className="crm-grid-3">
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px', display: 'block' }}>
                      Category <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 10px',
                        borderRadius: '8px',
                        border: fieldErrors.category ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                        fontSize: '0.86rem',
                        outline: 'none',
                        background: '#ffffff',
                        color: '#0f172a',
                        boxSizing: 'border-box',
                      }}
                    >
                      {PRIMARY_CATEGORY_NAMES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      {formData.category && !PRIMARY_CATEGORY_NAMES.includes(formData.category) && (
                        <option value={formData.category}>
                          {formData.category} (Legacy)
                        </option>
                      )}
                    </select>
                    {fieldErrors.category && (
                      <span style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 500, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={12} style={{ flexShrink: 0 }} />
                        <span>{fieldErrors.category}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px', display: 'block' }}>
                      Sub-Category
                    </label>
                    <select
                      name="subCategory"
                      value={formData.subCategory}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.86rem',
                        outline: 'none',
                        background: '#ffffff',
                        color: '#0f172a',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="">-- Select Sub-Category --</option>
                      {(SUB_CATEGORIES[formData.category] || []).map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px', display: 'block' }}>
                      Product / Service
                    </label>
                    <select
                      name="productOrService"
                      value={formData.productOrService}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.86rem',
                        outline: 'none',
                        background: '#ffffff',
                        color: '#0f172a',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="">-- Select Product / Service --</option>
                      {PRODUCTS.map((prod) => (
                        <option key={prod} value={prod}>
                          {prod}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Subtle separator */}
              <div className="crm-divider" />

              {/* Group 3: Priority & SLA (3 columns) */}
              <div className="crm-grid-3">
                {/* Priority */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px', display: 'block' }}>
                    Priority <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      outline: 'none',
                      background: '#ffffff',
                      color:
                        formData.priority === 'Critical'
                          ? '#dc2626'
                          : formData.priority === 'High'
                          ? '#ea580c'
                          : formData.priority === 'Medium'
                          ? '#2563eb'
                          : '#16a34a',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Critical">Critical (P1 - 4h SLA)</option>
                    <option value="High">High (P2 - 12h SLA)</option>
                    <option value="Medium">Medium (P3 - 24h SLA)</option>
                    <option value="Low">Low (P4 - 48h SLA)</option>
                  </select>
                </div>

                {/* SLA Target */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px', display: 'block' }}>
                    SLA Target
                  </label>
                  <div
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.84rem',
                      background: '#f8fafc',
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      boxSizing: 'border-box',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{currentSlaMeta.targetLabel}</span>
                  </div>
                </div>

                {/* SLA Deadline */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px', display: 'block' }}>
                    SLA Deadline
                  </label>
                  <div
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.84rem',
                      background: '#f8fafc',
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      boxSizing: 'border-box',
                      fontWeight: 600,
                    }}
                  >
                    {currentSlaMeta.resolutionDeadlineFormatted}
                  </div>
                </div>
              </div>

              {/* Subtle separator */}
              <div className="crm-divider" />

              {/* Group 4: Assignment (3 columns) */}
              <div className="crm-grid-3">
                {/* Assign To Coordinator / Owner */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px', display: 'block' }}>
                    Assign To Coordinator / Owner <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    name="assignedToName"
                    value={formData.assignedToName}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: fieldErrors.assignedToName ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                      fontSize: '0.86rem',
                      outline: 'none',
                      background: '#ffffff',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Unassigned">-- Select Coordinator / Owner --</option>
                    {recommendedAssignees.length > 0 && (
                      <optgroup label="⭐ Recommended (Department Specialists)">
                        {recommendedAssignees.map((item) => (
                          <option key={item.user._id} value={item.user.name}>
                            {item.user.name} ({item.user.department || 'Operations'}) — {item.availability?.badge || item.matchLabel}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label={recommendedAssignees.length > 0 ? "Other Team Members" : "All Assignable Members"}>
                      {otherAssignees.map((item) => (
                        <option key={item.user._id} value={item.user.name}>
                          {item.user.name} ({item.user.role || 'Member'}) — {item.availability?.badge || item.user.department || 'Operations'}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  {fieldErrors.assignedToName && (
                    <span style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 500, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} style={{ flexShrink: 0 }} />
                      <span>{fieldErrors.assignedToName}</span>
                    </span>
                  )}

                  {/* Live Availability & Field Service Status Card */}
                  {selectedAssigneeInfo?.availability && (
                    <div
                      style={{
                        marginTop: '6px',
                        background: selectedAssigneeInfo.availability.bgColor,
                        border: `1px solid ${selectedAssigneeInfo.availability.borderColor}`,
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.74rem',
                        color: selectedAssigneeInfo.availability.color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Clock size={12} style={{ flexShrink: 0 }} />
                      <span>
                        <strong>Live Availability:</strong> {selectedAssigneeInfo.availability.etaText}
                      </span>
                    </div>
                  )}

                  {/* RED Warning when NO employee from the related department exists in user's team/workspace */}
                  {recommendedAssignees.length === 0 && formData.category && (
                    <div
                      style={{
                        marginTop: '6px',
                        background: '#fef2f2',
                        border: '1px solid #fca5a5',
                        borderRadius: '8px',
                        padding: '7px 10px',
                        fontSize: '0.75rem',
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
                        <strong>{getRecommendedDepartment(formData.category)}</strong>.
                        {selectedAssigneeInfo
                          ? ` (${selectedAssigneeInfo.user.name} is in ${selectedAssigneeInfo.user.department || 'another department'}).`
                          : ''}
                      </span>
                    </div>
                  )}

                  {/* Smart Skill & Location Match Assistant Badge (Only when truly skill-matched) */}
                  {selectedAssigneeInfo && selectedAssigneeInfo.isRecommended && (
                    <div
                      style={{
                        marginTop: '6px',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.75rem',
                        color: '#166534',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircle2 size={13} color="#16a34a" style={{ flexShrink: 0 }} />
                      <span>
                        <strong>Smart Match:</strong> {selectedAssigneeInfo.user.name} is in{' '}
                        <strong>{selectedAssigneeInfo.user.department || 'Operations'}</strong>, ideal for{' '}
                        <strong>{formData.category || 'this category'}</strong>.
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
                        padding: '6px 10px',
                        fontSize: '0.75rem',
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
                        <strong>{formData.category}</strong> is{' '}
                        <strong>{getRecommendedDepartment(formData.category)}</strong>.
                      </span>
                    </div>
                  )}
                </div>

                {/* Assigned Team / Department */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px', display: 'block' }}>
                    Assigned Team / Department
                  </label>
                  <div
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.84rem',
                      background: '#f8fafc',
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      boxSizing: 'border-box',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{formData.team || 'Technical Support'}</span>
                  </div>
                </div>

                {/* Next Follow-up Date */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px', display: 'block' }}>
                    Next Follow-up Date
                  </label>
                  <input
                    type="date"
                    name="nextFollowUpDate"
                    min={todayDateStr}
                    value={formData.nextFollowUpDate}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: fieldErrors.nextFollowUpDate ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                      fontSize: '0.86rem',
                      outline: 'none',
                      background: '#ffffff',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                    }}
                  />
                  {fieldErrors.nextFollowUpDate && (
                    <span style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 500, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} style={{ flexShrink: 0 }} />
                      <span>{fieldErrors.nextFollowUpDate}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Status (Edit Mode only) */}
              {isEdit && (
                <>
                  <div className="crm-divider" />
                  <div style={{ maxWidth: '300px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px', display: 'block' }}>
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.86rem',
                        outline: 'none',
                        background: '#ffffff',
                        color: '#0f172a',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="Logged">Logged</option>
                      <option value="Open">Open</option>
                      <option value="Under Investigation">Under Investigation</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Awaiting Customer">Awaiting Customer</option>
                      <option value="Escalated">Escalated</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                      <option value="Reopened">Reopened</option>
                    </select>
                  </div>
                </>
              )}

              {/* Attachments & Screenshots */}
              <div style={{ marginTop: '14px' }}>
                <AttachmentUploader attachments={attachments} setAttachments={setAttachments} maxFiles={5} />
              </div>
            </form>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                background: '#ffffff',
                flexShrink: 0,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: '200px' }}>
                {generalError && (
                  <div
                    style={{
                      color: '#dc2626',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{generalError}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    padding: '8px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
                  }}
                >
                  <Save size={15} />
                  <span>{submitting ? 'Saving...' : isEdit ? 'Update Ticket' : 'Create Complaint Ticket'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ComplaintModal;
