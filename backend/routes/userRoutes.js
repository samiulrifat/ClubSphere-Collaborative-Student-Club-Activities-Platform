const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/invitations', authMiddleware, userController.getUserInvitations);
router.get('/joinedclubs', authMiddleware, userController.getJoinedClubs);


module.exports = router;
