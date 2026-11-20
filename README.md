# MessHunt — Student Mess & Accommodation Discovery (Web Application)

MessHunt is a BCA final-year web project built with **HTML, CSS, Vanilla JavaScript, Node.js, Express.js, MongoDB, and Mongoose**. It provides three connected portals (Student, Owner, Admin) using one backend and one MongoDB database.

## Key points
- **Web-only project** (no React/React Native/Expo/mobile app).
- Reuses the **existing MongoDB connection/configuration** from `backend/.env` (`MONGO_URI`, `PORT`). No duplicate DB/cluster/connection created.
- Target database: **`test`** (as per existing Atlas configuration). Existing collection preserved: **`users`** (extended additively).
- **Excluded features removed:** membership/subscription plans, Razorpay/payment integration, AI recommendations/chat/matching.
- Booking requests work **without online payment**.

## Project structure
```text
Mess_Hunt/
├─ index.html                  # Landing + discovery (DB-backed)
├─ details.html                # Mess details, reviews, favourite, booking
├─ login.html                  # Login (student/owner/admin)
├─ register.html               # Registration (student/owner)
├─ student-dashboard.html      # Student profile, favourites, bookings
├─ owner-dashboard.html        # Owner listings, bookings, reviews
├─ admin-dashboard.html        # Admin stats, users, listings, reports, reviews
├─ script.js                   # Landing/discovery frontend logic
├─ details.js                  # Details page frontend logic
├─ style.css                   # Main responsive styles
├─ details.css                 # Details page supplementary styles
├─ js/
│  ├─ api.js                   # API base, token/session helpers, fetch wrapper
│  └─ common.js                # Shared UI/auth helpers
├─ backend/
│  ├─ .env                     # Existing environment config (MONGO_URI, PORT, etc.) - do not commit
│  ├─ server.js                # Express app bootstrap, routes, static serving
│  ├─ seed.js                  # Optional demo seed (additive, no deletions)
│  ├─ config/db.js             # Single Mongoose connection (reuses existing env)
│  ├─ middleware/
│  │  ├─ auth.js               # JWT protect/optionalAuth
│  │  ├─ role.js               # Role-based authorization
│  │  └─ errorHandler.js       # 404/error handling
│  ├─ models/
│  │  ├─ user.js               # User (student/owner/admin), legacy fields preserved
│  │  ├─ Mess.js               # Mess listing
│  │  ├─ Review.js             # Reviews & ratings
│  │  ├─ Favourite.js          # Student favourites
│  │  ├─ Booking.js            # Booking requests
│  │  └─ Report.js             # Reports/moderation
│  ├─ controllers/             # Business logic per module
│  ├─ routes/                  # API route definitions
│  └─ utils/                   # async handler, JWT helpers
├─ package.json                # Root manifest (legacy deps present)
└─ backend/package.json        # Backend manifest
```

## Technology stack
| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB (Atlas/existing), Mongoose ODM |
| Auth | JWT (`Authorization: Bearer <token>`), bcryptjs password hashing |
| Security | Role-based access control, route protection, input checks, safe password migration |

## Environment configuration
Configured in `backend/.env` (existing, preserved):
- `MONGO_URI` — existing MongoDB connection string (**do not change**)
- `PORT` — backend port (default `5000`)

Optional (not required, can be set in environment without editing committed files):
- `JWT_SECRET` — JWT signing secret (code falls back to a dev default if unset; set in production)
- `JWT_EXPIRES_IN` — token expiry (default `7d`)
- `ADMIN_SETUP_KEY` — enables one-time admin registration when provided with request (secure bootstrap)

> Never expose or commit credentials/secrets.

## Installation & running
### Prerequisites
- Node.js (v18+ recommended)
- Access to the configured MongoDB database (Atlas/network access as per existing setup)
- Dependencies: `backend/node_modules` and/or root `node_modules` exist in this workspace. If missing, run `npm install` in `backend/` (and root if needed) to restore from lockfiles.

### Start backend
```bash
cd backend
npm start
# or: node server.js
```
- Server: `http://localhost:PORT` (default `http://localhost:5000`)
- API base: `http://localhost:5000/api`
- Health check: `GET /api/health`
- Frontend static files are also served by the backend for convenience.

### Open frontend
- Recommended: open `http://localhost:5000/index.html` (or `http://localhost:5000/`) while backend is running.
- Alternative: serve frontend via Live Server (VS Code setting uses port 5501) — frontend API helper targets `http://localhost:5000` when not running on port 5000.

### Optional demo seed
```bash
cd backend
node seed.js
```
- Additive only: inserts sample **approved** listings only if `messes` collection is empty.
- Requires an existing owner account; does not delete/modify existing records.

## User roles & portals
### Student
- Register/login/logout, profile view/edit, change password
- Browse/search/filter/sort/paginate approved listings
- View mess details (images, facilities, rules, price, contact, map/location)
- Add/remove favourites (DB-backed)
- Submit/edit/delete own reviews and ratings; report reviews/listings
- Send booking requests (no payment) and view/cancel from dashboard

### Mess Owner
- Register/login, owner dashboard stats
- Create/edit/delete own listings (pending/approval workflow), manage details/images/facilities/availability/contact
- View booking requests and accept/reject/update status with notes
- View reviews on own listings

