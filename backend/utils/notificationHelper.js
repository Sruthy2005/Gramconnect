const Notification = require('../models/Notification');
const sse = require('./sse');

/**
 * Creates a notification in the database and broadcasts it to active SSE clients.
 */
const createNotification = async ({
  recipientUser = null,
  recipientRole = 'citizen',
  title,
  message,
  type = 'Information',
  relatedComplaint = null,
  relatedAnnouncement = null
}) => {
  try {
    const notification = await Notification.create({
      recipientUser,
      recipientRole,
      title,
      message,
      type,
      relatedComplaint,
      relatedAnnouncement
    });

    // Populate related complaint details if available
    let populatedNotif = notification;
    if (relatedComplaint) {
      populatedNotif = await Notification.findById(notification._id)
        .populate('relatedComplaint', 'complaintId title category status');
    }

    // Broadcast to SSE clients matching criteria
    const clients = sse.getClients();
    clients.forEach(client => {
      let isRecipient = false;

      // Match recipient user ID if specified
      if (recipientUser && client.userId === recipientUser.toString()) {
        isRecipient = true;
      }

      // Match recipient role if recipientUser is NOT specified
      if (!recipientUser) {
        const matchesRole = (
          recipientRole.toLowerCase() === client.role ||
          (recipientRole.toLowerCase() === 'admin' && client.role === 'admin') ||
          (recipientRole.toLowerCase() === 'citizen' && client.role === 'citizen')
        );
        if (matchesRole) {
          isRecipient = true;
        }
      }

      if (isRecipient) {
        sse.sendSSEEvent(client, 'notification', populatedNotif);
      }
    });

    return notification;
  } catch (error) {
    console.error('[Notification Helper] Error creating notification:', error);
  }
};

module.exports = {
  createNotification
};
