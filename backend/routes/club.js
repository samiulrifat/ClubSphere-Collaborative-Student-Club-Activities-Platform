const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const requireClubRole = require('../middleware/clubRoleMiddleware');
const loadClub = require('../middleware/loadClub'); 
const upload = require('../middleware/upload');

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

// POST /api/clubs/:id/activities - Add a new activity (officer/owner)
router.post(
  '/:id/activities',
  requireClubRole(['owner', 'officer']),
  async (req, res) => {
    try {
      const club = await req.club; // you may already load club in your middleware
      const { title, date, description, photos } = req.body;
      if (!title || !description) {
        return res.status(400).json({ msg: "Title and description are required" });
      }
      const activity = {
        title,
        date: date || new Date(),
        description,
        photos: photos || [],
      };
      club.activities.unshift(activity);
      await club.save();
      res.status(201).json(club.activities[0]);
    } catch (err) {
      res.status(500).json({ msg: "Failed to add activity" });
    }
  }
);

// GET /api/clubs/:id/activities - List all activities of a club
router.get(
  '/:id/activities',
  authMiddleware,
  loadClub,        // ensure club is loaded here
  async (req, res) => {
    try {
      res.json(req.club.activities || []);
    } catch (err) {
      res.status(500).json({ msg: "Failed to fetch activities" });
    }
  }
);

// DELETE /api/clubs/:id/activities/:activityId - Remove an activity (officer/owner)
router.delete(
  '/:id/activities/:activityId',
  requireClubRole(['owner', 'officer']),
  async (req, res) => {
    try {
      const club = await req.club;
      club.activities = club.activities.filter(
        (a) => a._id.toString() !== req.params.activityId
      );
      await club.save();
      res.json({ msg: "Activity deleted" });
    } catch (err) {
      res.status(500).json({ msg: "Failed to delete activity" });
    }
  }
);

router.post(
  '/:id/meetings',
  requireClubRole(['owner', 'officer']),
  async (req, res) => {
    try {
      const club = await req.club;
      const { title, description, date, location } = req.body;
      if (!title || !date) return res.status(400).json({ msg: 'Title and date required' });
      const meeting = { title, description, date, location, attendees: [], invites: [] };
      club.meetings.unshift(meeting);
      await club.save();
      res.status(201).json(club.meetings[0]);
    } catch (err) {
      res.status(500).json({ msg: 'Failed to schedule meeting' });
    }
  }
);

// POST /api/clubs/:clubId/meetings/:meetingId/invite
router.post(
  '/:clubId/meetings/:meetingId/invite',
  requireClubRole(['owner', 'officer']),
  async (req, res) => {
    try {
      const club = await req.club;
      const meeting = club.meetings.id(req.params.meetingId);
      if (!meeting) return res.status(404).json({ msg: "Meeting not found" });
      const { userIds } = req.body; // array
      userIds.forEach(uid => {
        if (!meeting.invites.some(i => i.user.toString() === uid)) {
          meeting.invites.push({ user: uid });
        }
      });
      await club.save();
      res.json(meeting.invites);
    } catch (err) {
      res.status(500).json({ msg: "Failed to send invites" });
    }
  }
);

// POST /api/clubs/:clubId/meetings/:meetingId/rsvp
router.post(
  '/:clubId/meetings/:meetingId/rsvp',
  authMiddleware,
  async (req, res) => {
    try {
      const club = await req.club;
      const meeting = club.meetings.id(req.params.meetingId);
      if (!meeting) return res.status(404).json({ msg: "Meeting not found" });
      const invite = meeting.invites.find(i => i.user.toString() === req.user._id.toString());
      if (!invite) return res.status(403).json({ msg: "No invite found for user" });
      const { status } = req.body; // 'accepted' or 'declined'
      invite.status = status;
      await club.save();
      res.json({ msg: "RSVP updated" });
    } catch (err) {
      res.status(500).json({ msg: "Failed to update RSVP" });
    }
  }
);
// POST /api/clubs/:clubId/meetings/:meetingId/attendance
router.post(
  '/:clubId/meetings/:meetingId/attendance',
  requireClubRole(['owner', 'officer']),
  async (req, res) => {
    try {
      const club = await req.club;
      const meeting = club.meetings.id(req.params.meetingId);
      if (!meeting) return res.status(404).json({ msg: "Meeting not found" });
      const { attendeeIds } = req.body; // array of user IDs
      meeting.attendees = attendeeIds;
      await club.save();
      res.json(meeting.attendees);
    } catch (err) {
      res.status(500).json({ msg: "Failed to mark attendance" });
    }
  }
);

