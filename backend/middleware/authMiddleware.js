const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.headers['authorization'] ? req.headers['authorization'].split(' ')[1] : null;
  if (!token) return res.status(401).json({ msg: 'No token provided' });

  try {
    const decoded = jwt.verify(token, 'yoursecretkey'); // Replace with process.env.JWT_SECRET in production
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Invalid token' });
  }
}

module.exports = authMiddleware;
