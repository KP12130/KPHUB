# GitHub Bejelentkezés Beállítása (Lépésről lépésre)

A GitHub bejelentkezéshez létre kell hoznod egy úgynevezett "OAuth App"-ot a GitHub-on. Ettől kapod meg a **Client ID**-t és a **Client Secret**-et, amit a Firebase kér.

## 1. Firebase Előkészítése
1.  Menj a **[Firebase Console](https://console.firebase.google.com/)** -> Válaszd ki a projektedet.
2.  Bal oldalon: **Authentication** -> **Sign-in method** fül.
3.  Kattints a **GitHub** sorra -> **Enable** (kapcsold be).
4.  Látni fogsz egy ilyet: **"Callback URL"** (pl. `https://codex-spark.firebaseapp.com/__/auth/handler`).
5.  **Másold ki ezt a linket!** (Kelleni fog a következő lépésben).

## 2. GitHub App Létrehozása
1.  Nyisd meg ezt a linket: **[GitHub Developer Settings](https://github.com/settings/applications/new)**.
2.  Töltsd ki az adatokat:
    -   **Application name**: `CodeX Spark` (vagy amit szeretnél).
    -   **Homepage URL**: `http://localhost:5173` (ahol a kliens fut fejlesztés közben).
    -   **Authorization callback URL**: **Ide illeszd be, amit az 1. lépésben másoltál ki a Firebase-ből!**
3.  Kattints a zöld **"Register application"** gombra.

## 3. Titkos Adatok Megszerzése (Client ID & Secret)
1.  A létrehozás után egy új oldalra kerülsz.
2.  Látni fogod a **Client ID**-t (egy hosszú számsor/betűsor). **Ezt másold ki.**
3.  Látni fogsz egy gombot: **"Generate a new client secret"**. Kattints rá!
4.  Megjelenik a **Client Secret**. **Másold ki azonnal**, mert többet nem fogod látni!

## 4. Vissza a Firebase-be
1.  Menj vissza a Firebase Console GitHub ablakához.
2.  Illeszd be a **Client ID**-t és a **Client Secret**-et a megfelelő mezőkbe.
3.  Kattints a **Save** (Mentés) gombra.

**Kész!** Most már működni fog a GitHub bejelentkezés a `Client ID` és `Secret` hibák nélkül.
