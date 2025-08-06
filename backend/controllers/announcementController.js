const Announcement = require('../models/Announcement');
const Club = require('../models/Club');

exports.createAnnouncement = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const { title, body } = req.body;
    const userId = req.user.id;

    // Check if club exists
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ msg: 'Club not found' });

    // Check if user is officer of the club
    const membership = club.members.find(m => m.user.toString() === userId);
    if (!membership || !['owner', 'officer'].includes(membership.role)) {
      return res.status(403).json({ msg: 'Not authorized to post announcements' });
    }

    const announcement = new Announcement({
      club: clubId,
      title,
      body,
      postedBy: userId,
    });

    await announcement.save();

    res.status(201).json(announcement);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const clubId = req.params.clubId;

    // Validate club exists
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ msg: 'Club not found' });

    // Fetch announcements sorted by newest first
    const announcements = await Announcement.find({ club: clubId })
      .sort({ createdAt: -1 })
      .populate('postedBy', 'name email'); // optional: sender details

    res.json(announcements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};


