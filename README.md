# TaskPad 📝

A simple task manager I built for the **"TaskFlow – 1-Week Complete Project"** assignment.
You sign in with Google, then you can create, edit, delete and organize your own tasks.

🔗 **Live demo:** [https://tasks-pad.vercel.app](https://tasks-pad.vercel.app/)

---

## What it does

- Sign in with your **Google account** (no passwords to remember)
- **Create, view, edit and delete** tasks
- Each task has a **title, description, status, priority, due date** and an optional **image**
- Filter tasks by status (To do / In progress / Done), **search**, and **sort** by date or priority
- Each task has its own **details page** (`/tasks/[id]`)
- **Sidebar** with your Google avatar, task counts and a progress bar
- **Dark mode** by default, with a light mode toggle
- Works on **phone, tablet and desktop**

You only ever see **your own tasks**. Other users can't read or change them.

---

## Tech stack (my choices)

The assignment let each student pick one option per category. These are mine:

| Category | What I used |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Authentication | **NextAuth.js + Google OAuth** |
| Database / ORM | **Prisma + MongoDB (Atlas)** |
| Advanced feature | **File uploads for task attachments (Cloudinary)** |
| Deployment | Vercel |

---

## Assignment checklist ✅

**Day 1 – Setup + Auth**
- [x] Next.js with App Router
- [x] Tailwind CSS
- [x] Login page + dashboard
- [x] NextAuth.js with Google

**Day 2 – Database**
- [x] `User` model
- [x] `Task` model (title, description, status, userId)
- [x] Relationship: one user has many tasks (tasks get deleted if the user is deleted)

**Day 3 – API + CRUD**
- [x] `/api/auth/*` → login, register and logout (handled by NextAuth)
- [x] `/api/tasks` → `GET`, `POST`
- [x] `/api/tasks/[id]` → `GET`, `PUT`, `DELETE`
- [x] Task creation form, task list, editing and deleting

**Day 4 – Integration + Advanced feature**
- [x] Protected API routes (you get `401 Unauthorized` if you're not logged in)
- [x] User-specific tasks
- [x] Authentication middleware (`proxy.ts`)
- [x] Advanced feature: **image attachments with Cloudinary**

**Day 5 – Polish + Deploy**
- [x] Error handling (error messages, toasts, error page, 404 page)
- [x] Loading states (skeletons, spinners, disabled buttons)
- [x] Responsive design
- [x] Form validation (on both the browser **and** the server)
- [x] Deployed to Vercel with environment variables

**Extra things I added**
- Priority (Low / Medium / High) and due dates, with an "overdue" warning
- Task details page
- Search and sorting
- Dark / light mode

---

## How login / register works

With Google login, **"register" and "login" are the same thing**:

- The **first time** you sign in, NextAuth creates a new `User` in the database automatically.
- The next times, it just logs you in.
- Logout deletes your session.

NextAuth gives us these routes for free:

| Route | What it does |
|---|---|
| `/api/auth/signin/google` | Start Google login |
| `/api/auth/callback/google` | Google sends the user back here |
| `/api/auth/signout` | Logout |
| `/api/auth/session` | Get the current user |

---

## API routes

All task routes need you to be logged in, and they only return **your** tasks.

| Method | Route | What it does |
|---|---|---|
| `GET` | `/api/tasks` | Get all my tasks (optional: `?status=TODO`) |
| `POST` | `/api/tasks` | Create a task |
| `GET` | `/api/tasks/[id]` | Get one task |
| `PUT` | `/api/tasks/[id]` | Update a task (you can send only the fields you want to change) |
| `DELETE` | `/api/tasks/[id]` | Delete a task (also deletes its image from Cloudinary) |
| `POST` | `/api/upload` | Upload an image (JPG, PNG, WebP or GIF, max 5 MB) |

Example body for creating a task:

```json
{
  "title": "Finish the README",
  "description": "Write about the stack and the API",
  "status": "TODO",
  "priority": "HIGH",
  "dueDate": "2026-09-25"
}
```

If something is wrong, the API answers with a

```json
{ "error": "Validation failed", "errors": { "title": "Title must be at least 3 characters" } }
```

---

## Database models

```prisma
model User {
  id    String  @id @default(auto()) @map("_id") @db.ObjectId
  name  String?
  email String? @unique
  image String?
  tasks Task[]          // one user → many tasks
  // + accounts & sessions (needed by NextAuth)
}

model Task {
  id            String     @id @default(auto()) @map("_id") @db.ObjectId
  title         String
  description   String?
  status        TaskStatus @default(TODO)      // TODO | IN_PROGRESS | DONE
  priority      Priority   @default(MEDIUM)    // LOW | MEDIUM | HIGH
  dueDate       DateTime?
  imageUrl      String?
  imagePublicId String?
  userId        String     @db.ObjectId
  user          User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}
```

The full schema is in [`prisma/schema.prisma`](prisma/schema.prisma).

---

## How the app is protected

I protect things in **two layers**:

1. **`proxy.ts` (middleware):** runs before every request. If you don't have a session cookie:
   - pages → redirect you to `/login` (and bring you back after you log in)
   - API routes → answer `401 Unauthorized`
2. **Inside each page and API route:** the session is checked again against the database.
   This matters because the proxy only checks that the cookie *exists*. A fake or expired cookie
   passes the proxy, but it gets rejected here.

---



## Run it on your computer

### 1. Install

```bash
git clone https://github.com/zakiyah99/task-pad
cd task-pad
npm install
```

### 2. Create a `.env` file

```env
DATABASE_URL="mongodb+srv://USER:PASSWORD@cluster.mongodb.net/taskpad"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="any-long-random-string"

GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

Where to get them:
- **MongoDB:** create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas) → "Connect" → copy the connection string.
- **Google:** [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → create an **OAuth client ID** (Web application).
  Add this **Authorized redirect URI**: `http://localhost:3000/api/auth/callback/google`
- **Cloudinary:** sign up at [cloudinary.com](https://cloudinary.com/); the keys are on the dashboard.
- **NEXTAUTH_SECRET:** you can generate one with `npx auth secret` or `openssl rand -base64 32`.


### 3. Set up the database

```bash
npx prisma db push
```

(MongoDB doesn't use migrations, so we use `db push` instead of `migrate`.)

### 4. Start

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## Deploying to Vercel

1. Push the code to GitHub.
2. Import the repo on [vercel.com](https://vercel.com).
3. Add **all the variables from `.env`** in *Project → Settings → Environment Variables*.
   Change `NEXTAUTH_URL` to your Vercel URL (for me: `https://tasks-pad.vercel.app`).
4. In Google Cloud Console, add the production redirect URI:
   `https://tasks-pad.vercel.app/api/auth/callback/google`
5. In MongoDB Atlas → Network Access, allow Vercel to connect (e.g. `0.0.0.0/0`).
6. Deploy!