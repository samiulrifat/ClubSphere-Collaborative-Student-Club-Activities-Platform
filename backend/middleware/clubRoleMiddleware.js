const Club = require('../models/Club');

// Require role to be one of the allowedRoles for the target club
function requireClubRole(allowedRoles = []) {
  return async function (req, res, next) {
    const clubId = req.params.id;
    const userId = req.user.id;

    try {
      const club = await Club.findById(clubId);
      if (!club) return res.status(404).json({ msg: 'Club not found' });

      // Find this user's membership with role
      const membership = club.members.find(
        (m) => m.user.toString() === userId.toString()
      );

      if (!membership) return res.status(403).json({ msg: 'You are not a member of this club' });

      if (!allowedRoles.includes(membership.role))
        return res.status(403).json({ msg: 'Access denied: insufficient permissions' });

      // Attach club to req for controller use if needed
      req.club = club;

      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  };
}

module.exports = requireClubRole;
