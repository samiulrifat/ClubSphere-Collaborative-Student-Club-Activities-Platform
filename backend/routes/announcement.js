const express = require('express');
const router = express.Router({ mergeParams: true }); // to access clubId param

const authMiddleware = require('../middleware/authMiddleware');
const announcementController = require('../controllers/announcementController');

// All routes require auth
router.use(authMiddleware);

// Get all announcements for a club
router.get('/:clubId', announcementController.getAnnouncements);

// Create new announcement (only for club officers/owners)
router.post('/:clubId', announcementController.createAnnouncement);

module.exports = router;
