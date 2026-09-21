<h1 align="center">
  📍 GCP Local Event Bulletin Board
</h1>

<p align="center">
  A full-stack community event platform powered by <strong>Google Cloud Platform</strong> — discover, post, and RSVP to local events with AI-assisted posting and trust scoring.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase&logoColor=black&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Firestore-Database-FF6F00?logo=google-cloud&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Vertex AI-Gemini 2.5-4285F4?logo=google-cloud&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Cloud Run-Deployed-34A853?logo=google-cloud&logoColor=white&style=for-the-badge" />
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Local Setup](#-local-setup)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [GCP Deployment](#-gcp-deployment)
- [How It Works](#-how-it-works)
- [Author](#-author)

---

## 🌟 Overview

**GCP Local Event Bulletin Board** is a community-first event discovery platform. Organizers can post local events (workshops, meetups, fests, cleanups, etc.) and the public can browse, search, filter, and RSVP — all without needing an account.

What makes it special:
- 🤖 **AI-powered event creation** — paste raw event text and Gemini AI structures it into a proper form
- 🛡️ **Quality & Trust Engine** — every event gets a deterministic score based on completeness and reliability
- 🔐 **Firebase Authentication** — organizers sign in via Google to manage their events
- ☁️ **Fully deployed on GCP** — Cloud Run + Firestore + Vertex AI + Cloud Build CI/CD

---

## ✨ Features

| Feature | Description |
|---|---|
| 📋 **Event Listing** | Browse all upcoming events with search and category filters |
| 🤖 **AI Event Parser** | Paste unstructured event text → Gemini 2.5 Flash structures it automatically |
| ✅ **RSVP System** | One-click RSVP with browser-level deduplication |
| 🔐 **Organizer Auth** | Google Sign-In via Firebase for event creators |
| ✏️ **Event Management** | Organizers can create, edit, and manage their own events |
| 📊 **Quality Score** | Deterministic scoring engine rates event completeness and trustworthiness |
| 📂 **Category Filter** | Filter events by type (Music, Sports, Tech, Food, Community, etc.) |
| 🔍 **Full-text Search** | Search events by title, description, or location |
| 📈 **Impact Tracking** | Tracks event reach and community engagement |
| 🐳 **Dockerized** | Multi-stage Docker build for production |
| 🚀 **CI/CD** | Automated Cloud Build pipeline → Cloud Run deployment |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (React 19)                  │
│         Vite SPA — Firebase Auth (Google Sign-In)        │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS (Firebase ID Token)
┌───────────────────────▼─────────────────────────────────┐
│                  Express API (Node.js)                   │
│             Helmet · CORS · JWT Middleware               │
│                                                          │
│  /api/events  ──►  Firestore (Cloud Firestore)           │
│  /api/ai      ──►  Vertex AI  (Gemini 2.5 Flash)         │
│  /api/impact  ──►  BigQuery   (Analytics)                │
│  /api/health  ──►  200 OK                                │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│               Google Cloud Platform                      │
│                                                          │
│  Cloud Run  ◄──  Artifact Registry  ◄──  Cloud Build     │
│  Firestore  │    BigQuery           │    Cloud Storage   │
│  Firebase   │    Vertex AI          │    Eventarc        │
└─────────────┴───────────────────────┴────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 7** | Build tool & dev server |
| **Firebase JS SDK v12** | Google Authentication |
| **Vanilla CSS** | Styling (no Tailwind) |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | REST API server |
| **Firebase Admin SDK** | Server-side Auth token verification |
| **Cloud Firestore** | Primary event database |
| **@google/genai** | Vertex AI / Gemini 2.5 Flash (AI parsing) |
| **@google-cloud/bigquery** | Event analytics & impact tracking |
| **@google-cloud/storage** | File/asset storage |
| **Helmet** | HTTP security headers |
| **Zod** | Schema validation |
| **Multer** | File upload handling |

### GCP Services
| Service | Role |
|---|---|
| **Cloud Run** | Serverless container hosting |
| **Artifact Registry** | Docker image storage |
| **Cloud Build** | CI/CD pipeline |
| **Cloud Firestore** | NoSQL document database |
| **Vertex AI** | Gemini 2.5 Flash LLM |
| **Firebase Auth** | Identity & access management |
| **BigQuery** | Analytics & impact metrics |
| **Eventarc** | Event-driven triggers |
| **Cloud Scheduler** | Cron jobs (cleanup, backfill) |

---

## 📁 Project Structure

```
local-event-board/
│
├── client/                         # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx                 # Root component & all page logic
│   │   ├── main.jsx                # React entry point
│   │   ├── firebase.js             # Firebase app init + Auth export
│   │   ├── index.css               # Global styles
│   │   ├── components/
│   │   │   ├── EventCard.jsx       # Event display card with RSVP
│   │   │   ├── EventForm.jsx       # Create event form (AI-assisted)
│   │   │   ├── EventEditForm.jsx   # Edit existing event
│   │   │   ├── AuthModal.jsx       # Google Sign-In modal
│   │   │   ├── SearchBar.jsx       # Search input component
│   │   │   └── CategoryFilter.jsx  # Category pill filters
│   │   └── services/
│   │       └── api.js              # All API calls + RSVP state helpers
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                         # Express backend (Node.js)
│   └── src/
│       ├── app.js                  # Express app setup + server start
│       ├── config.js               # Environment config (GCP, ports)
│       ├── routes/
│       │   ├── events.js           # CRUD event endpoints
│       │   ├── ai.js               # AI structure-event endpoint
│       │   ├── impact.js           # Impact/analytics endpoints
│       │   └── health.js           # Health check endpoint
│       ├── services/
│       │   ├── eventStore.js       # Firestore event operations
│       │   ├── firestore.js        # Firestore client init
│       │   ├── qualityTrust.js     # Deterministic event scoring engine
│       │   └── ai/
│       │       └── vertexAI.js     # Gemini 2.5 Flash integration
│       ├── middleware/
│       │   └── authenticateOrganizer.js  # Firebase ID token verifier
│       ├── jobs/                   # Scheduled background jobs
│       └── utils/                  # Shared utility functions
│
├── infra/                          # GCP infrastructure configs
│   ├── bigquery/                   # BigQuery schema/queries
│   ├── eventarc/                   # Eventarc trigger configs
│   └── scheduler/                  # Cloud Scheduler job configs
│
├── scripts/                        # Utility/migration scripts
├── docs/                           # Project documentation
│
├── Dockerfile                      # Multi-stage Docker build
├── cloudbuild.yaml                 # Cloud Build CI/CD pipeline
├── .gcloudignore                   # Files to ignore on gcloud deploy
├── .gitignore
└── README.md
```

---

## ✅ Prerequisites

Make sure you have the following installed:

- **Node.js** `>= 18` — [Download](https://nodejs.org/)
- **npm** `>= 9`
- **Git**
- A **Google Cloud Project** with these APIs enabled:
  - Cloud Firestore API
  - Vertex AI API
  - Firebase Authentication
  - BigQuery API *(optional for analytics)*

---

## 🚀 Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Santhu7718/GCP-Local_Event_BulletinBoard.git
cd GCP-Local_Event_BulletinBoard
```

### 2. Set Up the Backend (Server)

```bash
cd server
npm install
```

Create your environment file:

```bash
cp .env.example .env
# Then fill in the values — see Environment Variables section below
```

Start the dev server:

```bash
npm run dev
# Server runs on http://localhost:8080
```

### 3. Set Up the Frontend (Client)

Open a **new terminal**:

```bash
cd client
npm install
```

Create your environment file:

```bash
# Create client/.env with the following content:
```

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_API_BASE_URL=http://localhost:8080
```

Start the frontend dev server:

```bash
npm run dev
# Client runs on http://localhost:5173
```

### 4. Open in Browser

```
http://localhost:5173
```

> The Vite dev server proxies `/api` calls to the Express server at port `8080` automatically.

---

## 🔐 Environment Variables

### Server — `server/.env`

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: `8080`) |
| `GOOGLE_CLOUD_PROJECT` | ✅ Yes | Your GCP project ID |
| `GOOGLE_CLOUD_LOCATION` | No | GCP region (default: `asia-south1`) |
| `VERTEX_AI_LOCATION` | No | Vertex AI region (default: `global`) |
| `VERTEX_AI_MODEL` | No | Gemini model (default: `gemini-2.5-flash`) |
| `NODE_ENV` | No | `development` or `production` |

> **GCP Authentication (Local):** The server uses **Application Default Credentials (ADC)**. Run the following once:
> ```bash
> gcloud auth application-default login
> ```

### Client — `client/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | ✅ Yes | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ Yes | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | ✅ Yes | Firebase / GCP Project ID |
| `VITE_FIREBASE_APP_ID` | ✅ Yes | Firebase App ID |
| `VITE_API_BASE_URL` | No | API base URL (proxied in dev) |

> Get Firebase values from your **Firebase Console → Project Settings → General → Your apps**.

---

## 📡 API Reference

All endpoints are prefixed with `/api`.

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check |

### Events

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/events` | — | List all events (supports `?search=` and `?category=`) |
| `GET` | `/api/events/:id` | — | Get a single event by ID |
| `POST` | `/api/events` | 🔐 Organizer | Create a new event |
| `PUT` | `/api/events/:id` | 🔐 Organizer | Update an existing event |
| `POST` | `/api/events/:id/rsvp` | — | RSVP to an event |
| `GET` | `/api/events/expired` | — | List expired events |

### AI

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/structure-event` | Send raw event text → returns structured event data via Gemini |

### Impact

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/impact` | Get community impact / analytics data |

> 🔐 **Organizer Auth:** Protected routes require a Firebase ID Token in the `Authorization: Bearer <token>` header.

---

## ☁️ GCP Deployment

The app is deployed to **Google Cloud Run** using a multi-stage Docker build and automated **Cloud Build** CI/CD.

### Manual Docker Build & Deploy

```bash
# 1. Build the Docker image
docker build \
  --build-arg VITE_FIREBASE_API_KEY=your_key \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN=your_domain \
  --build-arg VITE_FIREBASE_PROJECT_ID=your_project \
  --build-arg VITE_FIREBASE_APP_ID=your_app_id \
  -t asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/event-board-repo/local-event-board:latest \
  .

# 2. Push to Artifact Registry
docker push asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/event-board-repo/local-event-board:latest

# 3. Deploy to Cloud Run
gcloud run deploy local-event-board \
  --image asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/event-board-repo/local-event-board:latest \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated
```

### Automated CI/CD via Cloud Build

The [`cloudbuild.yaml`](./cloudbuild.yaml) pipeline automatically:
1. Builds the Docker image with Firebase build-args
2. Pushes it to Artifact Registry
3. Deploys to Cloud Run (`asia-south1`)

Trigger it with:
```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions \
    _VITE_FIREBASE_API_KEY="your_key",\
    _VITE_FIREBASE_AUTH_DOMAIN="your_domain",\
    _VITE_FIREBASE_PROJECT_ID="your_project",\
    _VITE_FIREBASE_APP_ID="your_app_id"
```

---

## 🧠 How It Works

### AI Event Parsing
Users paste raw, unstructured event text (e.g., copied from WhatsApp or a flyer). The backend calls **Gemini 2.5 Flash** via Vertex AI, which parses and returns structured fields: title, date/time, location, category, description, and organizer name.

### Quality & Trust Engine
Every event is automatically scored (0–100) by a deterministic algorithm (`qualityTrust.js`) that evaluates:
- **Completeness** — are all core fields filled? (title, description, dateTime, location, city, organizer, category)
- **Description quality** — length, detail
- **Date validity** — is the event in the future?
- **Organizer info** — presence and detail level

### RSVP Deduplication
Each browser gets a unique `visitorId` stored in `localStorage`. The backend checks this ID before incrementing the RSVP count — preventing double-clicks from inflating counts.

### Authentication Flow
1. User clicks **Sign In** → Firebase Google OAuth popup
2. Firebase returns an **ID Token**
3. Frontend attaches the token as `Authorization: Bearer <token>` on every protected API call
4. Express middleware (`authenticateOrganizer.js`) verifies the token with Firebase Admin SDK

---

## 👥 Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/Santhu7718">
        <img src="https://github.com/Santhu7718.png" width="80px" style="border-radius:50%"/><br/>
        <strong>Santhu7718</strong>
      </a><br/>
      <sub>Full-Stack Developer · GCP Architect</sub>
    </td>
    <td align="center">
      <a href="https://github.com/pavankumargurram04">
        <img src="https://github.com/pavankumargurram04.png" width="80px" style="border-radius:50%"/><br/>
        <strong>Gurram Pavan Kumar</strong>
      </a><br/>
      <sub>Full-Stack Developer · GCP Architect</sub>
    </td>
  </tr>
</table>

---

<p align="center">
  Made with ❤️ on Google Cloud Platform
</p>