// GET /api/clubs/:id/meetings
router.get(
  '/:id/meetings',
  authMiddleware,
  loadClub,        // ensure club is loaded here
  async (req, res) => {
    try {
      res.json(req.club.meetings || []);
    } catch (err) {
      res.status(500).json({ msg: "Failed to fetch meetings" });
    }
  }
);

// POST /api/clubs/:id/polls - Create a poll (owner/officer)
router.post(
  '/:id/polls',
  requireClubRole(['owner', 'officer']),
  async (req, res) => {
    try {
      const club = req.club;
      const { question, options, expiresAt } = req.body;
      if (!question || !options || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ msg: "Question and at least two options are required" });
      }
      const poll = {
        question,
        options: options.map(opt => ({ text: opt, votes: [] })),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        voted: []
      };
      club.polls.unshift(poll);
      await club.save();
      res.status(201).json(club.polls[0]);
    } catch (err) {
      console.error("Create poll failed:", err);
      res.status(500).json({ msg: "Failed to create poll" });
    }
  }
);

// GET /api/clubs/:id/polls - List all polls (all members)
router.get(
  '/:id/polls',
  authMiddleware,
  loadClub,
  async (req, res) => {
    try {
      res.json(req.club.polls || []);
    } catch (err) {
      res.status(500).json({ msg: "Failed to fetch polls" });
    }
  }
);

// POST /api/clubs/:id/polls/:pollId/vote - Vote in a poll (all members)
router.post(
  '/:id/polls/:pollId/vote',
  authMiddleware,
  loadClub,
  async (req, res) => {
    try {
      const club = req.club;
      const poll = club.polls.id(req.params.pollId);
      if (!poll) return res.status(404).json({ msg: "Poll not found" });

      // Check if expired
      if (poll.expiresAt && new Date() > new Date(poll.expiresAt)) {
        return res.status(403).json({ msg: "Poll has expired" });
      }

      // Prevent double voting
      if (poll.voted.some(uid => uid.toString() === req.user.id.toString())) {
        return res.status(403).json({ msg: "You already voted" });
      }

      const { optionIdx } = req.body;
      if (
        typeof optionIdx !== "number" ||
        optionIdx < 0 ||
        optionIdx >= poll.options.length
      ) {
        return res.status(400).json({ msg: "Invalid option" });
      }

      poll.options[optionIdx].votes.push(req.user.id);   // Add user's vote
      poll.voted.push(req.user.id);                      // Track that user voted on this poll
      await club.save();

      res.json({ msg: "Vote recorded", poll });
    } catch (err) {
      console.error("Poll voting failed:", err);
      res.status(500).json({ msg: "Failed to vote" });
    }
  }
);

// Optionally: close/delete a poll (owner/officer only)
router.delete(
  '/:id/polls/:pollId',
  requireClubRole(['owner', 'officer']),
  async (req, res) => {
    try {
      const club = req.club;
      club.polls = club.polls.filter(
        (p) => p._id.toString() !== req.params.pollId
      );
      await club.save();
      res.json({ msg: "Poll deleted" });
    } catch (err) {
      res.status(500).json({ msg: "Failed to delete poll" });
    }
  }
);

// POST /api/clubs/:id/resources/upload
router.post(
  '/:id/resources/upload',
  requireClubRole(['owner', 'officer', 'member']),  // allow all members to upload
  upload.single('file'),
  async (req, res) => {
    try {
      const club = req.club;
      if (!req.file) {
        return res.status(400).json({ msg: "No file uploaded" });
      }
      // Construct accessible URL for file
      const fileUrl = `/uploads/${req.file.filename}`;
      const resource = {
        type: 'file',
        name: req.file.originalname,
        url: fileUrl,
        uploadedBy: req.user._id
      };
      club.resources.push(resource);
      await club.save();
      res.status(201).json(resource);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Failed to upload file" });
    }
  }
);

// POST /api/clubs/:id/resources/link
router.post(
  '/:id/resources/link',
  requireClubRole(['owner', 'officer', 'member']),
  async (req, res) => {
    try {
      const club = req.club;
      const { name, url } = req.body;
      if (!name || !url) {
        return res.status(400).json({ msg: "Name and URL are required" });
      }
      const resource = {
        type: 'link',
        name,
        url,
        uploadedBy: req.user._id
      };
      club.resources.push(resource);
      await club.save();
      res.status(201).json(resource);
    } catch (err) {
      res.status(500).json({ msg: "Failed to add link" });
    }
  }
);

// GET /api/clubs/:id/resources
router.get(
  '/:id/resources',
  authMiddleware,
  loadClub,
  async (req, res) => {
    try {
      res.json(req.club.resources || []);
    } catch (err) {
      res.status(500).json({ msg: "Failed to fetch resources" });
    }
  }
);


module.exports = router;
