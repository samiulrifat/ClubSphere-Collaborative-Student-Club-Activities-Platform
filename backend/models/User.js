const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ['student', 'club_admin'], required: true },
  clubsJoined: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }],
  clubsInvited: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }],
  clubsCreated: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
