import { Router } from "express";
import { db } from "./db";
import { asyncHandler } from "./utils/asyncHandler";
import { HttpError } from "./utils/httpError";

export const router = Router();

router.post("/bookings", asyncHandler((req, res, next) => {
    const { room, startTime, endTime } = req.body;

    if (!room || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid startTime or endTime" });
    }

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
          return next(new HttpError(500, "Database error"));
        }

        if (row) {
          return next(new HttpError(409, "Booking overlaps existing booking"));
        }

        db.run(
          `INSERT INTO bookings (room, startTime, endTime) VALUES (?, ?, ?)`,
          [room, startTime, endTime],
          function (err) {
            if (err) {
              return next(new HttpError(500, "Database error"));
            }
            res.status(201).json({ id: this.lastID });
          }
        );
      }
    );
  })
);

router.delete(
  "/bookings/:id",
  asyncHandler((req, res, next) => {
    const { id } = req.params;

    db.run(`DELETE FROM bookings WHERE id = ?`, id, function (err) {
      if (err) return next(new HttpError(500, "Database error"));
      if (this.changes === 0) {
        return next(new HttpError(404, "Booking not found"));
      }
      res.status(204).send();
    });
  })
);

router.get(
  "/rooms/:room/bookings",
  asyncHandler((req, res, next) => {
    const { room } = req.params;

    db.all(
      `SELECT * FROM bookings WHERE room = ? ORDER BY startTime`,
      room,
      (err, rows) => {
        if (err) return next(new HttpError(500, "Database error"));
        res.json(rows);
      }
    );
  })
);

