# Codex Spark: Unified Grid Deployment Guide 🚀⚡

Deploy the entire ecosystem (Frontend + Backend) as a single high-performance **Render Web Service**.

## 1. Prepare the Source
Ensure your codebase is pushed to a private or public GitHub repository. The structure should include `client/`, `server/`, and the root `package.json`.

## 2. Unified Deployment (Render.com)
Deploy the **Root Directory** as a **Web Service**.

- **Connect**: Link your GitHub repository.
- **Root Directory**: `(Leave empty / Root)`
- **Build Command**: `npm run render-build`
- **Start Command**: `npm start`
- **Region**: Choose the one closest to you (e.g., Frankfurt/Oregon).
- **Environment Variables**:
  - `PORT`: `5000`
  - `R2_ACCOUNT_ID`: *Your Cloudflare ID*
  - `R2_ACCESS_KEY_ID`: *Your Cloudflare Key*
  - `R2_SECRET_ACCESS_KEY`: *Your Cloudflare Secret*
  - `R2_BUCKET_NAME`: `codex-spark`
  - `FIREBASE_PROJECT_ID`: *Your Project ID*
  - `FIREBASE_PRIVATE_KEY`: *Your Private Key (Replace \n with actual newlines)*
  - `FIREBASE_CLIENT_EMAIL`: *Your Service Account Email*
  - `VITE_API_URL`: `/api` (Self-referential, no absolute URL needed!)

## 3. Grid Advantages
- **No CORS Issues**: The frontend and backend share the same origin.
- **Single Instance**: Lower cost and easier management.
- **Atomic Updates**: Deployment updates both layers simultaneously.

---
**Note for Free Tier**: Render's free tier sleeps after 15 minutes of inactivity. The first request after a sleep period may take up to 30 seconds to initialize. 🦾🛡️
