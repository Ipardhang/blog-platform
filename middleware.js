const jwt = require('jsonwebtoken');

exports.auth = (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Please log in' });
  }
};

// reads the token if present, but lets anonymous visitors through
exports.optionalAuth = (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET); }
  catch { req.user = null; }
  next();
};

// wraps async handlers so errors reach the error middleware
exports.wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// owner or admin
exports.canModify = (user, ownerId) => user.role === 'admin' || String(ownerId) === String(user.id);
