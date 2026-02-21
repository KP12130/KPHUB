# Production Deployment Guide (Cloud Run + Hosting)

This guide will help you deploy Codex Spark to your Firebase Blaze project.

## Prerequisites
1. Install [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
2. Install [Firebase CLI](https://firebase.google.com/docs/cli#install_the_firebase_cli): `npm install -g firebase-tools`
3. Login to both:
   - `gcloud auth login`
   - `firebase login`

---
sze
## 1. Backend Deployment (Google Cloud Run)

Run these commands from the `/server` directory:

```bash
# Set your project
gcloud config set project codeneon-12130

# Enable necessary services
gcloud services enable artifactregistry.googleapis.com run.googleapis.com

# Build and Push the Docker image (Google Cloud Build)
gcloud builds submit --tag gcr.io/codeneon-12130/api

# Deploy to Cloud Run
gcloud run deploy api --image gcr.io/codeneon-12130/api --platform managed --region us-central1 --allow-unauthenticated
```

**Note the URL**: After deployment, Cloud Run will give you a URL (e.g., `https://api-xyz.a.run.app`). **Copy this URL**.

---

## 2. Frontend Deployment (Firebase Hosting)

1. Open `/client/src/api.js` and change the URL if needed, or set it via environment variable.
2. Run these commands from the root directory:

```bash
# Go to client folder
cd client

# Build the project
npm install
npm run build

# Go back to root
cd ..

# Deploy to Firebase
firebase deploy --only hosting
```

---

## 3. Post-Deployment
- Add your Cloud Run URL to the `CORS` origins in `server/server.js` if it's not already covered by the wildcards.
- Ensure your Firebase Service Account is set in the Cloud Run Environment Variables:
  - Go to [GCP Console](https://console.cloud.google.com/run)
  - Edit your `api` service
  - Add `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` to the Variables tab.
