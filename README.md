# MessHunt — Student Mess & Accommodation Discovery (Web Application)

MessHunt is a full-stack BCA final-year web application built with **HTML5, CSS3, Vanilla JavaScript, Node.js, Express.js, MongoDB, and Mongoose**. It provides three integrated portals (**Student**, **Mess Owner**, and **Admin**) connecting students with verified mess and hostel accommodations across **West Medinipur** (Midnapore and Kharagpur).

---

## Key Highlights

- **Two Frontends, One Backend:** A Vanilla HTML/CSS/JS frontend (served by Express on `http://localhost:5000`) and a React + Vite frontend in `frontend/` (`http://localhost:5173`, proxies `/api` and `/uploads` to port 5000). Both use the same Express API and MongoDB database (`messhunt`).
- **20 Real Listings with Real Photos:** 20 accommodations across Midnapore and Kharagpur with rent, room, food, facilities, rules, accurate coordinates, and 19 real mess/room photos stored in `uploads/messes/`. Listings without a public photo show the MessHunt emblem fallback (no fake photos).
- **Auto-Seeding:** All 20 listings (with photo paths, owner details and coordinates) are saved in `backend/data/messes_seed.json`. If the database is empty, `backend/config/db.js` loads them automatically on server start (or run `node seed.js`).
- **Mess-Name Search:** The hero search matches only the mess name — case-insensitive and punctuation-tolerant (e.g. `puspak`, `TM MESS`, `kharagpur pg`) — with no dropdown. Location, type, budget, food and facility filters are separate.
- **Real Owner & Contact Information:** Every listing shows owner name, phone, WhatsApp and email with clickable **Call**, **WhatsApp** and **Email** buttons. Only publicly verified numbers/emails are stored; otherwise it shows "Not publicly listed on Google Maps". No fake contact data.
- **Interactive Map Integration:** OpenStreetMap map on each listing with verified coordinates, plus an "Open Exact Place in Google Maps" link. New listings without coordinates get them inferred automatically from their area/city.
- **Photo Uploads for Owners:** Owners upload photos from the dashboard (`POST /api/uploads/images` or `/api/owner/upload-image`, multipart or base64). Files are saved in `uploads/messes/`.
- **Role-Based Access Control (RBAC):** JWT authentication (`Authorization: Bearer <token>`) with bcrypt password hashing protecting Student, Owner, and Admin routes.
- **Clean Student Workflow:** Students can browse, filter, save favourites, submit reviews, and send visit/booking requests without mandatory online payment gates.

---

## Project Structure

