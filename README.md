# AutoCare — Car Service Booking Platform

A complete platform that allows customers to find service stations, view available services and prices, book time slots, and **track the service progress live** while their vehicle is being serviced at the station.

**Stack:** React 18 + Vite (frontend) · Express + Mongoose (backend) · MongoDB · Vercel (hosting)

---

## 1. Quick Start

Open **two terminals** in the project root folder.

### Terminal 1 — Backend (API)

```bash
cd "D:\My projects\car-service-platform"
npm run dev:api
```

* API: `http://localhost:5000/api`
* Health check: `http://localhost:5000/api/health`
* This starts a **temporary in-memory MongoDB** and seeds demo data. MongoDB does not need to be installed.
* The `mongodb-memory-server` binary is downloaded only the first time. This may take approximately 2–3 minutes.

### Terminal 2 — Frontend (React)

```bash
cd "D:\My projects\car-service-platform"
npm run dev:web
```

* App: `http://localhost:5173`

### Demo Accounts

**Password for all accounts:** `password123`

| **Role** | **Email**                 |
| -------- | ------------------------- |
| Customer | `customer@autocare.lk`    |
| Station  | `cityauto@autocare.lk`    |
| Station  | `expresslube@autocare.lk` |
| Station  | `premiumbody@autocare.lk` |

Log in using the customer account and make a booking. Then log in to a station account, such as `cityauto@autocare.lk`, and change the booking status. The customer will then be able to see the live service progress. For the best demonstration, keep both browser sessions open.

### First-Time Installation

Run the following command only during the initial setup:

```bash
npm run setup
```

---

## 2. Scripts

| **Command**            | **Description**                                            |
| ---------------------- | ---------------------------------------------------------- |
| `npm run setup`        | Installs API and web dependencies                          |
| `npm run dev:api`      | Starts the API with temporary MongoDB and demo data        |
| `npm run dev:api:real` | Starts the API using the real MongoDB configured in `.env` |
| `npm run dev:web`      | Starts the React development server                        |
| `npm run seed`         | Seeds demo data into the in-memory MongoDB                 |
| `npm run build`        | Creates the frontend production build → `web/dist`         |

---

## 3. Features

### Customer

* Email registration / login, profile management, and password change
* Browse and search service stations by name, district, or city
* Filter stations by available services
* Station detail page with working hours, price list, rating breakdown, and reviews
* **Time slot booking wizard:** station → vehicle → services → date → slot → confirmation
* Double-booking prevention — a time slot is blocked if it already has an existing booking
* **Live tracking** — polling every 4 seconds to display status, current step, and progress percentage
* Booking cancellation while the booking is pending or confirmed
* Vehicle garage with add / edit / set as default / archive functionality
* Per-vehicle service history
* Customers can write a review only for completed bookings, with one review allowed per booking
* In-app notification inbox with unread notification badge

### Station

* Station registration with name, address, district, phone number, working hours, and number of service bays
* Dashboard showing today's bookings, pending requests, in-progress services, revenue, and average rating
* Booking queue filtering by pending / confirmed / in progress / on hold / completed / cancelled
* Booking management: confirm, start work, put on hold, resume, mark service steps, complete, and update payment status
* Service and pricing CRUD functionality:

  * Service name
  * Category
  * Price
  * Duration
  * Checklist steps
  * Soft delete
* Working hours and slot duration can be modified, and available slots are regenerated accordingly
* Manage customer reviews with reply and hide options
* Edit station profile

### Admin

* `User`, `Station`, `Booking`, `Service`, and `Review` endpoints under `/api/admin/*`
* Approve or feature stations
* Change user roles

### Booking Status Flow

```text
pending → confirmed → in_progress ⇄ on_hold → completed
   ↓          ↓            ↓
cancelled  cancelled    cancelled / no_show
```

Each booking status is mapped to a set of **checklist steps**. For example:

```text
received → inspection → oil_filter → quality_check → ready
```

These steps are displayed in the frontend as a progress bar and timeline.

---

## 4. Project Structure

```text
car-service-platform/
├── api/                        # Express backend (Vercel serverless function)
│   ├── index.js                # App factory + Vercel handler + local listener
│   ├── dev-memory.js           # Local development: temporary MongoDB + seed + server
│   ├── seed.js                 # Demo data
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js  Station.js  Service.js
│   │   ├── Vehicle.js  Booking.js  Review.js  Notification.js
│   ├── controllers/            # Request handlers
│   ├── routes/                 # Express routers
│   ├── middleware/             # Authentication, validation, error handling
│   ├── utils/                  # Notifier, slots, JWT, ApiError helpers
│   └── config/                 # Constants (currency, statuses, categories)
│
└── web/                        # React frontend (Vercel static build)
    ├── src/
    │   ├── pages/              # Customer pages + pages/station/*
    │   ├── components/         # Navbar, StationCard, SlotPicker, StatusBadge...
    │   ├── context/            # AuthContext, ToastContext
    │   ├── hooks/              # useLiveStatus
    │   ├── lib/api.js          # Axios instance + token handling
    │   └── config/constants.js # UI labels and formatting helpers
    └── vite.config.js          # Dev proxy → localhost:5000
```

