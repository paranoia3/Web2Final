# Wordle Final Project (Node.js + Express + MongoDB)

A Wordle-like word guessing game with:
- **JWT authentication**
- **MongoDB** (Users + Game Sessions)
- **Modular Express structure** (routes / controllers / models / middleware / config)
- **Validation & global error handling**
- **RBAC** roles (admin, moderator, premium, user)
- **Email notifications** using Nodemailer + SMTP provider (SendGrid/Mailgun/Postmark recommended)
- A simple **web UI** served from `/public` (so you have screenshots/features for the report)
---

## 1) Project Overview

Players register/login, then create a new game session (random or daily) and submit guesses.
The server evaluates guesses with the Wordle algorithm and returns tile results:
- `correct` (green)
- `present` (yellow)
- `absent` (gray)
---

## 2) Folder Structure

```
wordle-final-project/
  server.js
  package.json
  .env.example
  src/
    config/
    controllers/
    data/
    middleware/
    models/
    routes/
    utils/
    validation/
  public/
    index.html
    app.js
    styles.css
  docs/
    screenshots/
  postman_collection.json
```

---

## 3) Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs (password hashing)
- Joi (validation)
- Nodemailer (SMTP email)
- Helmet, CORS, Rate limiting

---

## 4) Setup Instructions (Local)

### Requirements
- Node.js 18+
- MongoDB running locally OR MongoDB Atlas connection string

### Steps
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Update `MONGODB_URI` and `JWT_SECRET` in `.env`.

4. Start the server:
   ```bash
   npm run dev
   ```
   Open: http://localhost:3000

---

## 5) API Documentation

Base URL (local): `http://localhost:3000`

### Auth (Public)
- `POST /api/auth/register`
- `POST /api/auth/login`

Aliases (to match the assignment exactly):
- `POST /register`
- `POST /login`

#### Register
`POST /api/auth/register`
```json
{
  "username": "zaki",
  "email": "zaki@example.com",
  "password": "strongpassword"
}
```

#### Login
`POST /api/auth/login`
```json
{
  "email": "zaki@example.com",
  "password": "strongpassword"
}
```

---

### User (Private)
Headers:
```
Authorization: Bearer <JWT_TOKEN>
```

- `GET /api/users/profile`
- `PUT /api/users/profile`

Alias:
- `GET /users/profile`
- `PUT /users/profile`

#### Update profile
`PUT /api/users/profile`
```json
{
  "username": "newname",
  "email": "new@example.com",
  "password": "newstrongpassword"
}
```

---

### Resource (Private) = Game Sessions
Endpoints:
- `POST /api/games`  (Create new game session)
- `GET /api/games`   (List your sessions)
- `GET /api/games/:id` (Get a session)
- `PUT /api/games/:id` (Submit a guess)
- `DELETE /api/games/:id` (Delete a session)

Alias to match assignment:
- `/api/resource` maps to `/api/games`
- `/resource` maps to `/games`

#### Create game
`POST /api/games`
```json
{ "mode": "random" }
```

#### Submit guess
`PUT /api/games/:id`
```json
{ "guess": "about" }
```

Response includes guess results:
```json
{
  "game": {
    "guesses": [
      { "word": "about", "result": ["absent","present","absent","absent","correct"] }
    ],
    "status": "active"
  }
}
```

---

## 6) Advanced Features

### RBAC
Roles:
- `user` (default)
- `premium`
- `moderator`
- `admin`

Admin routes:
- `GET /api/users` (admin/moderator)
- `PUT /api/users/:id/role` (admin only)

### Email (SMTP)
On registration and profile update, an email is sent (if SMTP is configured).
When a game ends, a notification email is sent to **premium/admin** users to demonstrate RBAC.

---

## 7) Screenshots (For Report)

Put screenshots inside:
- `docs/screenshots/`

The project already includes **placeholder** images you can replace.

Recommended screenshots:
1. Login screen
2. Register screen
3. Game board with guesses
4. Postman / API test (register, login, create game, guess)

---

## 8) Deployment (Render / Railway / Replit)

### Environment variables required
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (optional)
- `CLIENT_ORIGIN` (optional)
- SMTP variables (optional)

### Render example
- Build command: `npm install`
- Start command: `npm start`
- Node version: 18+

---

## 9) Postman

Import `postman_collection.json` into Postman to test endpoints quickly.

---

## 10) Notes for Defense
Be ready to explain:
- JWT flow (register/login -> token -> protected routes)
- Password hashing with bcrypt
- How Wordle evaluation works (correct/present/absent, duplicates)
- MongoDB schemas and relationships (User -> GameSession)
- RBAC concept and where you used it
- Validation + global error handler and HTTP codes

Good luck! 
