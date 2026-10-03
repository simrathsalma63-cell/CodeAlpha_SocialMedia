# CodeAlpha Social Media Platform

A full-stack mini social media platform developed for the CodeAlpha Full Stack Development Internship.

## Features

- User registration and login
- Password hashing with bcrypt
- JWT authentication
- User profiles and bios
- Create, edit and delete posts
- Comments
- Like/unlike posts
- Follow/unfollow users
- Followers/following counts
- Responsive frontend
- MySQL database
- REST API with Express.js

## Technologies

- HTML5
- CSS3
- JavaScript
- Node.js
- Express.js
- MySQL
- JWT
- bcryptjs

## Installation

### 1. Install dependencies

```bash
npm install
```

### 2. Create the database

Open MySQL Workbench and run:

```text
database/schema.sql
```

### 3. Create environment file

Copy `.env.example` to `.env` and enter your MySQL password.

Example:

```env
PORT=3001
JWT_SECRET=my_codealpha_social_secret_2026
DB_HOST=localhost
DB_USER=salma
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=codealpha_social
```

### 4. Start the application

```bash
npm run dev
```

Or:

```bash
npm start
```

Open:

```text
http://localhost:3001
```

## API routes

### Authentication

- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`

### Users

- GET `/api/users/:username`
- PUT `/api/users/profile`
- GET `/api/users/:username/posts`

### Posts

- GET `/api/posts`
- POST `/api/posts`
- PUT `/api/posts/:id`
- DELETE `/api/posts/:id`

### Comments

- GET `/api/comments/post/:postId`
- POST `/api/comments/post/:postId`
- DELETE `/api/comments/:id`

### Likes

- POST `/api/likes/:postId`

### Follows

- POST `/api/follows/:username`
- GET `/api/follows/:username/followers`
- GET `/api/follows/:username/following`

## Security notes

- `.env` is excluded from Git.
- Passwords are stored as bcrypt hashes.
- Protected API routes require a JWT bearer token.
- User-owned posts/comments can only be modified by their owner.

## GitHub

For the CodeAlpha internship, use a repository name following:

`CodeAlpha_ProjectName`

Suggested repository:

`CodeAlpha_SocialMedia`
