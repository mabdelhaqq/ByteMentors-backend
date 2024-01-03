const mongoose = require('mongoose');
const StudentSchema = new mongoose.Schema({
  name: {
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
  bio: {
    type: String,
  },
  linkedin: {
    type: String,
  },
  profileImage: {
    type: String,
  },
  github: {
    type: String,
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
  },
  graduate: {
    type: Boolean,
    default: false,
    required: true,
  },
  university: {
    type: String,
  },
  graduationYear: {
    type: Number,
  },
  preferredField: {
    type: String,
    enum: ['front end', 'back end', 'QA', 'devops'],
  },
  skills: {
    type: [String],
    enum: ['HTML5', 'CSS3', 'JavaScript', 'BootStrap5', 'SASS', 'LESS', 'TypeScript', 'other'],
  },
  cv: {
    type: String,
  },
});

const StudentModel = mongoose.model('Student', StudentSchema);

module.exports = StudentModel;
