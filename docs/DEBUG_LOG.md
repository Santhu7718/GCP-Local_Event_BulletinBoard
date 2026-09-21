# Debug Log

## B1 — GET /api/events returns 500

### Date
2026-08-25

### Symptom

GET:

http://localhost:5173/api/events

returns:

500 Internal Server Error

Direct backend:

http://localhost:8080/api/events

also returns:

500 Internal Server Error

---

### Confirmed working

Firestore:
✅

testFirestore.js:
✅

Documents found:
3

testEventStore.js:
✅ getAllEvents()
✅ expireOldEvents()

React / Vite:
✅

---

### Current hypothesis

The failure is inside the Express route handling:

GET /api/events

or the Node process currently listening on port 8080.

---

### Next diagnostic

1. Kill all Node processes.
2. Confirm port 8080 is free.
3. Start exactly one backend using:
   node src/app.js
4. Call:
   GET http://localhost:8080/api/events
5. Capture backend terminal output.

---

### Resolution

Not solved yet.