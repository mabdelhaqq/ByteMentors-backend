const mongoose = require('mongoose');

const OpportunitySchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  field: {
    type: String,
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  applicants: [
    {
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
      status: {
        type: String,
        enum: ['accepted', 'rejected', 'pending'],
        default: 'pending'
      },
      interviewType: {
        type: String,
        enum: ['online', 'in-person'],
      },
      interviewDate: {
        type: Date,
      },
      interviewTime: {
        type: String,
      },
      interviewLink: {
        type: String,
      },
      interviewAddress: {
        type: String,
      }
    
    },
  ],
  submitterCount: {
    type: Number,
    default: 0,
  },
});

const OpportunityModel = mongoose.model('Opportunity', OpportunitySchema);

module.exports = OpportunityModel;


// const mongoose = require('mongoose');

// const ApplicantSchema = new mongoose.Schema({
//   studentId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Student',
//   },
//   status: {
//     type: String,
//     enum: ['accepted', 'rejected', 'pending'],
//     default: 'pending'
//   },
//   interviewType: {
//     type: String,
//     enum: ['online', 'in-person'],
//     required: function() { return this.status === 'accepted'; }
//   },
//   interviewDate: {
//     type: Date,
//     required: function() { return this.status === 'accepted'; }
//   },
//   interviewTime: {
//     type: String,
//     required: function() { return this.status === 'accepted'; }
//   },
//   interviewLink: {
//     type: String,
//     required: function() { return this.status === 'accepted' && this.interviewType === 'online'; }
//   },
//   interviewAddress: {
//     type: String,
//     required: function() { return this.status === 'accepted' && this.interviewType === 'in-person'; }
//   }
// });

// const OpportunitySchema = new mongoose.Schema({
//   companyId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Company',
//     required: true,
//   },
//   field: {
//     type: String,
//     required: true,
//   },
//   deadline: {
//     type: Date,
//     required: true,
//   },
//   description: {
//     type: String,
//     required: true,
//   },
//   applicants: [ApplicantSchema],
//   submitterCount: {
//     type: Number,
//     default: 0,
//   },
// });

// const OpportunityModel = mongoose.model('Opportunity', OpportunitySchema);

// module.exports = OpportunityModel;
