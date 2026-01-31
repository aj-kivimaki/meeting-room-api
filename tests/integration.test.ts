import request from 'supertest';
import { app } from '../src/app';

describe('Integration: bookings', () => {
  test('Successful booking creation', async () => {
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000); // +1h
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2h

    const res = await request(app)
      .post('/bookings')
      .send({ room: 'A', startTime: start.toISOString(), endTime: end.toISOString() });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  test('Prevent overlapping booking (409)', async () => {
    const now = new Date();
    const start1 = new Date(now.getTime() + 3 * 60 * 60 * 1000); // +3h
    const end1 = new Date(now.getTime() + 4 * 60 * 60 * 1000); // +4h

    // create initial booking
    const res1 = await request(app)
      .post('/bookings')
      .send({ room: 'B', startTime: start1.toISOString(), endTime: end1.toISOString() });
    expect(res1.status).toBe(201);

    // overlapping booking (start inside existing)
    const overlappingStart = new Date(now.getTime() + 3.5 * 60 * 60 * 1000);
    const overlappingEnd = new Date(now.getTime() + 4.5 * 60 * 60 * 1000);

    const res2 = await request(app)
      .post('/bookings')
      .send({ room: 'B', startTime: overlappingStart.toISOString(), endTime: overlappingEnd.toISOString() });

    expect(res2.status).toBe(409);
  });

  test('Invalid interval (start >= end) returns 400', async () => {
    const now = new Date();
    const start = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + 5 * 60 * 60 * 1000); // same as start

    const res = await request(app)
      .post('/bookings')
      .send({ room: 'C', startTime: start.toISOString(), endTime: end.toISOString() });

    expect(res.status).toBe(400);
  });

  test('Booking in the past returns 400', async () => {
    const now = new Date();
    const start = new Date(now.getTime() - 2 * 60 * 60 * 1000); // -2h
    const end = new Date(now.getTime() - 1 * 60 * 60 * 1000); // -1h

    const res = await request(app)
      .post('/bookings')
      .send({ room: 'D', startTime: start.toISOString(), endTime: end.toISOString() });

    expect(res.status).toBe(400);
  });
});