```text
MessHunt_Web/
├── index.html                  # Landing page & public mess discovery with map
├── details.html                # Detailed listing page, photo gallery, reviews, booking
├── login.html                  # Unified login portal (Student, Owner, Admin)
├── register.html               # Account registration (Student, Owner)
├── student-dashboard.html      # Student portal: profile, favourites, booking requests
├── owner-dashboard.html        # Owner portal: listing management, booking requests, reviews
├── admin-dashboard.html        # Admin portal: platform stats, users, listings, reports
├── script.js                   # Landing page logic, search/filters, map rendering
├── details.js                  # Details page logic, reviews, favourites, booking form
├── style.css                   # Responsive styles, design system, theme tokens
├── details.css                 # Details page supplementary layout styles
├── favicon.svg                 # Brand favicon mark for browser tab
├── assets/
│   ├── logo.svg                # Vector brand logo (header & footer)
│   ├── logo-emblem.png         # Transparent emblem mark (graduation cap + house + pin)
│   ├── logo.png                # High-resolution standalone brand image
│   └── logo-placeholder.svg    # Fallback logo asset
├── js/
│   ├── api.js                  # Frontend API client, JWT token storage, fetch wrapper
│   ├── common.js               # Shared UI helpers (navbar auth state, alerts, toasts)
│   └── locations.js            # West Medinipur location data & autocomplete engine
├── frontend/                   # React + Vite frontend (pages: Home, Details, Owner/Student/Admin dashboards)
├── uploads/messes/             # Real mess & room photos (served at /uploads/messes/...)
├── scratch/enrich_listings.js  # Script that applies verified details/contacts/coordinates to the 20 listings
└── backend/
    ├── .env                    # Environment configuration (PORT, MONGO_URI, JWT_SECRET) - not committed
    ├── .env.example            # Sample environment configuration template
    ├── server.js               # Express application entry point & static file server
    ├── seed.js                 # Loads the 20 listings from data/messes_seed.json into an empty DB
    ├── data/messes_seed.json   # The 20 verified listings (details, contacts, photos, coordinates)
    ├── config/
    │   └── db.js               # Mongoose database connection configuration
    ├── middleware/
    │   ├── auth.js             # JWT protect & optionalAuth middleware
    │   ├── role.js             # Role-based authorization middleware
    │   └── errorHandler.js     # Global error & 404 handling middleware
    ├── models/
    │   ├── user.js             # User schema (Student, Owner, Admin)
    │   ├── Mess.js             # Mess listing schema with location & amenities
    │   ├── Review.js           # Reviews & ratings schema
    │   ├── Favourite.js        # Student saved favourites schema
    │   ├── Booking.js          # Booking/visit request schema
    │   └── Report.js           # Moderation & issue reports schema
    ├── controllers/            # Business logic controllers per module
    ├── routes/                 # Express API routes
    ├── utils/                  # Async error wrappers and JWT helper utilities
    └── package.json            # Backend dependencies and startup scripts
```

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) | User interface, DOM manipulation, client-side routing |
| **Mapping** | Leaflet.js, OpenStreetMap | Interactive map view, coordinates markers, popup cards |
| **Backend** | Node.js, Express.js | REST API, static asset serving, session validation |
| **Database** | MongoDB, Mongoose ODM | Document database, schemas, aggregation pipelines |
| **Authentication**| JSON Web Tokens (JWT), bcryptjs | Secure stateless auth, password hashing |
| **Styling** | Custom CSS (Responsive Flexbox/Grid) | Optimized for Desktop, Tablet, and Mobile devices |

---

## Environment Configuration

The backend reads configuration from `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/messhunt
JWT_SECRET=messhunt_dev_secret_key_2026
JWT_EXPIRES_IN=7d
```

*(If using MongoDB Atlas in the cloud, replace `MONGO_URI` with your Atlas connection string).*

---

## Quick Start & Installation

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB** (Local MongoDB Community Server running on port `27017`, or MongoDB Atlas)

### 2. Install Dependencies
`backend/.env` is not committed to GitHub. Create it first by copying `backend/.env.example` and setting `MONGO_URI` (see Environment Configuration below).
```bash
cd MessHunt_Web/backend
npm install

# Optional: React frontend
cd ../frontend
npm install
npm run dev   # http://localhost:5173
```

### 3. Start the Server
```bash
cd MessHunt_Web/backend
npm start
# or: node server.js
```

On first start with an empty database, the 20 listings are loaded automatically from `backend/data/messes_seed.json`. User accounts, bookings, reviews and favourites are **not** included — register new student/owner accounts to try the dashboards.

The Express server will start at:
```text
MongoDB connected successfully (database: messhunt)
MessHunt server running on http://localhost:5000
```

