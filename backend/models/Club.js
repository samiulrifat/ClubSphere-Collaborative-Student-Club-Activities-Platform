const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  title: { type: String, required: true }, // Short title of activity
  date: { type: Date, default: Date.now },
  description: { type: String, required: true },
  photos: [{ type: String }], // Array of image URLs/paths
});

const MeetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  location: String,
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // members who attended
  invites: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
  }]
});

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const PollSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [OptionSchema],
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  voted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // to prevent double voting per poll (optional)
});

const ResourceSchema = new mongoose.Schema({
  type: { type: String, enum: ['file', 'link'], required: true },
  name: { type: String, required: true },   // filename or link title
  url: { type: String, required: true },    // file path or link URL
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const ClubSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Club creator/owner
  members: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: String }], // e.g., member, officer, admin
  pendingInvitations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // You can add other fields: logo, socials, events, etc.
}, { timestamps: true });

module.exports = mongoose.model('Club', ClubSchema);
