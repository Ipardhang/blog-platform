const router = require('express').Router();
const mongoose = require('mongoose');
const { Post, Comment } = require('../models');
const { auth, optionalAuth, wrap, canModify } = require('../middleware');

// hide the raw likes array; expose a count and whether the current user liked it
const shape = (p, uid) => {
  const { likes = [], ...rest } = p;
  return { ...rest, likeCount: likes.length, liked: !!uid && likes.some((x) => String(x) === String(uid)) };
};

const LIMIT = 6;
const clean = ({ title, content }) => ({ title: (title || '').trim(), content: (content || '').trim() });

// List posts (public): ?page=1&search=word
router.get('/', optionalAuth, wrap(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const q = {};
  if (req.query.author && mongoose.isValidObjectId(req.query.author)) q.author = req.query.author;
  if (req.query.search) {
    const r = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
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
    posts: posts.map((p) => ({ ...shape(p, req.user && req.user.id), words: p.content.trim().split(/\s+/).length, content: p.content.slice(0, 220), commentCount: map[String(p._id)] || 0 })),
    page, pages: Math.max(1, Math.ceil(total / LIMIT)), total,
  });
}));

router.get('/:id', optionalAuth, wrap(async (req, res) => {
  const post = await Post.findById(req.params.id).populate('author', 'name').lean();
  post ? res.json(shape(post, req.user && req.user.id)) : res.status(404).json({ error: 'Post not found' });
}));

// Like / unlike (toggle)
router.post('/:id/like', auth, wrap(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const has = post.likes.some((x) => String(x) === String(req.user.id));
  await Post.updateOne({ _id: post._id }, has ? { $pull: { likes: req.user.id } } : { $addToSet: { likes: req.user.id } });
  res.json({ liked: !has, likeCount: post.likes.length + (has ? -1 : 1) });
}));

router.post('/', auth, wrap(async (req, res) => {
  const data = clean(req.body);
  if (!data.title || !data.content) return res.status(400).json({ error: 'Title and content are required' });
  res.status(201).json(await Post.create({ ...data, author: req.user.id }));
}));

router.put('/:id', auth, wrap(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (!canModify(req.user, post.author)) return res.status(403).json({ error: 'You can only edit your own posts' });
  const data = clean(req.body);
  if (!data.title || !data.content) return res.status(400).json({ error: 'Title and content are required' });
  Object.assign(post, data);
  res.json(await post.save());
}));

router.delete('/:id', auth, wrap(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (!canModify(req.user, post.author)) return res.status(403).json({ error: 'You can only delete your own posts' });
  await Promise.all([post.deleteOne(), Comment.deleteMany({ post: post._id })]);
  res.json({ ok: true });
}));

// Comments on a post
router.get('/:id/comments', wrap(async (req, res) =>
  res.json(await Comment.find({ post: req.params.id }).sort('createdAt').populate('author', 'name'))));

router.post('/:id/comments', auth, wrap(async (req, res) => {
  const text = (req.body.text || '').trim();
  if (!text || text.length > 1000) return res.status(400).json({ error: 'Comment must be 1-1000 characters' });
  if (!(await Post.exists({ _id: req.params.id }))) return res.status(404).json({ error: 'Post not found' });
  const c = await Comment.create({ post: req.params.id, author: req.user.id, text });
  res.status(201).json(await c.populate('author', 'name'));
}));

module.exports = router;
