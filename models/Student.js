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
  bio: {
    type: String,
  },
  linkedin: {
    type: String,
  },
  github: {
    type: String,
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
  },
  preferredField: {
    type: [String],
    enum: ['front end', 'back end', 'full stack', 'QA', 'devops', 'mobile application', 'cyber security', 'other'],
  },
  skills: {
    type: [String],
    enum: ['HTML5', 'CSS3', 'JavaScript', 'BootStrap5', 'SASS', 'LESS', 'TypeScript', 'other'],
  },
  profileImage: {
    type: String,
  },
});

const StudentModel = mongoose.model('Student', StudentSchema);

module.exports = StudentModel;
