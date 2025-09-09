const Club = require('../models/Club');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

exports.createClub = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id; 

    const club = new Club({
      name,
      description,
      createdBy: userId,
      members: [userId],
      officers: [userId],
    });
    await club.save();

    await User.findByIdAndUpdate(userId, { $push: { clubsCreated: club._id, clubsJoined: club._id } });

    res.status(201).json({ success: true, club });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not create club', error: error.message });
  }
};

exports.getMyClubs = async (req, res) => {
  try {
    const userId = req.user.id;
    const clubs = await Club.find({ createdBy: userId }).select('name description');
    res.json({ success: true, clubs });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch clubs', error: error.message });
  }
};

exports.getClubDetails = async (req, res) => {
  try {
    const { clubId } = req.params;
    const club = await Club.findById(clubId)
      .populate('members', 'name email')
      .populate('invitations', 'name email')
      .populate('officers', 'name email');

    if (!club) return res.status(404).json({ message: 'Club not found' });

    res.json({ success: true, club });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch club details', error: error.message });
  }
};

exports.inviteMember = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const { email } = req.body;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    if (!club.officers.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (club.members.includes(user._id)) return res.status(400).json({ message: 'User already a member' });
    if (club.invitations.includes(user._id)) return res.status(400).json({ message: 'User already invited' });

    club.invitations.push(user._id);
    await club.save();

    user.clubsInvited.push(club._id);
    await user.save();

    res.json({ success: true, message: 'Invitation sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error inviting member', error: error.message });
  }
};


exports.acceptInvitation = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.invitations.includes(userId)) return res.status(400).json({ message: 'No invitation found' });

    club.invitations = club.invitations.filter(id => id.toString() !== userId);
    club.members.push(userId);
    await club.save();

    const user = await User.findById(userId);
    user.clubsInvited = user.clubsInvited.filter(id => id.toString() !== clubId);
    user.clubsJoined.push(clubId);
    await user.save();

    res.json({ success: true, message: 'Invitation accepted' });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting invitation', error: error.message });
  }
};

exports.declineInvitation = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.invitations.includes(userId)) return res.status(400).json({ message: 'No invitation found' });

    club.invitations = club.invitations.filter(id => id.toString() !== userId);
    await club.save();

    const user = await User.findById(userId);
    user.clubsInvited = user.clubsInvited.filter(id => id.toString() !== clubId);
    await user.save();

    res.json({ success: true, message: 'Invitation declined' });
  } catch (error) {
    res.status(500).json({ message: 'Error declining invitation', error: error.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const memberId = req.params.memberId;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    if (!club.officers.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    if (!club.members.includes(memberId)) return res.status(400).json({ message: 'User not a member' });

    club.members = club.members.filter(id => id.toString() !== memberId);
    club.officers = club.officers.filter(id => id.toString() !== memberId);
    await club.save();

    const user = await User.findById(memberId);
    user.clubsJoined = user.clubsJoined.filter(id => id.toString() !== clubId);
    await user.save();

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing member', error: error.message });
  }
};

exports.getUserInvitations = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const invitations = await Club.find({ _id: { $in: user.clubsInvited } }).select('name description');

    res.json({ success: true, invitations });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invitations', error: error.message });
  }
};

exports.addAnnouncement = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;
    const { title, content } = req.body;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.officers.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    const newAnnouncement = { title, content, date: new Date() };
    club.announcements.unshift(newAnnouncement); 
    await club.save();

    res.status(201).json({ success: true, announcement: newAnnouncement });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add announcement', error: error.message });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.members.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    res.json({ success: true, announcements: club.announcements });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get announcements', error: error.message });
  }
};

exports.addActivityLog = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;
    const { description, photos } = req.body; 

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.officers.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    const newActivity = { description, photos, date: new Date() };
    club.activityLog.unshift(newActivity);

    await club.save();

    res.status(201).json({ success: true, activity: newActivity });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add activity', error: error.message });
  }
};

exports.getActivityLog = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.members.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    res.json({ success: true, activityLog: club.activityLog });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get activity log', error: error.message });
  }
};

exports.createMeeting = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;
    const { title, description, date, invitedMembers } = req.body;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    if (!club.officers.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    const newMeeting = {
      title,
      description,
      date,
      invitedMembers,
      attendance: invitedMembers.map(memberId => ({ user: memberId, status: 'absent' })),
      createdAt: new Date(),
    };

    club.meetings.push(newMeeting);
    await club.save();

    res.status(201).json({ success: true, meeting: newMeeting });
  } catch (error) {
    res.status(500).json({ message: 'Could not create meeting', error: error.message });
  }
};

exports.getMeetings = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.members.includes(userId) && !club.officers.includes(userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, meetings: club.meetings });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get meetings', error: error.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const meetingId = req.params.meetingId;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    const meeting = club.meetings.id(meetingId);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    const attendanceEntry = meeting.attendance.find(entry => entry.user.toString() === userId);
    if (!attendanceEntry) return res.status(403).json({ message: 'Not invited to this meeting' });

    attendanceEntry.status = 'present';
    await club.save();

    res.json({ success: true, message: 'Attendance marked present' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark attendance', error: error.message });
  }
};

