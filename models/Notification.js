const mongoose = require('mongoose');
const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel',
    required: true,
  },
  onModel: {
    type: String,
    required: true,
    enum: ['Student', 'Company'],
  },
  type: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  opened: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const NotificationModel = mongoose.model('Notification', NotificationSchema);
module.exports = NotificationModel;

