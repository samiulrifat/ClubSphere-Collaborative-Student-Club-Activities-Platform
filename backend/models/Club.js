const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Club creator/owner
  members: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: String }], // e.g., member, officer, admin
  pendingInvitations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // You can add other fields: logo, socials, events, etc.
}, { timestamps: true });

module.exports = mongoose.model('Club', ClubSchema);