exports.createPoll = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;
    const { question, options } = req.body; 

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    if (!club.officers.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    const newPoll = {
      question,
      options: options.map((text) => ({ text, votes: [] })),
      createdAt: new Date(),
    };

    club.polls.push(newPoll);
    await club.save();

    res.status(201).json({ success: true, poll: newPoll });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create poll', error: error.message });
  }
};

exports.getPolls = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    if (!club.members.includes(userId) && !club.officers.includes(userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, polls: club.polls });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get polls', error: error.message });
  }
};

exports.votePoll = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const pollId = req.params.pollId;
    const userId = req.user.id;
    const { optionIndex } = req.body;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.members.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    const poll = club.polls.id(pollId);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    poll.options.forEach((option) => {
      option.votes = option.votes.filter((voterId) => voterId.toString() !== userId);
    });

    poll.options[optionIndex].votes.push(userId);

    await club.save();

    res.json({ success: true, poll });
  } catch (error) {
    res.status(500).json({ message: 'Failed to vote', error: error.message });
  }
};

exports.editPoll = async (req, res) => {
  
};

exports.deletePoll = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const pollId = req.params.pollId;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) {
      console.error('Club not found:', clubId);
      return res.status(404).json({ message: 'Club not found' });
    }
    if (!club.officers.includes(userId)) {
      console.error('User not authorized:', userId);
      return res.status(403).json({ message: 'Not authorized' });
    }

    const poll = club.polls.id(pollId);
    if (!poll) {
      console.error('Poll not found:', pollId);
      return res.status(404).json({ message: 'Poll not found' });
    }

    try {
      club.polls = club.polls.filter(p => p._id.toString() !== pollId);
      await club.save();
      res.json({ success: true, message: 'Poll deleted' });
    } catch (removeError) {
      console.error('Error removing poll:', removeError);
      res.status(500).json({ message: 'Failed to remove poll', error: removeError.message });
    }
  } catch (error) {
    console.error('Delete poll error:', error);
    res.status(500).json({ message: 'Failed to delete poll', error: error.message });
  }
};

exports.uploadResource = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;
    const { title, type, linkUrl } = req.body;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    const isMember = club.members.includes(userId) || club.officers.includes(userId);
    if (!isMember) return res.status(403).json({ message: 'Not authorized' });

    let fileUrl = '';
    if (type === 'file') {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
      fileUrl = `/uploads/${req.file.filename}`;
    }

    const newResource = {
      uploader: userId,
      type,
      title,
      fileUrl,
      linkUrl,
      uploadedAt: new Date(),
    };

    club.resources.unshift(newResource);
    await club.save();

    res.status(201).json({ success: true, resource: newResource });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload resource', error: error.message });
  }
};

exports.getResources = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;

    const club = await Club.findById(clubId).populate('resources.uploader', 'name email');
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!(club.members.includes(userId) || club.officers.includes(userId))) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, resources: club.resources });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch resources', error: error.message });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const resourceId = req.params.resourceId;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    const resource = club.resources.id(resourceId);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    if (resource.uploader.toString() !== userId && !club.officers.includes(userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (resource.type === 'file' && resource.fileUrl) {
      const filePath = path.join(__dirname, '../public', resource.fileUrl);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Failed to delete file:', err);
      });
    }

    resource.remove();
    await club.save();

    res.json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete resource', error: error.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;
    const { name, description } = req.body;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    if (!club.officers.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    const newEvent = { name, description, volunteers: [], createdAt: new Date() };

    club.events.unshift(newEvent);
    await club.save();

    res.status(201).json({ success: true, event: newEvent });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create event', error: err.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.members.includes(userId) && !club.officers.includes(userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, events: club.events });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get events', error: err.message });
  }
};

exports.signupVolunteer = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const eventId = req.params.eventId;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.members.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    const event = club.events.id(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.volunteers.some(v => v.user.toString() === userId)) {
      return res.status(400).json({ message: 'Already signed up' });
    }

    event.volunteers.push({ user: userId, signedUpAt: new Date() });

    await club.save();

    res.json({ success: true, message: 'Signed up as volunteer' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to sign up', error: err.message });
  }
};

exports.getVolunteers = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const eventId = req.params.eventId;
    const userId = req.user.id;

    const club = await Club.findById(clubId).populate('events.volunteers.user', 'name email');
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.officers.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    const event = club.events.id(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    res.json({ success: true, volunteers: event.volunteers });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get volunteers', error: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { clubId, eventId } = req.params;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    const initialLength = club.events.length;
    club.events = club.events.filter(e => e._id.toString() !== eventId);
    if (club.events.length === initialLength) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await club.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete event', error: error.message });
  }
};