---

## 5. Environment Variables

Copy `api/.env.example` to `api/.env`.

When using the local in-memory database, the following variables are required at minimum:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/autocare
JWT_SECRET=<long random string>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Optional — email notifications
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="AutoCare <no-reply@autocare.lk>"

# Optional — SMS (any provider that accepts a POST)
SMS_API_URL=
SMS_API_KEY=
```

Even without SMTP / SMS credentials, the application will work completely. Notifications will simply be saved in the in-app notification inbox.

The frontend does not require an `.env` file. During development, the Vite proxy forwards requests directly to `localhost:5000`.

---

## 6. Vercel Deployment

Push the repository to GitHub and connect it to Vercel. The `vercel.json` file is already configured.

* `api/index.js` → Node.js serverless function (`/api/*` requests)
* `web` → Static build (Vite `dist`) with SPA fallback

Add the following environment variables in the **Vercel Dashboard → Settings → Environment Variables**:

```env
MONGO_URI     = mongodb+srv://...        (MongoDB Atlas)
JWT_SECRET    = <long random string>
JWT_EXPIRES_IN= 7d
CLIENT_URL    = https://your-app.vercel.app
SMTP_*        = (optional)
SMS_API_*     = (optional)
```

Without MongoDB Atlas, data will not persist after deployment. Create a MongoDB Atlas free-tier database for persistent data storage.

---

## 7. Common Changes

| **What to Change**             | **File / Location**                                                |
| ------------------------------ | ------------------------------------------------------------------ |
| Currency / price format        | `web/src/config/constants.js` → `formatMoney`                      |
| Booking statuses and UI labels | `web/src/config/constants.js` + `api/config/constants.js`          |
| Service categories             | `api/models/Service.js` → `SERVICE_CATEGORIES`                     |
| Checklist steps per service    | `steps` field in the service record (editable from the station UI) |
| Booking history labels         | `api/models/Booking.js` → `STATUS_MESSAGES`                        |
| Polling interval               | `web/src/hooks/useLiveStatus.js` → `POLL_INTERVAL`                 |
| Maximum advance booking days   | `api/config/constants.js` → `maxBookableDate`                      |
| Email templates                | `api/utils/notifier.js`                                            |

---

## 8. API Reference

**Base URL:** `/api`

### Authentication

```text
POST   /auth/register/customer
POST   /auth/register/station
POST   /auth/login
GET    /auth/me
PATCH  /auth/me
PATCH  /auth/password
```

### Stations

```text
GET    /stations                    ?search=&district=&city=&service=&page=&limit=
GET    /stations/:idOrSlug
GET    /stations/me                 (station auth)
PATCH  /stations/me                 (station auth)
GET    /stations/me/dashboard       (station auth)
GET    /admin/stations              (admin)
PATCH  /admin/stations/:id          (admin)
```

### Bookings

```text
GET    /bookings/slots               ?stationId=&date=
GET    /bookings/dates               ?stationId=
POST   /bookings                     (customer) validate('booking')
GET    /bookings/mine                (customer)
GET    /bookings/station             (station) ?status=&date=
GET    /bookings/:id                 (owner or station)
PATCH  /bookings/:id/status          { status, note, currentStep, paymentStatus }
```

### Services / Vehicles / Reviews / Notifications

```text
GET    /services                     public ?station=&category=
POST   /services                     (station)
PATCH  /services/:id                 (station)
DELETE /services/:id                 (station)
GET    /services/stats               (station)

GET    /vehicles                     (customer)
POST   /vehicles                     (customer)
PATCH  /vehicles/:id                 (customer)
DELETE /vehicles/:id                 (customer)

POST   /reviews                      (customer) completed booking only
GET    /reviews/station/:stationId   public ?page=&limit=&minRating=
PATCH  /reviews/:id/reply            (station)
PATCH  /reviews/:id/visibility       (station)

GET    /notifications                (auth) ?unread=true
PATCH  /notifications/read-all       (auth)
PATCH  /notifications/:id/read       (auth)
```

---

## 9. Troubleshooting

| **Problem**                            | **Fix**                                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `EADDRINUSE :5000`                     | Stop the previously running API process — `Get-Process node \| Stop-Process -Force`                |
| `mongodb-memory-server` download fails | Check your internet connection and try again                                                       |
| Frontend API calls fail                | Make sure the API is running in Terminal 1 and check `/api/health`                                 |
| Data is not persistent                 | The application is using an in-memory database. Use `npm run dev:api:real` with a real `MONGO_URI` |
|                                        |                                                                                                    |
