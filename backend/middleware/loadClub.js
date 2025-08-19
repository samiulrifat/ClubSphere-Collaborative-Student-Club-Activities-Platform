const Club = require('../models/Club');

async function loadClub(req, res, next) {
  try {
    const clubId = req.params.id || req.params.clubId; // flexible param name
    if (!clubId) {
      return res.status(400).json({ msg: "Missing club ID" });
    }
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ msg: "Club not found" });
    }
    req.club = club;
    next();
  } catch (err) {
    console.error("Error loading club:", err);
    res.status(500).json({ msg: "Server error loading club" });
  }
}

module.exports = loadClub;
