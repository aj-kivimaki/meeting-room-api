import sqlite3 from "sqlite3";

const DB_FILE = process.env.NODE_ENV === "test" ? ":memory:" : "bookings.db";

export const db = new sqlite3.Database(DB_FILE);

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
