# 1. Prompt

Toteuta yksinkertainen REST API kokoushuoneiden varaamiseen käyttäen Node.js:ää, TypeScriptiä ja Expressiä.

Käytä SQLite-tietokantaa (in-memory tai paikallinen tiedosto).

API:n tulee tukea seuraavia toimintoja:

- Varauksen luonti: huone varataan tietylle aikavälille

- Varauksen peruutus

- Varausten listaaminen huonekohtaisesti

Noudata seuraavia liiketoimintasääntöjä:

- Varaukset eivät saa mennä päällekkäin saman huoneen sisällä

- Varaukset eivät voi olla menneisyydessä

- Aloitusajan täytyy olla ennen lopetusaikaa

Tee yksinkertainen mutta toimiva ratkaisu.
Koodin ei tarvitse olla täydellistä tai tuotantovalmista, kunhan perustoiminnallisuus toimii.

Sisällytä tarvittavat asennus- ja käynnistysohjeet.

- Sisällytä koko vastauksesi kokonaisuudessaan ladattavaan markdown-tiedostoon

# 1. Vastaus

Yksinkertainen REST API kokoushuoneiden varaamiseen

Tämä on **yksinkertainen mutta toimiva esimerkki** REST API:sta kokoushuoneiden varaamiseen käyttäen **Node.js:ää, TypeScriptiä, Expressiä ja SQLiteä**.

Ratkaisu noudattaa annettuja liiketoimintasääntöjä:

- Varaukset eivät mene päällekkäin saman huoneen sisällä
- Varauksia ei voi tehdä menneisyyteen
- Aloitusajan täytyy olla ennen lopetusaikaa

Tietokantana käytetään SQLiteä (paikallinen tiedosto).

---

## 📦 Projektin rakenne

```
meeting-room-api/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── db.ts
│   └── routes.ts
└── bookings.db
```

---

## ⚙️ Asennusohjeet

### 1. Alusta projekti

```bash
mkdir meeting-room-api
cd meeting-room-api
npm init -y
```

### 2. Asenna riippuvuudet

```bash
npm install express sqlite3
npm install -D typescript ts-node-dev @types/express @types/node
```

### 3. TypeScript-konfiguraatio (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist"
  }
}
```

### 4. package.json scripts

```json
"scripts": {
  "dev": "ts-node-dev src/index.ts"
}
```

---

## 🗄️ Tietokanta (`src/db.ts`)

```ts
import sqlite3 from "sqlite3";

export const db = new sqlite3.Database("bookings.db");

// Luo taulu

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL
    )
  `);
});
```

---

## 🌐 Reitit (`src/routes.ts`)

```ts
import { Router } from "express";
import { db } from "./db";

export const router = Router();

// Luo varaus
router.post("/bookings", (req, res) => {
  const { room, startTime, endTime } = req.body;

  if (!room || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();

  if (start >= end) {
    return res
      .status(400)
      .json({ error: "Start time must be before end time" });
  }

  if (start < now) {
    return res.status(400).json({ error: "Cannot book in the past" });
  }

  // Tarkista päällekkäisyys
  db.get(
    `
    SELECT * FROM bookings
    WHERE room = ?
      AND NOT (? >= endTime OR ? <= startTime)
    `,
    [room, startTime, endTime],
    (err, row) => {
      if (row) {
        return res
          .status(409)
          .json({ error: "Booking overlaps existing booking" });
      }

      db.run(
        `INSERT INTO bookings (room, startTime, endTime) VALUES (?, ?, ?)`,
        [room, startTime, endTime],
        function () {
          res.status(201).json({ id: this.lastID });
        },
      );
    },
  );
});

// Peruuta varaus
router.delete("/bookings/:id", (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM bookings WHERE id = ?`, id, function () {
    if (this.changes === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.status(204).send();
  });
});

// Listaa varaukset huonekohtaisesti
router.get("/rooms/:room/bookings", (req, res) => {
  const { room } = req.params;

  db.all(
    `SELECT * FROM bookings WHERE room = ? ORDER BY startTime`,
    room,
    (err, rows) => {
      res.json(rows);
    },
  );
});
```

---

## 🚀 Sovelluksen käynnistys (`src/index.ts`)

```ts
import express from "express";
import { router } from "./routes";

const app = express();
app.use(express.json());

app.use(router);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

---

## 🔍 Esimerkkipyynnöt

### Luo varaus

```bash
POST /bookings
Content-Type: application/json

{
  "room": "A",
  "startTime": "2026-02-01T10:00:00Z",
  "endTime": "2026-02-01T11:00:00Z"
}
```

### Listaa huoneen varaukset

```bash
GET /rooms/A/bookings
```

### Peruuta varaus

```bash
DELETE /bookings/1
```

---

## ✅ Huomioita

- Aikaleimat käsitellään ISO 8601 -muodossa
- Päällekkäisyys tarkistetaan yksinkertaisella SQL-ehdolla
- Ei autentikointia, validointi pidetty tarkoituksella kevyenä

Tämä toteutus on tarkoitettu **tekniseksi näytteeksi tai harjoitustehtäväksi**, ei tuotantokäyttöön.

---

💡 Halutessasi voin seuraavaksi:

- lisätä huone-entiteetin
- kirjoittaa testejä (Jest)
- muuntaa tämän OpenAPI/Swagger-muotoon
- tai tehdä saman Fastifyllä

Valmista tuli 👍

Tein koko ratkaisun yhdeksi ladattavaksi Markdown-tiedostoksi, jossa on:

projektin rakenne

asennus- ja käynnistysohjeet

koko toimiva Node.js + TypeScript + Express + SQLite -koodi

liiketoimintasäännöt huomioiva varauslogiikka

Voit:

kopioida sisällön suoraan repoosi tai

ladata markdownin sellaisenaan ja käyttää sitä tehtävän palautuksena / dokumentaationa.

Jos tämä on esim. tekninen kotitehtävä, voin seuraavaksi:

arvioida ratkaisun “junior / mid / senior” -tasolla

tiivistää sen vielä minimalistisemmaksi

tai lisätä pienen selitystekstin ”design choices & tradeoffs” -osioon

Sano vain mihin käyttöön tämä on menossa 👌

# 2. Prompt

luo projekti ladattavana zip-tiedostona

# 2. Vastaus

Valmis 👍

Loin projektin kokonaisena ja paketoin sen ladattavaksi ZIP-tiedostoksi.

👉 Lataa projekti: meeting-room-api.zip

Sisältö

ZIP sisältää:

Node.js + TypeScript + Express -projektin

SQLite-tietokannan

Varausten luonti / peruutus / listaus

Päällekkäisyys- ja aikavalidoinnit

Valmiit käynnistysskriptit

Käynnistys nopeasti
unzip meeting-room-api.zip
cd meeting-room-api
npm install
npm run dev

Palvelin käynnistyy osoitteeseen:

http://localhost:3000

Jos haluat, voin vielä:

lisätä README.md erikseen

tehdä tästä Docker-version

tai siistiä koodin “tehtävän palautus -lookiin” (kommentit + perustelut)

Sano vain 💪
