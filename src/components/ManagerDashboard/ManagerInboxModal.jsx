import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import {
  Inbox,
  X,
  CheckCircle2,
  Clock,
  Trash2,
  CheckCheck,
  User,
  MessageSquare,
  Sparkles,
  Shield,
  Briefcase,
  Calendar,
} from 'lucide-react';

export const ManagerInboxModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationItem,
    clearAllNotifications,
  } = useTasks();

  if (!isOpen) return null;

  const isManager = user && ['Manager', 'Executive', 'Administrator'].includes(user.role);

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }} onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: isManager ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: isManager ? '#60a5fa' : '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Inbox size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="modal-title" style={{ margin: 0 }}>
                  {isManager ? 'Manager Inbox & Activity Feed' : 'My Task Inbox & Assignment Alerts'}
                </h3>
                {unreadCount > 0 && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: '#ef4444',
                      color: '#fff',
                    }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>
            </div>
          </div>

          <button type="button" className="btn-icon" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Action Toolbar */}
        {notifications.length > 0 && (
          <div
            style={{
              padding: '10px 24px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing {notifications.length} message(s)
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsAsRead}
                  className="btn btn-secondary"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCheck size={14} />
                  <span>Mark all as read</span>
                </button>
              )}

              <button
                type="button"
                onClick={clearAllNotifications}
                className="btn btn-secondary"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#dc2626',
                }}
              >
                <Trash2 size={14} />
                <span>Clear all</span>
              </button>
            </div>
          </div>
        )}

        {/* Notification List Body */}
        <div
          className="modal-body"
          style={{
            overflowY: 'auto',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {notifications.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 16px',
                color: 'var(--text-muted)',
              }}
            >
              <Inbox size={42} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '4px' }}>
                Your Inbox is Clean
              </h4>
              <p style={{ fontSize: '0.82rem', margin: 0 }}>
                {isManager
                  ? 'When users complete assigned tasks and submit remarks, you will receive real-time messages here.'
                  : 'When managers assign you a new task with instructions, you will receive notifications here.'}
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const notifDate = notif.createdAt
                ? new Date(notif.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Just now';

              const isAssignment = notif.type === 'task_assigned' || !isManager;

              return (
                <div
                  key={notif._id}
                  style={{
                    background: notif.isRead
                      ? '#ffffff'
                      : isAssignment
                      ? '#f0fdf4'
                      : '#eff6ff',
                    border: notif.isRead
                      ? '1px solid #e2e8f0'
                      : isAssignment
                      ? '1px solid #bbf7d0'
                      : '1px solid #bfdbfe',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {/* Top Bar */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: isAssignment ? '#059669' : '#2563eb',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                        }}
                      >
                        {isAssignment ? <Shield size={16} /> : <User size={16} />}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {isAssignment ? notif.assignedBy || 'Manager' : notif.userName}
                          </span>
                          {!notif.isRead && (
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: isAssignment ? '#059669' : '#2563eb',
                                display: 'inline-block',
                              }}
                            />
                          )}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {notifDate}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: isAssignment ? '#eff6ff' : '#ecfdf5',
                          color: isAssignment ? '#1d4ed8' : '#047857',
                          border: `1px solid ${isAssignment ? '#bfdbfe' : '#a7f3d0'}`,
                        }}
                      >
                        {isAssignment ? 'Task Assigned to You' : 'Task Completed'}
                      </span>

                      <button
                        type="button"
                        onClick={() => deleteNotificationItem(notif._id)}
                        className="btn-icon"
                        style={{ padding: '4px', color: 'var(--text-muted)' }}
                        title="Delete message"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Task Description & Message */}
                  <div style={{ paddingLeft: '44px' }}>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {notif.taskDescription || notif.message}
                    </div>

                    {/* Instructions / User Remark */}
                    {notif.remark && (
                      <div
                        style={{
                          marginTop: '8px',
                          background: notif.isRead ? '#f8fafc' : '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderLeft: `3px solid ${isAssignment ? '#2563eb' : '#059669'}`,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: isAssignment ? '#1d4ed8' : '#047857', display: 'block', fontSize: '0.75rem' }}>
                          {isAssignment ? 'Manager Instructions / What To Do:' : 'User Remark:'}
                        </span>
                        "{notif.remark}"
                      </div>
                    )}
                  </div>

                  {/* Mark as read footer */}
                  {!notif.isRead && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => markNotificationAsRead(notif._id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isAssignment ? '#059669' : '#2563eb',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCircle2 size={13} />
                        <span>Mark as read</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
