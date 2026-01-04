import { Notification } from '../models/models.js';

export const notificationService = {
  /**
   * Create a new notification
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} - Created notification
   */
  createNotification: async (data) => {
    try {
      const notification = new Notification(data);
      return await notification.save();
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  /**
   * Create notifications for multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {String} type - Notification type
   * @param {String} message - Notification message
   * @param {Object} relatedTo - Object containing type and ID of related entity
   * @returns {Promise<Array>} - Array of created notifications
   */
  createNotificationsForUsers: async (userIds, type, message, relatedTo) => {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        type,
        message,
        relatedTo,
        isRead: false,
        createdAt: Date.now()
      }));

      return await Notification.insertMany(notifications);
    } catch (error) {
      console.error('Error creating notifications for users:', error);
      throw error;
    }
  },

  /**
   * Get unread notification count for a user
   * @param {String} userId - User ID
   * @returns {Promise<Number>} - Count of unread notifications
   */
  getUnreadCount: async (userId) => {
    try {
      return await Notification.countDocuments({ userId, isRead: false });
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      throw error;
    }
  }
};
