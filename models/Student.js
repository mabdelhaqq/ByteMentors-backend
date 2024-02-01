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
  },
  university: {
    type: String,
  },
  graduationYear: {
    type: Number,
  },
  preferredField: {
    type: String,
    enum: ["Frontend", "Backend", "Full Stack", "Mobile Application", "Data Science", "Machine Learning",
    "Artificial Intelligence", "Cyber Security", "Cloud Computing", "DevOps", "Network Administration",
    "Database Administration", "Game Development", "User Experience (UX) Design", "User Interface (UI) Design",
    "Quality Assurance", "Embedded Systems", "Internet of Things (IoT)", "Robotics",
    "Systems Engineering", "Business Intelligence"],
  },
  skills: {
    type: [String],
  },
  cv: {
    type: String,
  },
});

const StudentModel = mongoose.model('Student', StudentSchema);

module.exports = StudentModel;
