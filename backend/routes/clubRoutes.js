const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/create', authMiddleware, clubController.createClub);
router.get('/myclubs', authMiddleware, clubController.getMyClubs);
router.get('/:clubId', authMiddleware, clubController.getClubDetails);
router.post('/:clubId/invite', authMiddleware, clubController.inviteMember);
router.post('/:clubId/accept', authMiddleware, clubController.acceptInvitation);
router.post('/:clubId/decline', authMiddleware, clubController.declineInvitation);
router.delete('/:clubId/member/:memberId', authMiddleware, clubController.removeMember);

router.post('/:clubId/announcement', authMiddleware, clubController.addAnnouncement);
router.get('/:clubId/announcements', authMiddleware, clubController.getAnnouncements);

router.post('/:clubId/activity', authMiddleware, clubController.addActivityLog);
router.get('/:clubId/activity', authMiddleware, clubController.getActivityLog);

router.post('/:clubId/meeting', authMiddleware, clubController.createMeeting);
router.get('/:clubId/meetings', authMiddleware, clubController.getMeetings);
router.post('/:clubId/meeting/:meetingId/attendance', authMiddleware, clubController.markAttendance);

router.post('/:clubId/poll', authMiddleware, clubController.createPoll);
router.get('/:clubId/polls', authMiddleware, clubController.getPolls);
router.post('/:clubId/poll/:pollId/vote', authMiddleware, clubController.votePoll);
router.put('/:clubId/poll/:pollId', authMiddleware, clubController.editPoll); 
router.delete('/:clubId/poll/:pollId', authMiddleware, clubController.deletePoll);

router.post(
  '/:clubId/resource',
  authMiddleware,
  upload.single('file'), 
  clubController.uploadResource
);
router.get('/:clubId/resources', authMiddleware, clubController.getResources);
router.delete('/:clubId/resource/:resourceId', authMiddleware, clubController.deleteResource);

router.post('/:clubId/event', authMiddleware, clubController.createEvent);
router.get('/:clubId/event', authMiddleware, clubController.getEvents);
router.post('/:clubId/event/:eventId/signup', authMiddleware, clubController.signupVolunteer);
router.get('/:clubId/event/:eventId/volunteers', authMiddleware, clubController.getVolunteers);
router.delete('/:clubId/event/:eventId', authMiddleware, clubController.deleteEvent);

router.post('/:clubId/achievement', authMiddleware, clubController.createAchievement);
router.put('/:clubId/achievement/:achievementId', authMiddleware, clubController.editAchievement);
router.delete('/:clubId/achievement/:achievementId', authMiddleware, clubController.deleteAchievement);
router.post('/:clubId/achievement/:achievementId/award', authMiddleware, clubController.awardAchievement);
router.post('/:clubId/achievement/:achievementId/remove', authMiddleware, clubController.removeAwardedAchievement);
router.get('/:clubId/achievements', authMiddleware, clubController.getUserAchievements);

router.post('/:clubId/feedback', authMiddleware, clubController.submitFeedback);
router.get('/:clubId/feedbacks', authMiddleware, clubController.getFeedbacks);

router.post('/:clubId/contact', authMiddleware, clubController.addContact);
router.get('/:clubId/contacts', authMiddleware, clubController.getContactDirectory);
router.put('/:clubId/contact/:contactId', authMiddleware, clubController.editContact);
router.delete('/:clubId/contact/:contactId', authMiddleware, clubController.deleteContact);


module.exports = router;
