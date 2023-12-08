const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    enum: ["Nablus", "Ramallah", "Jerusalem", "Bethlehem", "Hebron", "Jenin", "Tulkarm", "Qalqilya", "Jericho", "Rawabi","Tubas", 'other'],
  },
  phoneNumber: {
    type: String,
  },
  description: {
    type: String,
  },
  linkedin: {
    type: String,
  },
  profileImage: {
    type: String,
  },
});

const CompanyModel = mongoose.model('Company', CompanySchema);

module.exports = CompanyModel;
