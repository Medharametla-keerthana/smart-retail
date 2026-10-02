const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientEmail: req.user.email.toLowerCase() })
      .sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, notifications, unreadCount: notifications.filter((item) => !item.readAt).length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const markRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientEmail: req.user.email.toLowerCase() },
      { readAt: new Date() },
      { new: true },
    );
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
    return res.json({ success: true, notification });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getNotifications, markRead };
