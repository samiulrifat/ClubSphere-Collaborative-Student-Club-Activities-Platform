const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  officers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  invitations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  announcements: [
    {
      title: { type: String, required: true },
      content: { type: String, required: true },
      date: { type: Date, default: Date.now },
    },
  ],

  activityLog: [
    {
      description: { type: String, required: true },
      photos: [String], // array of image URLs or paths
      date: { type: Date, default: Date.now },
    },
  ],

  meetings: [
    {
      title: { type: String, required: true },
      description: String,
      date: { type: Date, required: true },
      invitedMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      attendance: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          status: { type: String, enum: ['present', 'absent'], default: 'absent' },
        }
      ],
      createdAt: { type: Date, default: Date.now }
    }
  ],

  polls: [
    {
      question: { type: String, required: true },
      options: [
        {
          text: { type: String, required: true },
          votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
        }
      ],
      createdAt: { type: Date, default: Date.now },
    }
  ],

  resources: [
    {
      uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      type: { type: String, enum: ['file', 'link'], required: true },
      fileUrl: String, // URL or path for files
      linkUrl: String, // URL if type is 'link'
      title: String,
      uploadedAt: { type: Date, default: Date.now },
    }
  ],

  events: [
    {
      name: { type: String, required: true },
      description: String,
      volunteers: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          signedUpAt: { type: Date, default: Date.now },
        },
      ],
      createdAt: { type: Date, default: Date.now },
    }
  ],

  achievements: [
    {
      title: { type: String, required: true },
      badgeUrl: String, // URL or filename of badge image/icon
      description: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],

  awardedAchievements: [
    {
      achievement: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' },
      member: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      awardedAt: { type: Date, default: Date.now }
    }
  ],

  feedbacks: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // student who submits
      message: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],

  contactDirectory: [
    {
      name: { type: String, required: true },
      roleInClub: { type: String, required: true }, // role as set by club admin
      contactEmail: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],


}, { timestamps: true });


module.exports = mongoose.model('Club', ClubSchema);
