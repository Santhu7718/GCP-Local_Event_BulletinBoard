# ==========================================================
# STAGE 1: Build React frontend
# ==========================================================

FROM node:22-alpine AS frontend-build

WORKDIR /app/client

COPY client/package.json client/package-lock.json ./

RUN npm ci

COPY client/ ./

# ----------------------------------------------------------
# Firebase configuration required by Vite at build time
# ----------------------------------------------------------

ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_APP_ID

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID

RUN npm run build


# ==========================================================
# STAGE 2: Run Express backend + React frontend
# ==========================================================

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080


# ----------------------------------------------------------
# Install backend dependencies
# ----------------------------------------------------------

COPY server/package.json server/package-lock.json ./server/

RUN cd server && npm ci --omit=dev


# ----------------------------------------------------------
# Copy backend
# ----------------------------------------------------------

COPY server/ ./server/


# ----------------------------------------------------------
# Copy compiled React application
# ----------------------------------------------------------

COPY --from=frontend-build \
     /app/client/dist \
     ./client/dist


# ----------------------------------------------------------
# Cloud Run listens on 8080
# ----------------------------------------------------------

EXPOSE 8080


# ----------------------------------------------------------
# Start Express
# ----------------------------------------------------------

CMD ["node", "server/src/app.js"]