const express = require('express');
const pool = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireAdmin);

router.get('/bookings', async (_req, res, next) => {
  try {
    const [bookings] = await pool.query(
      `SELECT b.id, b.booking_code AS bookingCode, b.booking_date AS bookingDate, b.booking_time AS bookingTime,
              b.customer_name AS customerName, b.customer_phone AS customerPhone, b.car_model AS carModel,
              b.car_plate AS carPlate, b.total_price AS totalPrice, b.status, b.payment_status AS paymentStatus,
              b.slip_path AS slipPath, u.email, s.name AS service
       FROM bookings b JOIN users u ON u.id = b.user_id JOIN services s ON s.id = b.service_id
       ORDER BY b.booking_date DESC, b.booking_time DESC, b.created_at DESC`
    );
    for (const booking of bookings) {
      const [addons] = await pool.query(
        `SELECT a.name, ba.price_at_booking AS price FROM booking_addons ba
         JOIN addons a ON a.id = ba.addon_id WHERE ba.booking_id = ?`,
        [booking.id]
      );
      booking.addons = addons;
    }
    res.json({ bookings });
  } catch (error) { next(error); }
});

router.patch('/bookings/:id/status', async (req, res, next) => {
  try {
    const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
    const [result] = await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'ไม่พบรายการจอง' });
    res.json({ message: 'อัปเดตสถานะแล้ว' });
  } catch (error) { next(error); }
});

router.get('/contacts', async (_req, res, next) => {
  try {
    const [contacts] = await pool.query(
      `SELECT id, sender_name AS senderName, sender_contact AS senderContact, subject, message,
              attachment_path AS attachmentPath, status, created_at AS createdAt
       FROM contacts ORDER BY created_at DESC`
    );
    res.json({ contacts });
  } catch (error) { next(error); }
});

router.patch('/contacts/:id/status', async (req, res, next) => {
  try {
    const allowed = ['unread', 'read', 'archived'];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
    await pool.query('UPDATE contacts SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    res.json({ message: 'อัปเดตข้อความแล้ว' });
  } catch (error) { next(error); }
});

router.delete('/contacts/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM contacts WHERE id = ?', [req.params.id]);
    res.json({ message: 'ลบข้อความแล้ว' });
  } catch (error) { next(error); }
});

module.exports = router;
