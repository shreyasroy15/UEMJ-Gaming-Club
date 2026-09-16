# 🎮 College Gaming Club & Esports Tournament Platform

A production-ready full-stack esports tournament and community portal built for university gaming organizations. Designed with a dark futuristic cyber aesthetic, high visual impact, glassmorphism, responsive tournament elimination brackets, team roster management, and an executive administration suite.

---

## 🌟 Key Features

### 1. **Public & Esports Community Portal**
- **Hero Arena**: Animated cyber grid, statistics counters (500+ players, 25+ tournaments, 12 games, 10+ teams), and call-to-actions.
- **Featured Tournament with Live Countdown**: Real-time JavaScript countdown ticker down to days, hours, minutes, and seconds.
- **Tournament Discovery**: Filter tournaments by status (`all`, `upcoming`, `live`, `completed`) and game title with responsive cards.
- **Visual Tournament Brackets**: Interactive elimination bracket visualizing match progression from Quarter Finals to Finals and Champion.
- **Supported Games Catalog**: Valorant, BGMI, Counter-Strike 2, EA Sports FC 24, Minecraft, Free Fire with format & platform specs.
- **Campus Leaderboard**: Real-time standings sorted by Points, Wins, Losses, and Win-Rate calculation with sortable table headers.
- **Event Scheduling & LAN Nights**: Upcoming campus LAN parties, workshops, and game dev meetups with RSVP capacity tracking.
- **Bulletins & Announcements**: Official tournament rule updates, pinned announcements, and news feeds.
- **Media Gallery**: High-res event photography from LAN parties, tournament stages, and trophy ceremonies.

### 2. **Player & Team System**
- **Player Profiles**: Custom avatar, stats (matches played, wins, win rate, MVP badges), and college department affiliation.
- **Team Management**:
  - Create squads with custom name, tag, and game title.
  - Invite players by username or university email.
  - Remove members or leave team.
  - Transfer captaincy with automatic role updating.
  - Register team for open tournaments with captain validation and slot limits.

### 3. **Executive Admin Management Suite (`/admin`)**
- **Telemetry Dashboard**: High-level metrics for Total Users, Active Teams, Tournaments, Live Matches, Events, and game distribution progress bars.
- **Tournament Manager**: Create tournaments, set prize pools, adjust dates, and auto-generate elimination playoff brackets with 1 click.
- **Match Fixtures & Live Scoring**: Update scores for Team A and Team B in real time, declare winners, set status (`scheduled`, `live`, `completed`), and attach live stream URLs.
- **Team Roster Supervision**: Edit points/wins, view player compositions, and manage inactive teams.
- **Game Directory**: Add or edit supported esports titles and squad sizes.
- **Campus Events**: Create LAN events, workshops, and set maximum seating capacity.
- **News Bulletins**: Publish and pin critical tournament announcements.
- **Media Manager**: Upload photos to the community gallery with category tagging.
- **User Administration**: Promote users to `organizer` or `admin`, or manage accounts.

---

## 🏗️ Project Architecture

```
college-gaming-club/
├── client/                     # Frontend (React 19, Vite, Tailwind CSS v4)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar/         # Responsive navigation & user dropdown
│   │   │   ├── Footer/         # Footer with links & Discord invite
│   │   │   ├── TournamentCard/ # Esports tournament card
│   │   │   ├── GameCard/       # Game showcase card
│   │   │   ├── TeamCard/       # Team roster card
│   │   │   ├── Leaderboard/    # Visual bracket & rankings
│   │   │   ├── Modal/          # Reusable modal
│   │   │   ├── Loading/        # Glowing loading spinner
│   │   │   ├── EmptyState/     # Empty state UI
│   │   │   └── ProtectedRoute/ # Auth & Admin route guards
│   │   ├── context/
│   │   │   ├── AuthContext.jsx # Global JWT session & user role state
│   │   │   └── ToastContext.jsx# Toast notification system
│   │   ├── layouts/
│   │   │   ├── MainLayout.jsx  # Student & public layout
│   │   │   └── AdminLayout.jsx # Admin management layout with sidebar
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Tournaments.jsx
│   │   │   ├── TournamentDetails.jsx
│   │   │   ├── Games.jsx
│   │   │   ├── Teams.jsx
│   │   │   ├── TeamDetails.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── Events.jsx
│   │   │   ├── Gallery.jsx
│   │   │   ├── News.jsx
│   │   │   ├── About.jsx
│   │   │   ├── Contact.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── MyTournaments.jsx
│   │   │   ├── MyTeams.jsx
│   │   │   ├── NotFound.jsx
│   │   │   └── admin/          # Admin Dashboard & CRUD views
│   │   ├── services/
│   │   │   └── api.js          # Centralized Axios with Bearer token interceptor
│   │   ├── App.jsx             # React Router configuration
│   │   ├── index.css           # Tailwind v4, glassmorphism & cyber styling
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── server/                     # Backend (Node.js, Express, MongoDB, Mongoose)
    ├── config/
    │   └── db.js               # Resilient MongoDB connection
    ├── controllers/            # Auth, Tournament, Team, Match, User controllers
    ├── middleware/
    │   ├── authMiddleware.js   # JWT authentication
    │   ├── adminMiddleware.js  # Role verification (admin/organizer)
    │   └── errorMiddleware.js  # Global error handling
    ├── models/                 # User, Team, Tournament, Match, Game, Event, Announcement, Gallery
    ├── routes/                 # Express REST API routes
    ├── utils/
    │   └── seed.js             # Realistic database seeder
    ├── .env                    # Environment variables
    ├── .env.example            # Environment template
    ├── server.js               # Express application entrypoint
    └── package.json
```

