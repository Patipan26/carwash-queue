const express = require('express');
const pool = require('../db');
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function makeBookingCode() {
  return `CW${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;
}

function parseAddonIds(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(Number).filter(Number.isInteger);
  try { return JSON.parse(value).map(Number).filter(Number.isInteger); } catch { return []; }
}

router.post('/', authenticate, upload.single('slip'), async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { serviceId, bookingDate, bookingTime, customerName, customerPhone, carModel, carPlate } = req.body;
    if (!serviceId || !bookingDate || !bookingTime || !customerName || !customerPhone || !carModel || !carPlate) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลการจองให้ครบถ้วน' });
    }

    const addonIds = parseAddonIds(req.body.addonIds);
    await connection.beginTransaction();
    const [serviceRows] = await connection.query('SELECT id, price FROM services WHERE id = ? AND active = TRUE', [serviceId]);
    if (!serviceRows.length) {
      await connection.rollback();
      return res.status(400).json({ message: 'ไม่พบบริการที่เลือก' });
    }

    let totalPrice = Number(serviceRows[0].price);
    let addonRows = [];
    if (addonIds.length) {
      const [rows] = await connection.query(
        `SELECT id, price FROM addons WHERE active = TRUE AND id IN (${addonIds.map(() => '?').join(',')})`,
        addonIds
      );
      addonRows = rows;
      totalPrice += rows.reduce((sum, row) => sum + Number(row.price), 0);
    }

    const bookingCode = makeBookingCode();
    const slipPath = req.file ? `/uploads/${req.file.filename}` : null;
    const [result] = await connection.query(
      `INSERT INTO bookings
        (booking_code, user_id, service_id, booking_date, booking_time, customer_name, customer_phone, car_model, car_plate, total_price, status, payment_status, slip_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [bookingCode, req.user.id, serviceId, bookingDate, bookingTime, customerName, customerPhone, carModel, carPlate, totalPrice, slipPath ? 'pending_review' : 'unpaid', slipPath]
    );

    for (const addon of addonRows) {
      await connection.query(
        'INSERT INTO booking_addons (booking_id, addon_id, price_at_booking) VALUES (?, ?, ?)',
        [result.insertId, addon.id, addon.price]
      );
    }
    await connection.commit();
    res.status(201).json({ bookingCode, totalPrice, paymentStatus: slipPath ? 'pending_review' : 'unpaid' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const [bookings] = await pool.query(
      `SELECT b.id, b.booking_code AS bookingCode, b.booking_date AS bookingDate, b.booking_time AS bookingTime,
              b.customer_name AS customerName, b.customer_phone AS customerPhone, b.car_model AS carModel,
              b.car_plate AS carPlate, b.total_price AS totalPrice, b.status, b.payment_status AS paymentStatus,
              b.slip_path AS slipPath, s.name AS service
       FROM bookings b JOIN services s ON s.id = b.service_id
       WHERE b.user_id = ? ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    for (const booking of bookings) {
      const [addons] = await pool.query(
        `SELECT a.id, a.name, ba.price_at_booking AS price
         FROM booking_addons ba JOIN addons a ON a.id = ba.addon_id WHERE ba.booking_id = ?`,
        [booking.id]
      );
      booking.addons = addons;
    }
    res.json({ bookings });
  } catch (error) { next(error); }
});

router.get('/:code', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, s.name AS service FROM bookings b JOIN services s ON s.id = b.service_id
       WHERE b.booking_code = ? AND b.user_id = ?`,
      [req.params.code, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'ไม่พบรายการจอง' });
    res.json({ booking: rows[0] });
  } catch (error) { next(error); }
});

module.exports = router;
