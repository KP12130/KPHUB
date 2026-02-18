# Cloudflare R2 Beállítása (Lépésről lépésre)

A képek és fájlok feltöltéséhez szükség van a Cloudflare R2 tárhelyre. Így tudod beállítani:

## 1. Bucket Létrehozása
1.  Jelentkezz be a [Cloudflare Dashboard](https://dash.cloudflare.com/)-ra.
2.  A bal oldali menüben kattints az **R2** menüpontra.
3.  Ha még nincs fiókod, add meg a bankkártya adataidat (az ingyenes csomaghoz is kérik, de 10 GB-ig ingyenes!).
4.  Kattints a **"Create bucket"** gombra.
5.  Nevezd el a vödröt (pl. `codex-spark-assets`).
6.  Kattints a **"Create Bucket"** gombra.

## 2. API Token (Kulcsok) Létrehozása
1.  Az R2 főoldalán (nem a bucketben, hanem az áttekintő nézetben) a jobb oldalon kattints a **"Manage R2 API Tokens"** linkre.
2.  Kattints a **"Create API token"** gombra.
3.  **Token name**: Írj be valamit, pl. `CodeX Spark Token`.
4.  **Permissions**: Válaszd ki az **"Object Read & Write"** opciót (Ez fontos, hogy írni is tudjunk!).
5.  **TTL**: Válaszd a "Forever"-t vagy hagyhatod alapértelmezetten.
6.  Kattints a **"Create API Token"** gombra.

## 3. Adatok Beillesztése a Projektbe
Most látnod kell a kulcsokat. Ezeket másold be a `codex_spark/server/.env` fájl megfelelő helyére:

-   **Access Key ID** -> `R2_ACCESS_KEY_ID`
-   **Secret Access Key** -> `R2_SECRET_ACCESS_KEY`
-   **Jurisdiction-specific endpoint** (csak az "Account ID" része kell, ami a `https://` és a `.r2.cloudflarestorage.com` között van) -> `R2_ACCOUNT_ID`.
    -   *Példa*: Ha az endpoint `https://12345abcde.r2.cloudflarestorage.com`, akkor az ID: `12345abcde`.

Ne felejtsd el beírni a vödör nevét is:
-   `R2_BUCKET_NAME=codex-spark-assets` (vagy amit az 1. lépésben adtál).
