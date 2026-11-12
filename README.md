# Techno School Field Sales Attendance & HRMS System

Enterprise Field Sales Attendance system with **Live Dual-Photo Verification**, **GPS Geofencing**, **Zoho People HRMS Live OAuth Synchronization**, and **Microsoft Teams Webhook Alerts**.

---

## 🌟 Key Features

1. **Dual-Photo Verified Attendance**:
   - Arrival Gate Photo with live camera verification.
   - Meeting Completion Photo with principal notes and outcome tracking.
   - GPS Geofence validation (perimeter distance check from client school gate).
2. **Zoho People HRMS Live Synchronization**:
   - Live OAuth 2.0 handshake (`people.zoho.in`).
   - Automatically synchronizes First In (Check-In) and Last Out (Check-Out) attendance punches.
   - Free-tier 5-representative workforce model for zero-cost operation.
3. **Microsoft Teams Real-Time Alerts**:
   - Broadcasts real-time Adaptive Cards to Teams channels on rep arrival and departure.
   - Super Admin daily operational briefings and KPI executive summaries.
4. **Bike Plate & Odometer KM Analysis (AI OCR)**:
   - Intelligent OCR plate extraction (Indian vehicle registration format).
   - Speedometer / Odometer digital & analog reading.
   - Automatic distance calculation and ₹3.50/KM travel reimbursement claims.
5. **Super Admin Command Hub**:
   - Live Zoho People attendance stream.
   - 3-Way reconciliation matrix (Field Visits ↔ Zoho Punches ↔ Teams Alerts).

---

## 🏗️ Project Architecture

```
Attendance/
├── backend/                  # Node.js + Express + TypeScript REST API
│   ├── src/
│   │   ├── data/             # Database persistence (JSON) & seed data
│   │   ├── routes/           # REST endpoints (auth, visits, integrations, schools)
│   │   ├── services/         # Zoho People, MS Teams, and Odometer OCR services
│   │   └── types.ts          # Shared TypeScript models
│   ├── .env.example          # Environment variables template
│   └── package.json
└── frontend-web/             # React + Vite + Tailwind CSS Web Portal
    ├── src/
    │   ├── components/       # UI views (Dashboard, Check-In, Ledger, Admin, Bike KM)
    │   ├── api.ts            # Frontend API client
    │   └── types.ts          # Client-side interfaces
    └── package.json
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
Backend will start on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend-web
npm install
npm run dev
```
Frontend web portal will start on `http://localhost:5173`.

---

## 🔑 Demo Credentials (Testing Accounts)

Default password for all demo accounts: **`techno123`**

- **Isravel S** (`israveltech@gmail.com`) — *Managing Director & Super Admin*
- **Andrew Turner** (`andrewturner@zylker.com`) — *Sales Executive*
- **Lilly Williams** (`lillywilliams@zylker.com`) — *Area Sales Manager*
- **Clarkson Walter** (`clarksonwalter@zylker.com`) — *Sales Executive*
- **Ethen Anderson** (`ethenanderson@zylker.com`) — *Field Relationship Agent*

---

## 📄 License
Proprietary & Confidential — Techno School Systems © 2026.
