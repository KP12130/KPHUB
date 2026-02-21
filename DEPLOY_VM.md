# VM Evolution: Codex_Spark Initialization Guide

Gratulálok a géphez! Az External IP-d: `34.89.247.143`. 
Kattints az **SSH** gombra a GCP konzolon, és futtasd le az alábbi parancsokat sorban.

---

## 1. Rendszer frissítése és alapok
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential
```

## 2. Node.js & Docker telepítése
A szerver és a konténerezés alapjai.
```bash
# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Docker
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
# (Indítsd újra az SSH-t ezután, hogy a docker jogok érvényesüljenek!)
```

## 3. Nginx (Webszerver) telepítése
Ez fogja kezelni a forgalmat és a jövőben az SSL-t.
```bash
sudo apt install -y nginx
```

---

## 4. Tűzfal kinyitása (GCP Konzolon!)
Ahhoz, hogy lásd az oldalt, a Google-nek engednie kell a forgalmat.
1. Menj a **VPC network > Firewall** menübe.
2. **Create Firewall Rule**:
   - Name: `allow-http-https`
   - Targets: `All instances in the network`
   - Source IP ranges: `0.0.0.0/0`
   - Protocols/Ports: Jelöld be a `tcp:80`, `tcp:443` és `tcp:5000` portokat.

---

## 5. Projekt klónozása és indítása
```bash
git clone <REPOD_URLA>
cd codex_spark/server

# Környezeti változók beállítása (Másold be a .env tartalmát)
nano .env

# Docker image építése és futtatása
docker build -t codex-api .
docker run -d -p 5000:8080 --name spark-api --restart always --env-file .env codex-api
```

## 6. Frontend élesítés
A saját gépeden (helyben) a `client` mappában:
```bash
npm run build
firebase deploy --only hosting
```

---

## Ellenőrzés
Ha minden kész, látogasd meg a `http://34.89.247.143:5000/api/health` oldalt! 
Ha azt látod, hogy `status: ONLINE`, akkor a géped él és lélegzik! 🤖🌌
