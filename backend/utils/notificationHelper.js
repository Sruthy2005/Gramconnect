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
  relatedAnnouncement = null,
  districtTarget = 'ALL',
  panchayatTarget = 'ALL'
}) => {
  try {
    const notification = await Notification.create({
      recipientUser,
      recipientRole,
      title,
      message,
      type,
      relatedComplaint,
      relatedAnnouncement,
      districtTarget,
      panchayatTarget
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

      // Match recipient role, district, and panchayat targeting if recipientUser is NOT specified
      if (!recipientUser) {
        const matchesRole = (
          recipientRole.toLowerCase() === client.role ||
          (recipientRole.toLowerCase() === 'admin' && client.role === 'admin') ||
          (recipientRole.toLowerCase() === 'citizen' && client.role === 'citizen') ||
          (recipientRole.toLowerCase() === 'panchayat_admin' && client.role === 'panchayat_admin')
        );

        const matchesDistrict = (
          !districtTarget ||
          districtTarget === 'ALL' ||
          client.district === districtTarget
        );

        const matchesPanchayat = (
          !panchayatTarget ||
          panchayatTarget === 'ALL' ||
          client.panchayat === panchayatTarget
        );

        if (matchesRole && matchesDistrict && matchesPanchayat) {
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
