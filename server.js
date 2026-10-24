require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { rateLimit } = require('./middleware');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('Production requires a JWT_SECRET of at least 32 characters.');
}
if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI is required.');
}

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 120, message: 'Too many requests. Please try again shortly.' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  if (err.name === 'PayloadTooLargeError' || err.type === 'entity.too.large')
    return res.status(413).json({ error: 'Request is too large' });
  if (err.name === 'CastError') return res.status(404).json({ error: 'Not found' });
  if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
  console.error(err);
  res.status(err.status || 500).json({ error: isProduction ? 'Server error' : (err.message || 'Server error') });
});

const PORT = process.env.PORT || 3000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log('Running on http://localhost:' + PORT)))
  .catch((e) => { console.error('DB connection failed:', e.message); process.exit(1); });