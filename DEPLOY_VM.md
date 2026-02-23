# VM GRID: KPHUB Operational Manual

Ez a fájl tartalmazza a **kphub.dev** szerverének éles beállításait (PM2 + Nginx).

---

## 1. Szerver Futattása (PM2)
A Docker helyett közvetlenül a gép erőforrásait használjuk a maximális sebességért.

**Szerver indítása / Újraindítása:**
```bash
cd ~/KPHUB/server
pm2 start server.js --name codex-spark --update-env
```

**Logok ellenőrzése:**
```bash
pm2 logs codex-spark
```

---

## 2. Nginx Reverse Proxy (A hálózat lelke)
Az Nginx irányítja a `https://kphub.dev` forgalmát a belső `5000`-es portra.

**Config fájl helye:** `/etc/nginx/sites-available/default`

**Kritikus beállítás a Redirect hurok ellen:**
```nginx
location /api {
    client_max_body_size 500M;
    proxy_pass http://localhost:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https; # Fixálja a HTTPS detektálást
}
```

---

## 3. AdSense Integráció
A hirdetések aktiválásához cseréld le a `REPLACE_WITH_YOUR_ID` szövegeket az igazi Publisher ID-dra:

1.  `client/index.html`
2.  `client/src/components/AdUnit.jsx`

---

## 4. Hasznos Parancsok
Létrehoztunk pár rövidítést (aliast) az SSH-ban:
- `restart`: Frissíti a kódot a Git-ről, buildeli a frontendet és újraindítja a szervert.
- `pm2 logs`: Megmutatja, ha valami hiba történik élesben.

**Éles API elérhetősége:** `https://kphub.dev/api/health`

---
**STATUS: THE GRID IS RIGID.** 🌌🛡️🦾
