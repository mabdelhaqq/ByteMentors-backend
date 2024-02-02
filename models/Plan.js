const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  field: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
});

const PlanModel = mongoose.model('Plan', PlanSchema);

module.exports = PlanModel;