---

## ⚡ Tech Stack

| Domain | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router 7, Axios, Lucide React, Framer Motion |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, `cors` |
| **Design System**| Dark Cyberpunk/Esports aesthetic, Neon accents (`cyan #00f0ff`, `violet #9d4edd`), Glassmorphism |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** running locally (`mongodb://localhost:27017`) or a MongoDB Atlas connection string.

---

### 2. Environment Configuration

#### Server (`server/.env`):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/gaming_club
JWT_SECRET=supersecretjwtkey_change_in_production
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

#### Client (`client/.env` - optional):
```env
VITE_API_URL=http://localhost:5000/api
```

---

### 3. Installation & Database Seeding

#### Install Backend Dependencies:
```bash
cd college-gaming-club/server
npm install
```

#### Seed Realistic Sample Data:
Populate 6 games, 6 tournaments, 10 teams, 20 players, 10 matches, 5 events, 10 announcements, and gallery highlights:
```bash
npm run seed
```

#### Install Frontend Dependencies:
```bash
cd ../client
npm install
```

---

### 4. Running the Development Servers

#### Start Backend Server:
```bash
cd college-gaming-club/server
npm run dev
# Server will run on http://localhost:5000
```

#### Start Frontend Client:
```bash
cd college-gaming-club/client
npm run dev
# Client will be available at http://localhost:5173
```

---

## 🔑 Default Accounts (Seed Data)

The seed script provides pre-configured testing accounts:

| Role | Email | Password | Username |
|---|---|---|---|
| **Club Admin** | `admin@uemjgaming.club` | `admin123` | `admin` |
| **Organizer / Captain** | `shreyas@uemjgaming.club` | `password123` | `apex_shreyas` |
| **Student Player** | `rohit@uemjgaming.club` | `password123` | `ghost_rohit` |

> 💡 **Quick Login**: The login page includes quick auto-fill buttons for both the **👑 Admin Account** and **🎯 Student Player** for rapid evaluation.

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Register new student gamer.
- `POST /api/auth/login`: Authenticate and receive JWT token.
- `GET /api/auth/me`: Get current authenticated user profile.
- `POST /api/auth/logout`: Clear session cookie.
- `POST /api/auth/forgot-password`: Generate password reset token.
- `POST /api/auth/reset-password`: Reset password using token.

### Tournaments (`/api/tournaments`)
- `GET /api/tournaments`: Get all tournaments (supports filters: `?game=Valorant&status=live&sort=prize`).
- `GET /api/tournaments/:id`: Get tournament specifications, registered teams, and matches.
- `POST /api/tournaments`: Create tournament *(Staff/Admin)*.
- `PUT /api/tournaments/:id`: Update tournament *(Staff/Admin)*.
- `DELETE /api/tournaments/:id`: Delete tournament *(Admin)*.
- `POST /api/tournaments/:id/register`: Register a squad *(Captain/Admin)*.
- `POST /api/tournaments/:id/generate-bracket`: Auto-generate elimination playoff matches *(Staff/Admin)*.

### Teams (`/api/teams`)
- `GET /api/teams`: List teams (filters: `?game=&search=&sort=points`).
- `GET /api/teams/:id`: Get team details, roster members, captain, and match statistics.
- `POST /api/teams`: Create new team roster.
- `PUT /api/teams/:id`: Update team details or standings *(Captain/Admin)*.
- `DELETE /api/teams/:id`: Disband team *(Captain/Admin)*.
- `POST /api/teams/:id/members`: Invite/add player by username *(Captain/Admin)*.
- `DELETE /api/teams/:id/members/:userId`: Remove member from team *(Captain/Admin)*.
- `POST /api/teams/:id/leave`: Leave team *(Member)*.
- `PUT /api/teams/:id/transfer-captain`: Transfer captaincy *(Captain/Admin)*.

### Matches (`/api/matches`)
- `GET /api/matches`: List match fixtures (filters: `?tournament=&status=`).
- `PUT /api/matches/:id`: Update match score, winner, status, and live stream *(Staff/Admin)*.

### Games, Events, Announcements, Gallery
- `GET/POST/PUT/DELETE` endpoints available under `/api/games`, `/api/events`, `/api/announcements`, and `/api/gallery`.
- `GET /api/dashboard/stats`: Aggregated metrics for total users, teams, live matches, and game distributions *(Staff/Admin)*.

---

## 🛠️ Production Build & Deployment

### Production Build
```bash
cd college-gaming-club/client
npm run build
```
This produces an optimized production bundle in `client/dist`.

### Production Server Run
```bash
cd ../server
NODE_ENV=production npm start
```

---

## 🏆 Summary

The platform is completely functional, responsive across mobile, tablet, and widescreen viewports, and ready for deployment at university esports events.
