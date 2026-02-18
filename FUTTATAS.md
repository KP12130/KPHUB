# CodeNeon - Futtatási Útmutató (Magyarul)

## Technikai Architektúra

-   **Firebase Firestore & Auth**: Ezt használjuk adatbázisnak és beléptetésnek. "Szervermentes" és valós idejű.
-   **Cloudflare R2**: Fájltárhely (Képek, Projekt fájlok).

## Előfeltételek

1.  **Node.js**: [Letöltés](https://nodejs.org/)
2.  **Firebase Projekt**:
    -   Hozz létre egy projektet a [Firebase Console](https://console.firebase.google.com/)-on.
    -   Engedélyezd a **Firestore Database**-t.
    -   Engedélyezd az **Authentication**-t (Google/GitHub).
    -   **FONTOS**: Töltsd le a "Service Account Key" JSON fájlt (Project Settings -> Service Accounts -> Generate New Private Key).
3.  **Cloudflare R2**: (Lásd előző leírás).

## Telepítés és Beállítás

### 1. Szerver Beállítása

```bash
cd codex_spark/server
npm install
```

Szerkeszd a `.env` fájlt:

```env
PORT=5000
JWT_SECRET=ide_irj_be_barmi_titkosat_pl_supersecret123

# Firebase Service Account
# HA betetted a 'serviceAccountKey.json' fájlt a server mappába, akkor ezt a sort TÖRÖLHETED vagy üresen hagyhatod!
# FIREBASE_SERVICE_ACCOUNT='...' 

# Cloudflare R2 Beállítások
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
```

### 2. Kliens Beállítása

```bash
cd codex_spark/client
npm install
```

## Indítás

**1. Szerver (Terminál 1)**
```bash
cd codex_spark/server
npm start
```

**2. Kliens (Terminál 2)**
```bash
cd codex_spark/client
npm run dev
```
