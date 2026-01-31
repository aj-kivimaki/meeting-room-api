import sqlite3 from "sqlite3";

export const db = new sqlite3.Database("bookings.db");

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
