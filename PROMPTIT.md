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

---

> Tiedoksi: Käytin ChatGPT:tä tähänastisiin prompteihin. Tästä eteenpäin käytän VSCoden Chat-Agenttia (GPT-5 mini) apuna koodin korjaamiseen.

---

# 3. Prompt

Korjaa varausten päällekkäisyyden tarkistuslogiikka.

Vaatimus:

- Kaksi varausta samassa huoneessa eivät saa mennä päällekkäin millään tavalla

- Päällekkäisyydeksi lasketaan myös tapaukset, joissa uusi varaus:

  - alkaa ennen olemassa olevaa ja päättyy sen aikana

  - alkaa olemassa olevan aikana ja päättyy sen jälkeen

  - ympäröi olemassa olevan varauksen kokonaan

  - on täsmälleen sama aikaväli

Älä muuta muita toiminnallisuuksia tai tee laajaa refaktorointia.

# 3. Vastaus

I'll add a short TODO plan, then inspect the files where reservation overlap is implemented.

Next I'll open db.ts to check database schema and types.

I'll patch routes.ts to use an explicit overlap condition and add basic DB error handling.

Edited
routes.ts+9-3
Now I'll show a short summary of changes and give commands to run the server.

Read package.json

Toteutus: Päivitetty päällekkäisyystarkistus SQL-ehtoon startTime < newEnd AND endTime > newStart ja lisätty perustason tietokantavirhekäsittely.
Tiedosto: routes.ts
Miksi: Ehto kattaa kaikki pyytämäsi tapaukset (alkaa ennen ja loppuu kesken, alkaa kesken ja loppuu jälkeen, ympäröi, täsmälleen sama aikaväli) ilman laajoja refaktorointeja.
Seuraava: Käynnistä kehityspalvelin ja testaa varauksen luomista päällekkäisillä ja ei-päällekkäisillä ajoilla.
Käynnistä dev-server:

```npm run dev```

Haluatko, että käynnistän palvelimen tässä ympäristössä ja testaan muutamia päällekkäisyystapauksia automaattisesti?

# 4. Prompt

Lisää aikavalidointi varauksen luontiin.

Vaatimukset:

Aloitusajan täytyy olla ennen lopetusaikaa

Varaus ei saa alkaa menneisyydessä

Virheellisissä tapauksissa palauta HTTP 400 ja selkeä virheviesti

Älä muuta muita toiminnallisuuksia tai rakennetta.

# 4. Vastaus

Aion tarkistaa reitit ja palvelimen lähdekoodin löytääkseni varauksen luontikohdan ja lisätä validoinnin. Nyt luen relevantit tiedostot.

Now I'll open index.ts and db.ts to confirm API wiring.

Seuraavaksi päivitän routes.ts: lisään tarkistuksen, että annetut ajat ovat kelvollisia Date-arvoja. Tämä palauttaa HTTP 400 selkeällä virheilmoituksella virhetilanteissa.

Read package.json

Edited
routes.ts+4-0
Päivitän TODO-listan: merkitsen löydön valmiiksi ja validoinnin tehdyksi. Sitten aion käynnistää dev-palvelimen nopeaan tarkistukseen.

Starting: Run tests / basic startup (3/3)

npm run dev
Muutos: Päivitin routes.ts — lisäsin tarkistuksen, että startTime ja endTime ovat kelvollisia Date-arvoja; palautan HTTP 400 viestillä "Invalid startTime or endTime" jos eivät ole.
Validoinnit nyt: aloitusaika ennen lopetusaikaa; varaus ei ala menneisyydessä; virhetilanteissa HTTP 400 ja selkeä viesti.
Muutokset rajoittuvat: vain routes.ts — muita toiminnallisuuksia tai rakennetta en muuttanut.
Testaus / seuraava: yritin käynnistää dev-palvelimen, mutta portti 3000 on varattu (EADDRINUSE). Vapauta portti tai käytä eri porttia, esim.:
Haluatko, että muutan palvelimen portin ympäristömuuttujaksi tai autan löytämään prosessin, joka käyttää porttia?