### Admin
- Secure login (no public registration). Bootstrap: register with `role=admin` only when `ADMIN_SETUP_KEY` is configured and provided.
- Dashboard statistics (DB-derived)
- Manage users: view students/owners, activate/deactivate accounts, verify owners
- Manage listings: view all, approve/reject/suspend with reasons
- Manage reports and moderate reviews (hide/delete/resolve)

## Core API overview
- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- **Users/Profile:** `GET/PUT /api/users/profile`, `PUT /api/users/change-password`
- **Messes (public):** `GET /api/messes`, `GET /api/messes/featured`, `GET /api/messes/recent`, `GET /api/messes/:id`
- **Messes (owner):** `POST /api/messes`, `GET /api/messes/owner/mine`, `PUT /api/messes/:id`, `DELETE /api/messes/:id`
- **Reviews:** `GET /api/messes/:messId/reviews`, `POST /api/messes/:messId/reviews`, `PUT /api/reviews/:id`, `DELETE /api/reviews/:id`
- **Favourites (student):** `GET /api/favourites/mine`, `POST/DELETE /api/messes/:messId/favourite`, `POST /api/messes/:messId/favourite/toggle`
- **Bookings:** `POST /api/messes/:messId/bookings`, `GET /api/bookings/mine`, `PATCH /api/bookings/:id/status`
- **Owner:** `GET /api/owner/dashboard`, `GET /api/owner/reviews`
- **Reports:** `POST /api/reports`, `GET /api/reports/mine`
- **Admin:** `GET /api/admin/dashboard`, `GET/PATCH /api/admin/users`, `GET /api/admin/messes`, `PATCH /api/admin/messes/:id/approval`, `GET/PATCH /api/admin/reports`, `GET /api/admin/reviews`, `PATCH /api/admin/reviews/:id/moderate`

## Security notes
- Passwords hashed with **bcryptjs**; legacy plain-text passwords (if present in existing records) are supported on login and upgraded to bcrypt on successful authentication (non-destructive, no lockout intent).
- JWT-based authentication and role-based authorization enforced on protected backend routes.
- Users can modify only permitted resources (own profile/reviews/bookings; owners manage own listings; admin-only moderation/management).
- Basic validation and centralized error handling implemented.
- Do not store trusted authorization decisions in localStorage; frontend stores JWT/user session data for client use only.

## Data & migration notes
- Uses existing `users` collection/model (additive fields: `role`, `phone`, `address`, `bio`, `profileImage`, `isActive`, `ownerVerified`; legacy subscription fields preserved).
- New collections/models added as needed in same database: `messes`, `reviews`, `favourites`, `bookings`, `reports`.
- Important data intended to be stored in MongoDB via backend APIs (not localStorage as primary DB).
- No database reset/drop/overwrite of existing records performed.

## Testing summary (executed)
Automated/manual API workflow tests were executed against the configured **`test`** database (connection verified at runtime) using temporary test accounts/data:
- **PASS:** Health check, student/owner registration, login, JWT-protected profile read/update, password change.
- **PASS:** Owner listing creation (pending), owner "my listings", admin listing approval, public listing list/search/detail (approved).
- **PASS:** Student favourite toggle/list, review create/list, booking request create/list.
- **PASS:** Owner booking list and status update (accept), admin dashboard stats (DB-derived).
- **Cleanup:** All temporary test users/listings/reviews/bookings/favourites created during verification were deleted; existing pre-test data was not modified.

Frontend pages and dashboards were implemented to consume these APIs; full browser UI walkthrough depends on a running backend with DB connectivity and available listing/user data.

## Known limitations
- **MongoDB connectivity is environment-dependent:** API/DB features require access to the configured Atlas URI in `backend/.env`. During earlier phases connectivity was unavailable; later runtime verification succeeded in this environment.
- **Admin bootstrap:** No public admin registration. Create an admin by setting `ADMIN_SETUP_KEY` in the environment and registering with the key, or via a controlled DB/admin process.
- **Image handling:** Listing images are managed as URL/path strings (no file-upload storage pipeline/multer integration) to keep dependencies simple.
- **Existing image assets:** Some legacy image paths may be missing; UI includes fallbacks.
- **No automated test suite/framework:** Verification performed via runtime API checks and static syntax checks.
- **Public listing data:** Discovery shows approved & available listings; if no approved listings exist, pages show empty states until owners/admin add/approve data (optional `seed.js` can help).

## Important implementation notes for viva
- **Single backend, single DB:** all portals call the same Express API and same MongoDB database/connection.
- **RBAC:** students/owners/admins have different permissions enforced in middleware and controllers.
- **Approval workflow:** owner-created listings start pending; admin approves/rejects/suspends before public visibility (per rules).
- **Reviews:** one review per user per mess (unique index), ownership enforced for edit/delete, ratings aggregated on mess.
- **Favourites/Bookings/Reports:** persisted in MongoDB and scoped to authenticated users/permissions.

## Excluded functionality (intentionally removed)
- Membership/subscription plans, badges, expiry, renewal, gating
- Razorpay/payment checkout, orders, verification, transactions
- AI chatbot/recommendations/matching or external AI services

These were removed from the user experience and backend API flow; booking works without payment.
