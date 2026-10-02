const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
  try {
    res.set("Cache-Control", "private, no-store");
    const recipientEmail = req.user.email.toLowerCase();
    const recipientFilter = { recipientEmail };
    const allowedFilters = ["All", "Unread", "Delivery", "Incident", "Request"];
    const requestedFilter = String(req.query.filter || "All");
    const filter = allowedFilters.includes(requestedFilter) ? requestedFilter : "All";
    const listFilter = { ...recipientFilter };
    if (filter === "Unread") listFilter.readAt = null;
    else if (filter !== "All") listFilter.category = filter;
    const [notifications, totalCount, unreadCount, incidentCount, categoryCount] = await Promise.all([
      Notification.find(listFilter).sort({ createdAt: -1, _id: -1 }).limit(100).lean(),
      Notification.countDocuments(recipientFilter),
      Notification.countDocuments({ ...recipientFilter, readAt: null }),
      Notification.countDocuments({ ...recipientFilter, category: "Incident" }),
      filter === "Delivery" || filter === "Request" ? Notification.countDocuments(listFilter) : Promise.resolve(null),
    ]);
    const matchingCount = categoryCount ?? (filter === "All" ? totalCount : filter === "Unread" ? unreadCount : incidentCount);
    return res.json({ success: true, notifications, counts: { total: totalCount, unread: unreadCount, incidents: incidentCount }, matchingCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const markRead = async (req, res) => {
  try {
    res.set("Cache-Control", "private, no-store");
    const notificationId = req.params.id || req.body.notificationId;
    if (!notificationId) return res.status(400).json({ success: false, message: "Notification ID is required" });
    if (!/^[a-f\d]{24}$/i.test(String(notificationId))) {
      return res.status(400).json({ success: false, message: "Notification ID is invalid" });
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientEmail: req.user.email.toLowerCase() },
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
