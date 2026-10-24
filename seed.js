require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Post, Comment } = require('./models');

const adminPassword = process.env.SEED_ADMIN_PASSWORD;
const demoPassword = process.env.SEED_DEMO_PASSWORD;

if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to run seed.js in production.');
}
if (!adminPassword || !demoPassword || adminPassword.length < 12 || demoPassword.length < 12) {
  throw new Error('Set SEED_ADMIN_PASSWORD and SEED_DEMO_PASSWORD to passwords of at least 12 characters.');
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany({}), Post.deleteMany({}), Comment.deleteMany({})]);

  const [admin, demo] = await User.create([
    { name: 'Admin', email: 'admin@blog.local', password: await bcrypt.hash(adminPassword, 12), role: 'admin' },
    { name: 'Demo Writer', email: 'demo@blog.local', password: await bcrypt.hash(demoPassword, 12) },
  ]);

  const posts = await Post.create([
    { title: 'Welcome to the blog', author: admin._id, content: 'This is a demo post.\n\nRegister an account to write your own posts and join the discussion in the comments.' },
    { title: 'Getting started with Node.js and Express', author: demo._id, content: 'Express makes it easy to build REST APIs.\n\nIn this post we look at routes, middleware and error handling, and why keeping each concern in its own file makes a project easier to grow.' },
    { title: 'Why I love MongoDB for side projects', author: demo._id, content: 'Flexible schemas let you move fast.\n\nWith Mongoose you still get validation and relationships through populate, which is perfect for a blog with users, posts and comments.' },
  ]);

  await Comment.create([
    { post: posts[1]._id, author: admin._id, text: 'Great intro, thanks for sharing!' },
    { post: posts[1]._id, author: demo._id, text: 'Glad you liked it. More posts coming soon.' },
  ]);

  console.log('Seeded demo data.');
  await mongoose.disconnect();
})().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});
