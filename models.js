const mongoose = require('mongoose');
const { Schema } = mongoose;

const User = mongoose.model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true }));

const Post = mongoose.model('Post', new Schema({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true }));

const Comment = mongoose.model('Comment', new Schema({
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: 1000 },
}, { timestamps: true }));

module.exports = { User, Post, Comment };
