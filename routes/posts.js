const router = require('express').Router();
const mongoose = require('mongoose');
const { Post, Comment } = require('../models');
const { auth, optionalAuth, wrap, canModify, rateLimit } = require('../middleware');

const shape = (p, uid) => {
  const { likes = [], ...rest } = p;
  return { ...rest, likeCount: likes.length, liked: !!uid && likes.some((x) => String(x) === String(uid)) };
};

const LIMIT = 6;
const COMMENT_LIMIT = 20;
const clean = ({ title, content }) => ({ title: String(title || '').trim(), content: String(content || '').trim() });
const writeLimit = rateLimit({ windowMs: 60000, max: 60, message: 'Too many write requests. Please slow down.' });

router.get('/', optionalAuth, wrap(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const q = {};
  if (req.query.author && mongoose.isValidObjectId(req.query.author)) q.author = req.query.author;
  if (req.query.search) {
    const term = String(req.query.search).slice(0, 100);
    const r = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    q.$or = [{ title: r }, { content: r }];
  }
  const [posts, total] = await Promise.all([
    Post.find(q).sort('-createdAt').skip((page - 1) * LIMIT).limit(LIMIT).populate('author', 'name').lean(),
    Post.countDocuments(q),
  ]);
  const counts = await Comment.aggregate([
    { $match: { post: { $in: posts.map((p) => p._id) } } },
    { $group: { _id: '$post', n: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json({
    posts: posts.map((p) => ({ ...shape(p, req.user && req.user.id), words: p.content.trim().split(/\s+/).filter(Boolean).length, content: p.content.slice(0, 220), commentCount: map[String(p._id)] || 0 })),
    page, pages: Math.max(1, Math.ceil(total / LIMIT)), total,
  });
}));

router.get('/:id', optionalAuth, wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Post not found' });
  const post = await Post.findById(req.params.id).populate('author', 'name').lean();
  post ? res.json(shape(post, req.user && req.user.id)) : res.status(404).json({ error: 'Post not found' });
}));

router.post('/:id/like', auth, writeLimit, wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Post not found' });
  const added = (await Post.updateOne({ _id: req.params.id, likes: { $ne: req.user.id } }, { $addToSet: { likes: req.user.id } })).modifiedCount;
  if (!added) {
    const removed = (await Post.updateOne({ _id: req.params.id, likes: req.user.id }, { $pull: { likes: req.user.id } })).modifiedCount;
    if (!removed) return res.status(404).json({ error: 'Post not found' });
    const post = await Post.findById(req.params.id).select('likes').lean();
    return res.json({ liked: false, likeCount: post ? post.likes.length : 0 });
  }
  const post = await Post.findById(req.params.id).select('likes').lean();
  res.json({ liked: true, likeCount: post ? post.likes.length : 1 });
}));

router.post('/', auth, writeLimit, wrap(async (req, res) => {
  const data = clean(req.body);
  if (!data.title || !data.content) return res.status(400).json({ error: 'Title and content are required' });
  if (data.title.length > 150) return res.status(400).json({ error: 'Title must be 150 characters or fewer' });
  if (data.content.length > 100000) return res.status(400).json({ error: 'Content is too long' });
  res.status(201).json(await Post.create({ ...data, author: req.user.id }));
}));

router.put('/:id', auth, writeLimit, wrap(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (!canModify(req.user, post.author)) return res.status(403).json({ error: 'You can only edit your own posts' });
  const data = clean(req.body);
  if (!data.title || !data.content) return res.status(400).json({ error: 'Title and content are required' });
  if (data.title.length > 150) return res.status(400).json({ error: 'Title must be 150 characters or fewer' });
  if (data.content.length > 100000) return res.status(400).json({ error: 'Content is too long' });
  Object.assign(post, data);
  res.json(await post.save());
}));

router.delete('/:id', auth, writeLimit, wrap(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (!canModify(req.user, post.author)) return res.status(403).json({ error: 'You can only delete your own posts' });
  await Promise.all([post.deleteOne(), Comment.deleteMany({ post: post._id })]);
  res.json({ ok: true });
}));

router.get('/:id/comments', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Post not found' });
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const [comments, total] = await Promise.all([
    Comment.find({ post: req.params.id }).sort('-createdAt').skip((page - 1) * COMMENT_LIMIT).limit(COMMENT_LIMIT).populate('author', 'name').lean(),
    Comment.countDocuments({ post: req.params.id }),
  ]);
  res.json({ comments, page, pages: Math.max(1, Math.ceil(total / COMMENT_LIMIT)), total });
}));

router.post('/:id/comments', auth, writeLimit, wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Post not found' });
  const text = String(req.body.text || '').trim();
  if (!text || text.length > 1000) return res.status(400).json({ error: 'Comment must be 1-1000 characters' });
  if (!(await Post.exists({ _id: req.params.id }))) return res.status(404).json({ error: 'Post not found' });
  const c = await Comment.create({ post: req.params.id, author: req.user.id, text });
  res.status(201).json(await c.populate('author', 'name'));
}));

module.exports = router;