# CampusHub 🏫

> Hyperlocal student services platform — order food, rides, notes, prints and more within your campus.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, Tailwind CSS, ShadCN, Framer Motion |
| State | Zustand (persist) |
| Auth | JWT + bcryptjs |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose (geospatial indexes) |
| Real-time | Socket.io |
| Notifications | Firebase Cloud Messaging |

---

## Getting Started

### 1. Clone & install

```bash
# Install all dependencies
npm run install:all
```

### 2. Configure environment

**Backend** — copy and fill in `backend/.env.example` → `backend/.env`

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/campushub
JWT_SECRET=your_super_secret_key
ALLOWED_EMAIL_DOMAINS=university.edu
CLIENT_URL=http://localhost:3000
```

**Frontend** — copy and fill in `frontend/.env.local.example` → `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### 3. Run

```bash
# Terminal 1 — Backend
npm run dev:backend

# Terminal 2 — Frontend
npm run dev:frontend
```

Open **http://localhost:3000**

---

## Project Structure

```
campuse-service/
├── backend/
│   ├── server.js
│   └── src/
│       ├── config/db.js
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── socket/
└── frontend/
    └── src/
        ├── app/
        │   ├── (auth)/login
        │   ├── (auth)/register
        │   └── (dashboard)/
        │       ├── feed
        │       ├── create
        │       ├── my-orders
        │       ├── orders/[id]
        │       ├── profile
        │       ├── wallet
        │       ├── notifications
        │       ├── provider
        │       └── admin
        ├── components/
        │   ├── layout/Sidebar.tsx
        │   └── orders/
        │       ├── RequestCard.tsx
        │       ├── FilterBar.tsx
        │       ├── OrderTimeline.tsx
        │       ├── BidCard.tsx
        │       ├── BidForm.tsx
        │       ├── ChatPanel.tsx
        │       └── StatusActions.tsx
        ├── hooks/
        ├── lib/
        ├── store/
        └── types/
```
