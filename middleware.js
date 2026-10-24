const jwt = require('jsonwebtoken');

const parseCookies = (header = '') => Object.fromEntries(
  header.split(';').map((part) => part.trim().split('=').map(decodeURIComponent))
    .filter(([key, value]) => key && value !== undefined)
);

const getToken = (req) => {
  const cookies = parseCookies(req.headers.cookie);
  return cookies.inkwell_token || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
};

exports.setAuthCookie = (res, token) => {
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', 'inkwell_token=' + encodeURIComponent(token) + '; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax' + (secure ? '; Secure' : ''));
};

exports.clearAuthCookie = (res) => {
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', 'inkwell_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax' + (secure ? '; Secure' : ''));
};

exports.auth = (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) throw new Error('Missing token');
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Please log in' });
  }
};

exports.optionalAuth = (req, res, next) => {
  try {
    const token = getToken(req);
    req.user = token ? jwt.verify(token, process.env.JWT_SECRET) : null;
  } catch { req.user = null; }
  next();
};

exports.rateLimit = ({ windowMs = 60000, max = 60, message = 'Too many requests.' } = {}) => {
  const buckets = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of buckets) if (value.reset <= now) buckets.delete(key);
  }, Math.max(windowMs, 60000)).unref();

  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.reset <= now) {
      bucket = { count: 0, reset: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      res.set('Retry-After', String(Math.ceil((bucket.reset - now) / 1000)));
      return res.status(429).json({ error: message });
    }
    next();
  };
};

exports.wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);
exports.canModify = (user, ownerId) => user.role === 'admin' || String(ownerId) === String(user.id);