const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const requireClubRole = require('../middleware/clubRoleMiddleware');

const clubController = require('../controllers/clubController');

// Protect all club routes with JWT auth
router.use(authMiddleware);

// Create a new club (any logged-in user)
router.post('/', clubController.createClub);

// Edit club (only owner or officer)
router.put(
  '/:id',
  requireClubRole(['owner', 'officer']),
  clubController.editClub
);

// Invite member (only owner or officer)
router.post(
  '/:id/invite',
  requireClubRole(['owner', 'officer']),
  clubController.inviteMember
);

// Remove member (only owner or officer)
router.delete(
  '/:id/members/:userId',
  requireClubRole(['owner', 'officer']),
  clubController.removeMember
);

// Respond to invitation (accept or decline) - only invited user
router.post('/:id/invitations/respond', clubController.respondToInvitation);

module.exports = router;
