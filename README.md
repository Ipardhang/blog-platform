# Blog Platform

A Node.js and MongoDB blog application with authentication, publishing, comments, and a lightweight browser UI.

## Tech stack

- Node.js
- Express
- MongoDB + Mongoose
- JWT authentication
- bcryptjs
- HTML/CSS/JavaScript frontend

## Features

- User registration and authentication
- Create and manage blog posts
- Post likes
- Comments
- User roles
- Request rate limiting
- Production-safe error responses
- Input size limits and validation

## Run locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure MongoDB

Create a `.env` file with:

```env
MONGO_URI=mongodb://127.0.0.1:27017/blog-platform
JWT_SECRET=replace-with-a-random-secret-of-32-or-more-characters
```

### 3. Start the application

```bash
npm start
```

The server uses port `3000` by default.

### 4. Seed demo data

```bash
npm run seed
```

## API areas

- `/api/auth` — authentication
- `/api/posts` — post management
- `/api/comments` — comments
- Static frontend served from `public/`

## Security notes

In production, keep `JWT_SECRET` outside source control and use a strong random value. The application already applies request limits, disables the Express fingerprint header, limits JSON payload size, and avoids exposing raw server errors in production.

## Project structure

```text
blog-platform/
├── public/        # frontend
├── routes/        # auth, posts, comments
├── models.js      # MongoDB models
├── middleware.js   # shared middleware
├── server.js       # application entry point
└── seed.js         # demo data
```
