// backend/controllers/notificationController.js
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// Get notifications for current user
const getUserNotifications = async (req, res) => {
  try {
    console.log(`Fetching notifications for user: ${req.user._id}`);
    const notifications = await Notification.find({ 
      recipient: req.user._id 
    }).sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (error) {
    console.error('Get user notifications error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle notification read status
const toggleReadStatus = async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    console.log(`Toggling read status for notification: ${notificationId}`);
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID format' });
    }

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if user is authorized to modify this notification
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Toggle read status
    notification.isRead = !notification.isRead;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Toggle notification read status error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark all notifications as read
const markAllRead = async (req, res) => {
  try {
    console.log(`Marking all notifications as read for user: ${req.user._id}`);
    
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ 
      message: 'All notifications marked as read',
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all read error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    console.log(`Deleting notification: ${notificationId}`);
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID format' });
    }

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if user is authorized to delete this notification
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Notification.deleteOne({ _id: notificationId });

    res.json({ message: 'Notification removed', id: notificationId });
  } catch (error) {
    console.error('Delete notification error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Clear all notifications
const clearAllNotifications = async (req, res) => {
  try {
    console.log(`Clearing all notifications for user: ${req.user._id}`);
    
    const result = await Notification.deleteMany({ recipient: req.user._id });

    res.json({ 
      message: 'All notifications cleared',
      count: result.deletedCount
    });
  } catch (error) {
    console.error('Clear all notifications error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new notification
const createNotification = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      recipient, 
      status, 
      type, 
      documentId, 
      documentName 
    } = req.body;

    // Validate required fields
    if (!title || !description || !recipient) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const notification = new Notification({
      title,
      description,
      recipient,
      status: status || 'info',
      type: type || 'general',
      documentId,
      documentName
    });

    await notification.save();

    res.status(201).json(notification);
  } catch (error) {
    console.error('Create notification error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      recipient: req.user._id,
      isRead: false
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createNotification,
  toggleReadStatus,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
  getUserNotifications,
  getUnreadCount
};