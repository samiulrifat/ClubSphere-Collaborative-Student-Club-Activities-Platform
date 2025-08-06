const Club = require('../models/Club');
const User = require('../models/User');

// Create a new club, logged-in user becomes owner
exports.createClub = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Prevent duplicate club names
    const existingClub = await Club.findOne({ name: name.trim() });
    if (existingClub) {
      return res.status(400).json({ msg: 'Club name already exists' });
    }

    const club = new Club({
      name: name.trim(),
      description: description || '',
      createdBy: req.user.id,
      members: [{ user: req.user.id, role: 'owner' }],
      pendingInvitations: [],
    });

    await club.save();

    res.status(201).json(club);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Edit club profile (only owner/officers)
exports.editClub = async (req, res) => {
  try {
    const { name, description } = req.body;
    const club = req.club; // from requireClubRole middleware

    if (name) club.name = name.trim();
    if (description) club.description = description;

    await club.save();

    res.json(club);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Invite member by userId
exports.inviteMember = async (req, res) => {
  try {
    const club = req.club;
    const { userId } = req.body;

    // Check user exists
    const userToInvite = await User.findById(userId);
    if (!userToInvite) return res.status(404).json({ msg: 'User not found' });

    // Check not already a member
    if (club.members.some((m) => m.user.toString() === userId)) {
      return res.status(400).json({ msg: 'User is already a member' });
    }

    // Check not already invited
    if (club.pendingInvitations.some((id) => id.toString() === userId)) {
      return res.status(400).json({ msg: 'User has already been invited' });
    }

    club.pendingInvitations.push(userId);

    await club.save();

    res.json({ msg: `Invitation sent to user ${userId}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Remove member by userId
exports.removeMember = async (req, res) => {
  try {
    const club = req.club;
    const userIdToRemove = req.params.userId.toString();

    // Protect owner from being removed by others
    const membership = club.members.find((m) => m.user.toString() === userIdToRemove);
    if (!membership) {
      return res.status(404).json({ msg: 'User is not a member of the club' });
    }
    if (membership.role === 'owner') {
      return res.status(403).json({ msg: 'Cannot remove the club owner' });
    }

    club.members = club.members.filter((m) => m.user.toString() !== userIdToRemove);

    await club.save();

    res.json({ msg: `User ${userIdToRemove} removed from club` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Respond to invitation - accept or decline
exports.respondToInvitation = async (req, res) => {
  try {
    const clubId = req.params.id;
    const userId = req.user.id;
    const { accept } = req.body;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ msg: 'Club not found' });

    // Check if user was invited
    if (!club.pendingInvitations.find((id) => id.toString() === userId)) {
      return res.status(400).json({ msg: 'No invitation found for this user' });
    }

    if (accept) {
      // Add as member with role 'member'
      club.members.push({ user: userId, role: 'member' });
    }

    // Remove from pending invitations either way
    club.pendingInvitations = club.pendingInvitations.filter((id) => id.toString() !== userId);

    await club.save();

    res.json({ msg: accept ? 'You joined the club' : 'Invitation declined' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
