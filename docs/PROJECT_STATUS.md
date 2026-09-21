# Local Event Board — Project Status

## Project
SIGNAL — AI-Powered Real-Time Local Event Intelligence

## Current Architecture

React
↓
Vite
↓
Express
↓
Cloud Firestore

Later:

React
↓
Cloud Run
↓
Express
├── Firestore
├── Vertex AI
├── Cloud Storage
├── BigQuery
└── Eventarc

---

# Phase Progress

## Phase 1 — Core Application

### 1. Backend configuration
STATUS: ✅ COMPLETE

Files:
- server/src/config.js
- server/.env

Verified:
- PORT
- GOOGLE_CLOUD_PROJECT
- GOOGLE_CLOUD_LOCATION
- NODE_ENV

---

### 2. Backend Event API
STATUS: ✅ COMPLETE

File:
- server/src/routes/events.js

Endpoints:
- GET /api/health
- GET /api/events
- GET /api/events/:id
- POST /api/events
- PUT /api/events/:id
- DELETE /api/events/:id
- POST /api/events/:id/rsvp

---

### 3. Temporary local event store
STATUS: ✅ COMPLETE

File:
- server/src/services/eventStore.js

Purpose:
Initial local development only.

---

### 4. React frontend
STATUS: ✅ COMPLETE

Files:
- client/src/App.jsx
- client/src/components/EventCard.jsx
- client/src/components/EventForm.jsx
- client/src/components/EventEditForm.jsx
- client/src/components/SearchBar.jsx
- client/src/components/CategoryFilter.jsx
- client/src/services/api.js
- client/src/index.css

Features:
- Event cards
- Search
- Category filtering
- Create event
- Details
- RSVP
- Share link
- Edit event
- Change notification
- One-hour edit restriction

---

### 5. Frontend → Backend integration
STATUS: ✅ COMPLETE

Architecture:

React
↓
Vite Proxy
↓
Express

Verified:
- /api/health
- /api/events
- POST event
- RSVP
- update event

---

### 6. Complete local Phase 1
STATUS: 🟡 BLOCKED

Core functionality exists.

Current blocker:
GET /api/events returns HTTP 500.

---

### 7. Firestore persistence
STATUS: ✅ COMPLETE

Files:
- server/src/services/firestore.js
- server/src/services/eventStore.js

Verified:
- Firestore connection works
- Firestore contains 3 event documents
- getAllEvents() works
- expireOldEvents() works
- event persistence works

---

### Event editing + change history
STATUS: ✅ IMPLEMENTED

Features:
- Edit event
- Update event
- Change history
- lastChange
- Change message on card
- One-hour edit restriction
- Backend enforcement

---

# CURRENT BLOCKER

ID: B1

Problem:
GET /api/events returns HTTP 500.

Frontend symptom:
GET http://localhost:5173/api/events → 500

Backend direct:
GET http://localhost:8080/api/events → 500

Known working:
- Firestore
- eventStore
- testFirestore.js
- testEventStore.js

Suspected location:
server/src/routes/events.js
or currently running Express process

DO NOT move to Docker until B1 is resolved.

---

# Next milestones

8. Docker
9. Artifact Registry
10. Cloud Build
11. Cloud Run
12. Vertex AI
13. Deduplication
14. Quality / Trust
15. Eventarc
16. BigQuery
17. Cloud Storage
18. Final polish / demo