import { Router } from "express";
import { db } from "./db";

export const router = Router();

router.post("/bookings", (req, res) => {
  const { room, startTime, endTime } = req.body;

  if (!room || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();

  if (start >= end) {
    return res.status(400).json({ error: "Start time must be before end time" });
  }

  if (start < now) {
    return res.status(400).json({ error: "Cannot book in the past" });
  }

  db.get(
    `
    SELECT 1 FROM bookings
    WHERE room = ?
      AND startTime < ?
      AND endTime > ?
    `,
    [room, endTime, startTime],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (row) {
        return res.status(409).json({ error: "Booking overlaps existing booking" });
      }

      db.run(
        `INSERT INTO bookings (room, startTime, endTime) VALUES (?, ?, ?)`,
        [room, startTime, endTime],
        function () {
          res.status(201).json({ id: this.lastID });
        }
      );
    }
  );
});

router.delete("/bookings/:id", (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM bookings WHERE id = ?`, id, function () {
    if (this.changes === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.status(204).send();
  });
});

router.get("/rooms/:room/bookings", (req, res) => {
  const { room } = req.params;

  db.all(
    `SELECT * FROM bookings WHERE room = ? ORDER BY startTime`,
    room,
    (err, rows) => {
      res.json(rows);
    }
  );
});
