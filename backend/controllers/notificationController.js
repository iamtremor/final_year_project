// backend/controllers/notificationController.js
const Notification = require('../models/Notification');


const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      recipient: req.user._id 
    }).sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (error) {
    console.error('Get user notifications error:', error.message);
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

    // Check required fields
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
// Mark notification as read
const toggleReadStatus = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

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
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if user is authorized to delete this notification
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await notification.deleteOne();

    res.json({ message: 'Notification removed' });
  } catch (error) {
    console.error('Delete notification error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Clear all notifications
const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });

    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    console.error('Clear all notifications error:', error.message);
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