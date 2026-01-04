import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Check, X, Trash2, Clock, AlertCircle, MessageSquare, User } from 'lucide-react';
import { 
  getNotifications, 
  getUnreadNotificationCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification
} from '../../services/api';

const NotificationCenter = ({ onOpenSidebar }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications and unread count
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    } else {
      // Even when closed, fetch the unread count periodically
      fetchUnreadCount();
    }
  }, [isOpen]);

  // Periodically update unread count
  useEffect(() => {
    const intervalId = setInterval(fetchUnreadCount, 60000); // Every minute
    return () => clearInterval(intervalId);
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getNotifications({ limit: 10 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError('Failed to load notifications');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(notifications.map(notification => 
        notification._id === notificationId 
          ? { ...notification, isRead: true } 
          : notification
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n._id !== notificationId));
      // Update unread count if necessary
      const deleted = notifications.find(n => n._id === notificationId);
      if (deleted && !deleted.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleViewAllClick = () => {
    // Close the dropdown
    setIsOpen(false);
    
    // Open the sidebar panel
    if (onOpenSidebar) {
      onOpenSidebar();
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_COMPLAINT':
        return <AlertCircle className="text-blue-500" size={18} />;
      case 'STATUS_UPDATE':
        return <Check className="text-green-500" size={18} />;
      case 'NEW_COMMENT':
        return <MessageSquare className="text-indigo-500" size={18} />;
      case 'COMPLAINT_ESCALATED':
        return <AlertCircle className="text-red-500" size={18} />;
      case 'ASSIGNED_COMPLAINT':
        return <User className="text-purple-500" size={18} />;
      case 'WORKFLOW_UPDATED':
        return <Clock className="text-blue-500" size={18} />;
      default:
        return <Bell className="text-gray-500" size={18} />;
    }
  };

  const formatTimeAgo = (createdAt) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHr > 0) {
      return `${diffHr}h ago`;
    } else if (diffMin > 0) {
      return `${diffMin}m ago`;
    } else {
      return 'just now';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="text-gray-600 hover:text-gray-900 p-1 rounded-full transition-colors relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 border border-gray-200 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-medium text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <CheckCheck className="mr-1" size={14} />
                Mark all as read
              </button>
            )}
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex justify-center items-center py-6">
                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 p-4 text-center">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="text-gray-500 p-6 text-center">
                <Bell className="mx-auto mb-2 text-gray-400" size={24} />
                <p>No notifications yet</p>
              </div>
            ) : (
              <ul>
                {notifications.map(notification => (
                  <li 
                    key={notification._id}
                    className={`
                      p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex items-start
                      ${!notification.isRead ? 'bg-blue-50 hover:bg-blue-100' : ''}
                    `}
                  >
                    <div className="mr-3 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.isRead ? 'font-semibold' : ''}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <Clock size={12} className="mr-1" />
                        {formatTimeAgo(notification.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center">
                      {!notification.isRead && (
                        <button 
                          onClick={(e) => handleMarkAsRead(notification._id, e)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded-full"
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button 
                        onClick={(e) => handleDelete(notification._id, e)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-full"
                        title="Delete notification"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-200 text-center">
            <button 
              onClick={handleViewAllClick}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
