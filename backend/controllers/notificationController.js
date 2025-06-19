import Notification from '../models/Notification.js';

export const saveNotification = async ({
  type,
  title,
  message,
  recipientType,
  incidentId,
  requestId,
  note,
  entityType
}) => {
  if (!recipientType) {
    throw new Error("recipientType is required");
  }

  try {
    const notification = new Notification({
      type,
      title,
      message,
      recipientType,
      incidentId,
      requestId,
      note,
      entityType,
      status: 'unread',
      createdAt: new Date(),
    });

    await notification.save();
    return notification;
  } catch (err) {
    console.error("Notification save failed:", err);
    throw err;
  }
};

export const getNotifications = async (req, res) => {
  const { recipientType } = req.query;
  console.log("Received getNotifications:", { recipientType });

  if (!recipientType) {
    return res.status(400).json({ message: "Missing recipientType" });
  }

  try {
    let filter = {};

    if (recipientType === 'admin') {
      filter = { recipientType: { $in: ['admin', 'user'] } };
    } else {
      filter = { recipientType: 'user' };
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    console.log("Fetched notifications:", notifications.length);
    res.status(200).json(notifications);
  } catch (err) {
    console.error("Notification fetch failed:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};
