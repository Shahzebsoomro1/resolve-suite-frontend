import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Clock, 
  AlertCircle, 
  Check, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  MessageSquare,
  User
} from 'lucide-react';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification
} from '../services/api';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [filter, pagination.currentPage]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = { 
        page: pagination.currentPage,
        limit: 20
      };
      
      if (filter === 'unread') {
        params.isRead = false;
      } else if (filter === 'read') {
        params.isRead = true;
      }
      
      const data = await getNotifications(params);
      
      setNotifications(data.notifications);
      setPagination({
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalCount: data.totalCount
      });
    } catch (err) {
      setError('Failed to load notifications');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(notifications.map(notification => 
        notification._id === notificationId 
          ? { ...notification, isRead: true } 
          : notification
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
      // Refresh to get updated counts
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n._id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const navigateToEntity = (notification) => {
    // Mark as read when navigating
    if (!notification.isRead) {
      markNotificationAsRead(notification._id)
        .catch(err => console.error('Error marking as read:', err));
    }

    // Navigate based on notification type
    const { relatedTo } = notification;
    if (relatedTo && relatedTo.type === 'COMPLAINT') {
      navigate(`/complaints/${relatedTo.id}`);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_COMPLAINT':
        return <AlertCircle className="text-blue-500" size={20} />;
      case 'STATUS_UPDATE':
        return <Check className="text-green-500" size={20} />;
      case 'NEW_COMMENT':
        return <MessageSquare className="text-indigo-500" size={20} />;
      case 'COMPLAINT_ESCALATED':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'ASSIGNED_COMPLAINT':
        return <User className="text-purple-500" size={20} />;
      default:
        return <Bell className="text-gray-500" size={20} />;
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handlePrevPage = () => {
    if (pagination.currentPage > 1) {
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  };

  const handleNextPage = () => {
    if (pagination.currentPage < pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.isRead).length;
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800 flex items-center">
              <Bell className="mr-2" size={24} />
              Notifications
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Filter className="mr-2 text-gray-500" size={16} />
                <select
                  className="border border-gray-300 rounded-md text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setPagination(prev => ({ ...prev, currentPage: 1 }));
                  }}
                >
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>
              <button
                onClick={handleMarkAllAsRead}
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded flex items-center disabled:opacity-50"
                disabled={!getUnreadCount()}
              >
                <CheckCheck className="mr-1" size={16} />
                Mark all as read
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 p-6 text-center">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="text-gray-500 p-8 text-center">
              <Bell className="mx-auto mb-3 text-gray-400" size={32} />
              <p>No notifications found</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map(notification => (
                <li 
                  key={notification._id}
                  className={`
                    p-4 hover:bg-gray-50 flex items-start
                    ${!notification.isRead ? 'bg-blue-50 hover:bg-blue-100' : ''}
                  `}
                >
                  <div className="mr-4 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigateToEntity(notification)}
                  >
                    <p className={`text-base ${!notification.isRead ? 'font-semibold' : ''}`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Clock size={14} className="mr-1" />
                      {formatDateTime(notification.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center">
                    {!notification.isRead && (
                      <button 
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-full"
                        title="Mark as read"
                      >
                        <Check size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(notification._id)}
                      className="text-gray-400 hover:text-red-500 p-2 rounded-full"
                      title="Delete notification"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pagination */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {notifications.length} of {pagination.totalCount} notifications
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={pagination.currentPage <= 1}
                className="p-2 rounded border border-gray-300 disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-3 py-1">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="p-2 rounded border border-gray-300 disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
