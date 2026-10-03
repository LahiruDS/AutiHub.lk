# AutoCare — Car Service Booking Platform

Customers ගෙන්තුවන්ට service stations සොයාගන්න, service + price බලා time slot book කරන්න, සහ station එක ඇතුළේ service එක කරන අතර **live tracking** කරන සම්පූර්ණ platform එකක්.

**Stack:** React 18 + Vite (frontend) · Express + Mongoose (backend) · MongoDB · Vercel (hosting)

---

## 1. Quick start (run කරන්න)

පහත project root folder එකේදී terminal **දෙකක්** විවෘත කරන්න.

### Terminal 1 — Backend (API)
```bash
cd "D:\My projects\car-service-platform"
npm run dev:api
```
- API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`
- මේක **temporary in-memory MongoDB** එකක් start කරලා demo data එක seed කරනවා. MongoDB install කරන්න ඕනේ නැහැ.
- මුල් වරට පමණක් `mongodb-memory-server` binary එක download කරනවා (~2-3 min ගත වෙයි).

### Terminal 2 — Frontend (React)
```bash
cd "D:\My projects\car-service-platform"
npm run dev:web
```
- App: `http://localhost:5173`

### Demo accounts (password එකම: `password123`)
| Role | Email |
|---|---|
| Customer | `customer@autocare.lk` |
| Station | `cityauto@autocare.lk` |
| Station | `expresslube@autocare.lk` |
| Station | `premiumbody@autocare.lk` |

Customer account එකෙන් book කරලා, station account එකෙන් (`cityauto@autocare.lk`) login වුණට **status change කරන්න** — ඒකෙන් customer ට live progress එක පේනවා (browser දෙකම open කරන්න).

### පළමු install එක වරටම
```bash
npm run setup
```

---

## 2. Scripts

| Command | කරන දේ |
|---|---|
| `npm run setup` | API + web dependencies install |
| `npm run dev:api` | API start (temporary MongoDB + demo data) |
| `npm run dev:api:real` | API start (`.env` එකේ ඇති real MongoDB එකක් භාවිතා කරයි) |
| `npm run dev:web` | React dev server |
| `npm run seed` | ඇතුළත MongoDB එකට demo data seed කරයි |
| `npm run build` | Frontend production build → `web/dist` |

---

## 3. Features

### Customer
- Email registration / login, profile, password change
- Station browse + search (name, district, city) + service filter
- Station detail page: working hours, price list, rating breakdown, reviews
- **Time slot booking wizard**: station → vehicle → services → date → slot → confirm
- Double-booking prevention (එම slot එකකට booking එකක් ඇති නම් block කරයි)
- **Live tracking** — තත්පර 4කට එකපාර polling (status, current step, progress %)
- Booking cancel (pending/confirmed වලදී)
- Vehicle garage (add / edit / set-as-default / archive) + per-vehicle service history
- Review ලියන එක completed booking එකකට විතරයි (1 review per booking)
- In-app notifications inbox + unread badge

### Station
- Station registration (name, address, district, phone, working hours, bays)
- Dashboard: අද bookings, pending requests, in-progress, revenue, average rating
- Booking queue filter: pending / confirmed / in progress / on hold / completed / cancelled
- Booking manage: confirm, start work, on hold, resume, mark step, complete, payment status
- Service & pricing CRUD (name, category, price, duration, checklist steps, soft delete)
- Working hours / slot duration මොකක් හරි වෙනස් කරන්න පුළුවන් — slots ඒකට අනුකූලව regenerate වෙයි
- Customer reviews + reply + hide
- Station profile edit

### Admin
- `User`, `Station`, `Booking`, `Service`, `Review` endpoints (`/api/admin/*`) — station approve/feature, user role මාරු කිරීම

### Booking status flow
```
pending → confirmed → in_progress ⇄ on_hold → completed
   ↓          ↓            ↓
cancelled  cancelled    cancelled / no_show
```
එක් එක් status එකට **checklist steps** map කරනවා (උදා: `received → inspection → oil_filter → quality_check → ready`), frontend එකේ progress bar + timeline එකක් ලෙසපෙනේ.

---

## 4. Project structure

```
car-service-platform/
├── api/                        # Express backend (Vercel serverless function)
│   ├── index.js                # App factory + Vercel handler + local listener
│   ├── dev-memory.js           # Local dev: temp MongoDB + seed + server
│   ├── seed.js                 # Demo data
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js  Station.js  Service.js
│   │   ├── Vehicle.js  Booking.js  Review.js  Notification.js
│   ├── controllers/            # Request handlers
│   ├── routes/                 # Express routers
│   ├── middleware/             # auth, validate, error
│   ├── utils/                  # notifier, slots, jwt, ApiError helpers
│   └── config/                 # constants (currency, statuses, categories)
│
└── web/                        # React frontend (Vercel static build)
    ├── src/
    │   ├── pages/              # customer pages + pages/station/*
    │   ├── components/         # Navbar, StationCard, SlotPicker, StatusBadge...
    │   ├── context/            # AuthContext, ToastContext
    │   ├── hooks/              # useLiveStatus
    │   ├── lib/api.js          # axios instance + token handling
    │   └── config/constants.js # UI labels, formatting helpers
    └── vite.config.js          # dev proxy → localhost:5000
```

