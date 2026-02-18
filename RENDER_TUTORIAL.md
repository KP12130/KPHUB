# 🚀 Codex Spark: Render Deployment Tutorial

Kövesd ezt a rövid útmutatót, hogy percek alatt élesítsd a rendszert!

## 1. Lépés: Új Web Service létrehozása
A Render dashboardon kattints a **New +** gombra, majd válaszd a **Web Service**-t.

## 2. Lépés: GitHub összekapcsolás
Válaszd ki a repository-t, amibe feltöltötted a kódot.

## 3. Lépés: Konfiguráció (Ezt írd be pontosan)

| Mező (Field) | Érték (Value) |
| :--- | :--- |
| **Name** | `codex-spark` (vagy amit szeretnél) |
| **Region** | `Frankfurt (EU Central)` (vagy ami hozzád közel van) |
| **Branch** | `main` (vagy amire feltöltötted) |
| **Root Directory** | *Hagyd üresen!* |
| **Runtime** | `Node` |
| **Build Command** | `npm run render-build` |
| **Start Command** | `npm start` |

## 4. Lépés: Environment Variables (Környezeti Változók)
Kattints az **Advanced** gombra, majd az **Add Environment Variable** gombra minden sorhoz:

| Key | Value | Megjegyzés |
| :--- | :--- | :--- |
| `PORT` | `5000` | Alapértelmezett port |
| `NODE_ENV` | `production` | Éles üzemmód |
| `VITE_API_URL` | `/api` | **FONTOS:** Ezt pontosan így írd be! |
| `FIREBASE_PROJECT_ID` | *a te projekted ID-ja* | Firebase Console-ból |
| `FIREBASE_PRIVATE_KEY` | *a te privát kulcsod* | Idézőjelek közé tedd, ha hibát dob! |
| `FIREBASE_CLIENT_EMAIL` | *a szerviz email* | Firebase Console-ból |
| `R2_ACCOUNT_ID` | *Cloudflare ID* | R2 beállításokból |
| `R2_ACCESS_KEY_ID` | *Cloudflare Key* | R2 beállításokból |
| `R2_SECRET_ACCESS_KEY` | *Cloudflare Secret* | R2 beállításokból |
| `R2_BUCKET_NAME` | `codex-spark` | A bucket neve |

## 5. Lépés: Deploy! 🛡️
Kattints a **Create Web Service** gombra az oldal alján. A Render elkezdi építeni a rendszert.

---
**💡 Tipp:** Ha az építés kész, a Render ad egy URL-t (pl. `https://codex-spark.onrender.com`). Ez lesz a te publikus weboldalad! 🦾⚡🛡️
