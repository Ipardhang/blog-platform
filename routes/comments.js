const router = require('express').Router();
const { Comment, Post } = require('../models');
const { auth, wrap, canModify } = require('../middleware');

// A comment can be deleted by its author, the post's author, or an admin
router.delete('/:id', auth, wrap(async (req, res) => {
  const c = await Comment.findById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Comment not found' });
  const post = await Post.findById(c.post);
  if (!canModify(req.user, c.author) && !(post && String(post.author) === String(req.user.id)))
    return res.status(403).json({ error: 'Not allowed' });
  await c.deleteOne();
  res.json({ ok: true });
}));

module.exports = router;