---

## 5. Environment variables

`api/.env.example` එක copy කරලා `api/.env` කරන්න. Local in-memory DB එකක් භාවිතා කරද්දී **අවම වශයෙන්** මේවා අවශ්‍යයි.

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

SMTP / SMS credentials **නොමැතුත්** app එක සම්පූර්ණයෙන්ම ක්‍රියා කරයි — notifications in-app inbox එකට පමණක් save වෙයි.

Frontend ට `.env` ඕනේ නැහැ; dev එකේ Vite proxy `localhost:5000` ටම forward කරයි.

---

## 6. Vercel deployment

Repository එක GitHub එකට push කරලා Vercel connect කරන්න. `vercel.json` දැනටමත් configure කර ඇත:

- `api/index.js` → Node.js serverless function (`/api/*` requests)
- `web` → static build (Vite `dist`, SPA fallback ඇතිව)

Vercel dashboard එකේ **Settings → Environment Variables** වලට මේවා add කරන්න:

```
MONGO_URI     = mongodb+srv://...        (MongoDB Atlas)
JWT_SECRET    = <long random string>
JWT_EXPIRES_IN= 7d
CLIENT_URL    = https://your-app.vercel.app
SMTP_*        = (optional)
SMS_API_*     = (optional)
```

MongoDB Atlas නොමැතිදා deployment එකට data persist වෙන්නේ නැහැ — Atlas (free tier) එකක් free එකක් හදාගන්න.

---

## 7. Common changes

| මොකක්ද වෙනස් කරන්න? | ගොනු |
|---|---|
| Currency / price format | `web/src/config/constants.js` → `formatMoney` |
| Booking statuses, UI labels | `web/src/config/constants.js` + `api/config/constants.js` |
| Service categories | `api/models/Service.js` → `SERVICE_CATEGORIES` |
| Checklist steps per service | service record එකේ `steps` field (station UI එකෙන් edit කරයි) |
| Booking history පෙන්වන labels | `api/models/Booking.js` → `STATUS_MESSAGES` |
| Polling interval | `web/src/hooks/useLiveStatus.js` → `POLL_INTERVAL` |
| Max advance booking days | `api/config/constants.js` → `maxBookableDate` |
| Email templates | `api/utils/notifier.js` |

---

## 8. API reference (සංක්ෂිප්ත)

Base URL: `/api`

**Auth**
```
POST   /auth/register/customer
POST   /auth/register/station
POST   /auth/login
GET    /auth/me
PATCH  /auth/me
PATCH  /auth/password
```

**Stations**
```
GET    /stations                    ?search=&district=&city=&service=&page=&limit=
GET    /stations/:idOrSlug
GET    /stations/me                 (station auth)
PATCH  /stations/me                 (station auth)
GET    /stations/me/dashboard       (station auth)
GET    /admin/stations              (admin)
PATCH  /admin/stations/:id          (admin)
```

**Bookings**
```
GET    /bookings/slots               ?stationId=&date=
GET    /bookings/dates               ?stationId=
POST   /bookings                     (customer) validate('booking')
GET    /bookings/mine                (customer)
GET    /bookings/station             (station) ?status=&date=
GET    /bookings/:id                 (owner or station)
PATCH  /bookings/:id/status          { status, note, currentStep, paymentStatus }
```

**Services / Vehicles / Reviews / Notifications**
```
GET    /services                     public ?station=&category=
POST   /services                     (station)
PATCH  /services/:id                 (station)
DELETE /services/:id                 (station)
GET    /services/stats               (station)

GET    /vehicles                     (customer)
POST   /vehicles                     (customer)
PATCH  /vehicles/:id                 (customer)
DELETE /vehicles/:id                 (customer)

POST   /reviews                      (customer) completed booking එකකට විතරයි
GET    /reviews/station/:stationId   public ?page=&limit=&minRating=
PATCH  /reviews/:id/reply            (station)
PATCH  /reviews/:id/visibility       (station)

GET    /notifications                (auth) ?unread=true
PATCH  /notifications/read-all       (auth)
PATCH  /notifications/:id/read       (auth)
```

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `EADDRINUSE :5000` | කලින්ගේ API process එක නවත්තන්න — `Get-Process node \| Stop-Process -Force` |
| `mongodb-memory-server` download fail | internet connection check කරලා නැවත try කරන්න |
| Frontend එකේ API calls fail | Terminal 1 එකේ API run වෙයි දැයි බලන්න (`/api/health`) |
| Data persist වෙන්නේ නැහැ | In-memory DB එකක් — `npm run dev:api:real` + real `MONGO_URI` භාවිතා කරන්න |
