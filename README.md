# FitCore — Intelligent Gym Management & Facility Operations Portal

FitCore is an enterprise-grade, full-stack MERN application engineered to streamline fitness club operations, facility tracking, subscription lifecycles, and workout analytics. Built with Role-Based Access Control (RBAC), FitCore provides dedicated, 8-module portals for **Admins**, **Trainers**, and **Members**.

---

## Key Features

### 1. Multi-Role Authentication & Access Control (RBAC)
* **Admin Portal (8 Modules):** Centralized KPI dashboard, CRUD member directory, subscription tier config, billing logs, staff management, locker matrix, CSV export, and security settings.
* **Trainer Portal (8 Modules):** Attendance tracking, trainee directory, medical/injury flags, workout split builder, diet planner, progress tracker, equipment alerts, and coaching slot schedule.
* **Member Portal (8 Modules):** Digital QR access pass, subscription renewal portal, payment receipts, attendance streaks, daily workout regimens, diet plans, body transformation analytics (Weight/BMI/PRs), and facility feedback.

### 2. Digital QR Code Attendance Engine
* Dynamic client-side QR token generation for members using SVG rendering.
* Integrated camera stream scanner (`html5-qrcode`) for reception and trainer desk check-ins with duplicate prevention.

### 3. Automated Expiry & Renewal Alerts
* Background scheduler (`node-cron`) running daily at midnight to evaluate member validity.
* Automated status transitions (`Active` → `Expired`) and proactive renewal alerts for memberships expiring within 7 days.

### 4. Financial Operations & Instant PDF Invoicing
* Simulated online payment gateway for subscription renewals.
* Client-side programmatic PDF tax invoice generation with dynamic metadata and breakdown tables using `jspdf` and `jspdf-autotable`.

### 5. Visual Health & Revenue Analytics
* Interactive data visualization powered by `recharts`:
  * **Admin:** Monthly revenue trajectories and subscription tier distribution breakdown.
  * **Member & Trainer:** 6-month bodyweight/BMI transformation trendlines and 1-Rep Max Personal Record (PR) tracker.

### 6. Smart Facility Matrix & Live Crowd Gauge
* **Smart Locker System:** Interactive state-driven grid for real-time locker allocation, reservation, and maintenance locking.
* **Live Crowd Meter:** Dynamic capacity gauge showing current floor occupancy alongside hourly peak-time distribution graphs.

---

## Tech Stack

* **Frontend:** React 18 (Vite), Tailwind CSS, Lucide React, Recharts, jsPDF, jsPDF-AutoTable, HTML5-QRCode, QRCode.React, Axios.
* **Backend:** Node.js, Express.js, Node-Cron, Dotenv, CORS.
* **Database:** MongoDB Atlas (Mongoose ODM).

---

## Project Structure

```text
gym-tracker/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── QRScannerModal.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
└── server/
    ├── cron/
    │   └── expiryAlerts.js
    ├── models/
    │   ├── Member.js
    │   └── User.js
    ├── routes/
    │   ├── authRoutes.js
    │   └── memberRoutes.js
    ├── .env
    ├── seedUsers.js
    ├── server.js
    └── package.json

```

---

## Getting Started

### Prerequisites

* Node.js (v18+ recommended)
* MongoDB Atlas connection string

### 1. Backend Setup

1. Navigate to the server directory:
```bash
cd server

```


2. Install dependencies:
```bash
npm install

```


3. Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string

```


4. Seed demo users (Admin, Trainer, Member):
```bash
node seedUsers.js

```


5. Start the backend server:
```bash
npm run dev

```



### 2. Frontend Setup

1. Open a new terminal and navigate to the client directory:
```bash
cd client

```


2. Install dependencies:
```bash
npm install

```


3. Start the Vite development server:
```bash
npm run dev

```


4. Access the web portal at `http://localhost:5173`.

---

## Demo Credentials

| Role | Email | Password | Access Level |
| --- | --- | --- | --- |
| **Admin** | `admin@gym.com` | `admin123` | Full System & Operations |
| **Trainer** | `trainer@gym.com` | `trainer123` | Floor Management & Trainees |
| **Member** | `member@gym.com` | `member123` | Self-Service Portal & ID Pass |

---

## Core API Endpoints

### Authentication

* `POST /api/auth/login` — Authenticate user and retrieve role-based token.
* `GET /api/auth/users-by-role/:role` — Retrieve users filtered by system role.

### Members & Attendance

* `GET /api/members` — Fetch members with optional query filtering (`search`, `status`).
* `POST /api/members` — Enroll a new gym member.
* `POST /api/members/:id/checkin` — Mark attendance via manual or QR pass scan.
* `PUT /api/members/:id/renew` — Extend membership validity and log transaction.
* `DELETE /api/members/:id` — Remove member record.
* `GET /api/members/stats` — Aggregate metrics (total counts, active/expired split, revenue).
* `GET /api/members/alerts/expiring` — Query accounts expiring within N days.