### 4. Access the Application
Open your browser and navigate to:
- **Home / Mess Discovery:** [http://localhost:5000/index.html](http://localhost:5000/index.html) (or [http://localhost:5000](http://localhost:5000))
- **Login Portal:** [http://localhost:5000/login.html](http://localhost:5000/login.html)
- **Registration Portal:** [http://localhost:5000/register.html](http://localhost:5000/register.html)
- **Health Check API:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## Demo Accounts for Testing & Viva

| Portal | Email | Password | Role | Access / Capabilities |
|---|---|---|---|---|
| **Student** | `student@messhunt.com` | `student123` | `student` | Profile, favourites, reviews, booking visit requests |
| **Owner** | `owner@messhunt.com` | `owner123` | `owner` | Create & edit listings, manage bookings, review tracking |
| **Admin** | `admin@messhunt.com` | `admin123` | `admin` | Full moderation, approve/reject listings, verify owners, stats |

*(Personal test accounts `maityankana913@gmail.com` and `maityankana@gmail.com` are also registered and active in the database).*

---

## Listings Overview (20 Preloaded Accommodations)

The system includes 20 live, approved listings across Paschim Medinipur with complete location coordinates, rental rates, room configurations, and food options:

### Midnapore (12 Listings)
1. **Silver Spring Boys Mess** — Rangamati (₹3,200/mo, Double, Veg + Non-Veg)
2. **Debi Sarbajaya Mess** — Boxibazar (₹2,800/mo, Triple, Veg)
3. **Manjusri Chatrinivas** — Ramayan Para, Tantigeria (₹3,800/mo, Double, Girls Hostel)
4. **Chakadola Ladies Mess** — V.U. Gate No. 3, Tantigeria (₹3,500/mo, Double, Girls Mess)
5. **Bhadra Mess Bari** — Mahatabpur (₹2,600/mo, Double, Boys Mess)
6. **Puspak Mess** — Raja Bazar (₹2,900/mo, Triple, Student Mess)
7. **Sahachari Chhatri Nibas** — Ashok Nagar Road (₹3,600/mo, Double, Girls Hostel)
8. **Kanak Mess Cum Paying Guest** — Saratpally (₹3,000/mo, Double, PG)
9. **Johim Mess** — Midnapore Town (₹2,500/mo, Multi-sharing, Boys Hostel)
10. **Peace Avenue Girls Mess** — Baisakhipally, V.U. Road (₹3,900/mo, Double, Girls Mess)
11. **Aurobinda Mess** — Midnapore Town (₹2,700/mo, Double, Boys Mess)
12. **Shantiniketan Mess** — Midnapore Town (₹2,800/mo, Triple, Student Mess)

### Kharagpur (8 Listings)
13. **Bharat PG** — Puratan Bazar (₹4,500/mo, Single, Boys PG near IIT & Station)
14. **AFS Apartment** — Puratan Bazar (₹4,200/mo, Double, PG with kitchen access)
15. **Tapas P.G.** — Rabindrapally, IIT Bypass (₹3,800/mo, Double, Non-veg PG)
16. **Kharagpur P.G.** — Inda / Ramkrishnapally (₹3,600/mo, Double, Boys PG)
17. **Premium Boys AC PG** — Regent Saras Residency 2, Inda (₹5,200/mo, Single AC)
18. **Sujay Kr Sharma PG Hostel** — Rabindrapally (₹3,400/mo, Double, Boys PG)
19. **TM - MESS** — Subhaspally (₹3,100/mo, Triple, Student Mess)
20. **Uttaran Mess** — Vidyasagarpur, Panchberia Road (₹3,000/mo, Double)

---

## User Roles & Capabilities

### 1. Student Portal (`student-dashboard.html`)
- Search by location, accommodation type (Boys/Girls/Unisex), rent budget, food preferences, and facilities.
- View interactive maps and inspect distances to nearby landmarks (colleges, bus stops, railway stations).
- Save and remove listings to personal **Favourites**.
- Submit ratings and reviews (one review per user per listing).
- Send booking/visit requests specifying preferred date and time slot (no payment required).
- Manage personal profile and update password securely.

### 2. Mess Owner Portal (`owner-dashboard.html`)
- Dashboard overview showing total listings, approved, pending, and booking request counts.
- Create new mess listings with full details (owner name, phone, WhatsApp, email, room sharing, furnishing, bathroom type, food, utilities, coordinates, rules). Coordinates and Google Maps link are inferred if left blank.
- Edit or delete listings; upload and remove photos (**Mess & Room Photos**, `📷 Upload Photos`).
- Receive student booking requests with student contact information and visit dates.
- Accept, reject, or mark booking requests as pending with custom notes.
- View and delete student reviews; ratings and review counts are recalculated live.
- Separate login tokens per role (`mh_token_owner`, `mh_token_student`, `mh_token_admin`) so owner and student can be open in different tabs.

### 3. Admin Portal (`admin-dashboard.html`)
- System-wide statistics: registered students, mess owners, active listings, and open moderation reports.
- **User Management:** Filter users by role (`student`, `owner`, `admin`), search by name/email/phone, activate/deactivate accounts, and verify owners.
- **Listing Moderation:** Review pending listings, approve verified accommodations, or reject/suspend with reason notes.
- **Review Moderation:** Hide, unhide, or delete inappropriate reviews with automatic recalculation of mess ratings.
- **Report Handling:** Review user-submitted reports on listings or reviews and mark as resolved or dismissed.

---

## Core API Endpoints

### Authentication & Users
- `POST /api/auth/register` — Register student or owner account
- `POST /api/auth/login` — Login user and issue JWT
- `GET /api/auth/me` — Get current logged-in user session
- `GET /api/users/profile` — Get profile details
- `PUT /api/users/profile` — Update user profile
- `PUT /api/users/change-password` — Change password

### Mess Listings
- `GET /api/messes` — Search & filter approved listings (`search` = mess name only, case-insensitive; also location, accommodationType, minPrice, maxPrice, foodPreference, nearby, facilities, pagination)
- `POST /api/uploads/images` — Upload mess photos (Owner/Admin; multipart or base64)
- `GET /api/owner/bookings`, `GET /api/owner/reviews` — Owner booking requests and reviews
- `GET /api/messes/:id` — Get mess details by ID
- `POST /api/messes` — Create new listing (Owner only, starts as pending)
- `GET /api/messes/owner/mine` — Get owner's listings
- `PUT /api/messes/:id` — Update listing (Owner only)
- `DELETE /api/messes/:id` — Delete listing (Owner or Admin)

### Reviews & Favourites
- `GET /api/messes/:messId/reviews` — Get public reviews for a mess
- `POST /api/messes/:messId/reviews` — Submit review & rating (Student only)
- `PUT /api/reviews/:id` — Update own review
- `DELETE /api/reviews/:id` — Delete own review
- `GET /api/favourites/mine` — Get student favourites
- `POST /api/messes/:messId/favourite/toggle` — Toggle save to favourites

### Bookings & Reports
- `POST /api/messes/:messId/bookings` — Submit visit request (Student only)
- `GET /api/bookings/mine` — Get bookings (scoped to Student or Owner)
- `PATCH /api/bookings/:id/status` — Update booking status (accept/reject/cancel)
- `POST /api/reports` — Submit report for admin review

### Admin Endpoints (Admin role required)
- `GET /api/admin/dashboard` — Platform overview statistics
- `GET /api/admin/users` — User directory with search & role filters
- `PATCH /api/admin/users/:id` — Activate/deactivate user or verify owner
- `GET /api/admin/messes` — All listings across pending/approved/rejected statuses
- `PATCH /api/admin/messes/:id/approval` — Approve, reject, or suspend listing
- `GET /api/admin/reports` — Platform incident reports
- `PATCH /api/admin/reports/:id` — Resolve or dismiss report
- `GET /api/admin/reviews` — All reviews for moderation
- `PATCH /api/admin/reviews/:id/moderate` — Hide/unhide review

---

## Viva & Project Defense Notes

1. **Why two frontends?**
   - The Vanilla JS version shows core web fundamentals (DOM manipulation, no build step, served directly by Express).
   - The React + Vite version in `frontend/` provides a component-based UI on the same API.
2. **Database Design & Indexing:**
   - Single MongoDB connection with indexed reference fields (`owner`, `mess`, `user`, `student`).
   - Unique compound index on `Review` (`{ mess: 1, user: 1 }`) ensures a student can review a mess only once.
   - Aggregate pipeline calculates weighted averages for ratings efficiently on submission.
3. **Approval Lifecycle:**
   - Owner-created listings enter the database as `pending`. They are hidden from public search until an Admin reviews and approves them, ensuring platform safety.
4. **Security:**
   - Passwords hashed with `bcryptjs` salt rounds.
   - JWT tokens stored in client `localStorage` and verified via server middleware on protected endpoints.
   - Sanitized user output strips passwords before returning API responses.

---

## License

This project was developed for academic evaluation as a BCA Final Year Web Application.
All rights reserved © 2026 MessHunt.