exports.createAchievement = async (req, res) => {
  try {
    const { title, badgeUrl, description } = req.body;
    const clubId = req.params.clubId;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    if (!club.officers.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    const newAchievement = { title, badgeUrl, description, createdAt: new Date() };
    club.achievements.push(newAchievement);

    await club.save();

    res.status(201).json({ success: true, achievement: newAchievement });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create achievement', error: error.message });
  }
};

exports.editAchievement = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const achievementId = req.params.achievementId;
    const userId = req.user.id;
    const updates = req.body;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    if (!club.officers.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    const achievement = club.achievements.id(achievementId);
    if (!achievement) return res.status(404).json({ message: 'Achievement not found' });

    Object.assign(achievement, updates);
    await club.save();

    res.json({ success: true, achievement });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update achievement', error: error.message });
  }
};

exports.deleteAchievement = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const achievementId = req.params.achievementId;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.officers.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    const achievement = club.achievements.id(achievementId);
    if (!achievement) return res.status(404).json({ message: 'Achievement not found' });

  club.achievements = club.achievements.filter(a => a._id.toString() !== achievementId);
  club.awardedAchievements = club.awardedAchievements.filter(a => a.achievement.toString() !== achievementId);

    await club.save();

    res.json({ success: true, message: 'Achievement deleted' });
  } catch (error) {
    console.error('Delete achievement error:', error);
    res.status(500).json({ message: 'Failed to delete achievement', error: error.message });
  }
};

exports.awardAchievement = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const achievementId = req.params.achievementId;
    const memberId = req.body.memberId;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    if (!club.officers.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    if (!club.members.includes(memberId)) return res.status(400).json({ message: 'User not a club member' });

    const alreadyAwarded = club.awardedAchievements.some(
      (a) => a.achievement.toString() === achievementId && a.member.toString() === memberId
    );
    if (alreadyAwarded) {
      return res.status(400).json({ message: 'Achievement already awarded to this member' });
    }

    club.awardedAchievements.push({
      achievement: achievementId,
      member: memberId,
      awardedAt: new Date(),
    });

    await club.save();

    res.json({ success: true, message: 'Achievement awarded' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to award achievement', error: error.message });
  }
};

exports.removeAwardedAchievement = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const achievementId = req.params.achievementId;
    const memberId = req.body.memberId;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    if (!club.officers.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    club.awardedAchievements = club.awardedAchievements.filter(
      (a) => !(a.achievement.toString() === achievementId && a.member.toString() === memberId)
    );

    await club.save();

    res.json({ success: true, message: 'Awarded achievement removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove awarded achievement', error: error.message });
  }
};

exports.getUserAchievements = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.members.includes(userId) && !club.officers.includes(userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const userAwarded = club.awardedAchievements.filter(a => a.member.toString() === userId.toString());

    const allAchievements = club.achievements;

    res.json({ success: true, userAchievements: userAwarded, allAchievements });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get achievements', error: error.message });
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;
    const { message } = req.body;

    if (!message) return res.status(400).json({ message: 'Feedback message required' });

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.members.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    club.feedbacks.push({ sender: userId, message, createdAt: new Date() });

    await club.save();

    res.json({ success: true, message: 'Feedback submitted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit feedback', error: error.message });
  }
};

exports.getFeedbacks = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;

    const club = await Club.findById(clubId).populate('feedbacks.sender', 'name email');
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.officers.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    res.json({ success: true, feedbacks: club.feedbacks });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch feedbacks', error: error.message });
  }
};

exports.addContact = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const { name, roleInClub, contactEmail } = req.body;
    const userId = req.user.id;

    if (!name || !roleInClub || !contactEmail)
      return res.status(400).json({ message: 'All fields required' });

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.officers.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    club.contactDirectory.push({ name, roleInClub, contactEmail, createdAt: new Date() });
    await club.save();

    res.status(201).json({ success: true, contact: club.contactDirectory.slice(-1)[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add contact', error: error.message });
  }
};

exports.getContactDirectory = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    const isAdmin = club.officers.includes(userId);
    const isMember = club.members.includes(userId) || isAdmin;

    if (!isMember) return res.status(403).json({ message: 'Not authorized' });

    let contacts = isAdmin 
      ? club.contactDirectory 
      : club.contactDirectory.filter(c => c.roleInClub.toLowerCase() === 'admin' || c.roleInClub.toLowerCase() === 'officer');

    res.json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get contact directory', error: error.message });
  }
};

exports.editContact = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const contactId = req.params.contactId;
    const updates = req.body;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.officers.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    const contact = club.contactDirectory.id(contactId);
    if (!contact) return res.status(404).json({ message: 'Contact not found' });

    Object.assign(contact, updates);
    await club.save();

    res.json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update contact', error: error.message });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const contactId = req.params.contactId;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.officers.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    club.contactDirectory.id(contactId).remove();
    await club.save();

    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete contact', error: error.message });
  }
};
