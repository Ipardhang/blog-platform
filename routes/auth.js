const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { wrap, setAuthCookie, clearAuthCookie, rateLimit } = require('../middleware');

const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many authentication attempts. Please try again later.' });
const response = (u) => ({ user: { id: u._id, name: u.name, email: u.email, role: u.role } });

const issueToken = (u, res) => {
  const token = jwt.sign({ id: u._id, role: u.role, name: u.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
  setAuthCookie(res, token);
  return response(u);
};

router.post('/register', authLimit, wrap(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!/^\S+@\S+\.\S+$/.test(email) || name.length < 2 || name.length > 80 || password.length < 6 || password.length > 128)
    return res.status(400).json({ error: 'Enter a valid name, email and a 6-128 character password' });
  if (await User.findOne({ email })) return res.status(409).json({ error: 'Email already registered' });
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
  res.status(201).json(issueToken(user, res));
}));

router.post('/login', authLimit, wrap(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.password)))
    return res.status(401).json({ error: 'Invalid email or password' });
  res.json(issueToken(user, res));
}));

router.post('/logout', wrap(async (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
}));

module.exports = router;