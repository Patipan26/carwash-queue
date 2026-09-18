const express = require('express');
const fs = require('fs/promises');
const pool = require('../db');
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const TIME_SLOTS = [
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00'
];

function getSlotCapacity() {
  const configured = Number.parseInt(process.env.BOOKING_SLOT_CAPACITY || '1', 10);
  return Number.isInteger(configured) && configured > 0 ? configured : 1;
}

function makeBookingCode() {
  return `CW${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;
}

function parseAddonIds(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(Number).filter(Number.isInteger);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isInteger) : [];
  } catch {
    return [];
  }
}

function getBangkokToday() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function removeUploadedFile(file) {
  return file?.path ? fs.unlink(file.path).catch(() => undefined) : Promise.resolve();
}

function validateBookingDateAndTime(bookingDate, bookingTime) {
  if (!isValidDate(bookingDate)) return 'รูปแบบวันที่ไม่ถูกต้อง';
  if (bookingDate < getBangkokToday()) return 'ไม่สามารถจองวันที่ผ่านมาแล้วได้';
  if (!TIME_SLOTS.includes(bookingTime)) return 'ช่วงเวลาที่เลือกไม่ถูกต้อง';
  return null;
}

async function getAvailability(date) {
  const capacity = getSlotCapacity();
  const [rows] = await pool.query(
    `SELECT booking_time AS bookingTime, COUNT(*) AS bookedCount
     FROM bookings
     WHERE booking_date = ? AND status IN ('pending', 'confirmed')
     GROUP BY booking_time`,
    [date]
  );
  const counts = new Map(rows.map((row) => [row.bookingTime, Number(row.bookedCount)]));
  return {
    date,
    capacity,
    slots: TIME_SLOTS.map((time) => {
      const bookedCount = counts.get(time) || 0;
      return {
        time,
        bookedCount,
        remaining: Math.max(capacity - bookedCount, 0),
        available: bookedCount < capacity
      };
    })
  };
}

router.get('/availability', async (req, res, next) => {
  try {
    const date = String(req.query.date || '');
    if (!isValidDate(date)) return res.status(400).json({ message: 'รูปแบบวันที่ไม่ถูกต้อง' });
    if (date < getBangkokToday()) return res.status(400).json({ message: 'ไม่สามารถตรวจสอบคิวของวันที่ผ่านมาแล้วได้' });
    res.json(await getAvailability(date));
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, upload.single('slip'), async (req, res, next) => {
  let connection;
  let transactionStarted = false;
  let lockAcquired = false;
  let slotLockName;

  try {
    const {
      serviceId,
      bookingDate,
      bookingTime,
      customerName,
      customerPhone,
      carModel,
      carPlate
    } = req.body;

    if (!serviceId || !bookingDate || !bookingTime || !customerName || !customerPhone || !carModel || !carPlate) {
      await removeUploadedFile(req.file);
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลการจองให้ครบถ้วน' });
    }

    const normalizedDate = String(bookingDate).trim();
    const normalizedTime = String(bookingTime).trim();
    const dateTimeError = validateBookingDateAndTime(normalizedDate, normalizedTime);
    if (dateTimeError) {
      await removeUploadedFile(req.file);
      return res.status(400).json({ message: dateTimeError });
    }

    const serviceIdNumber = Number(serviceId);
    if (!Number.isInteger(serviceIdNumber) || serviceIdNumber <= 0) {
      await removeUploadedFile(req.file);
      return res.status(400).json({ message: 'บริการที่เลือกไม่ถูกต้อง' });
    }

    const addonIds = [...new Set(parseAddonIds(req.body.addonIds))];
    connection = await pool.getConnection();

    // ล็อกช่วงเวลาชั่วคราว เพื่อไม่ให้คำขอสองรายการตรวจที่ว่างสุดท้ายพร้อมกัน
    slotLockName = `carwash-slot:${normalizedDate}:${normalizedTime}`;
    const [lockRows] = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [slotLockName]);
    lockAcquired = Number(lockRows[0]?.acquired) === 1;
    if (!lockAcquired) {
      await removeUploadedFile(req.file);
      return res.status(409).json({ message: 'มีผู้ใช้อื่นกำลังจองช่วงเวลานี้ กรุณาลองใหม่อีกครั้ง' });
    }

    await connection.beginTransaction();
    transactionStarted = true;

    const capacity = getSlotCapacity();
    const [slotRows] = await connection.query(
      `SELECT COUNT(*) AS bookedCount
       FROM bookings
       WHERE booking_date = ? AND booking_time = ? AND status IN ('pending', 'confirmed')`,
      [normalizedDate, normalizedTime]
    );
    const bookedCount = Number(slotRows[0]?.bookedCount || 0);
    if (bookedCount >= capacity) {
      await connection.rollback();
      transactionStarted = false;
      await removeUploadedFile(req.file);
      return res.status(409).json({
        message: `ช่วงเวลา ${normalizedTime} เต็มแล้ว กรุณาเลือกช่วงเวลาอื่น`,
        code: 'SLOT_FULL',
        capacity,
        bookedCount
      });
    }

    const [serviceRows] = await connection.query(
      'SELECT id, price FROM services WHERE id = ? AND active = TRUE',
      [serviceIdNumber]
    );
    if (!serviceRows.length) {
      await connection.rollback();
      transactionStarted = false;
      await removeUploadedFile(req.file);
      return res.status(400).json({ message: 'ไม่พบบริการที่เลือก' });
    }

    let totalPrice = Number(serviceRows[0].price);
    let addonRows = [];
    if (addonIds.length) {
      const [rows] = await connection.query(
        `SELECT id, price FROM addons
         WHERE active = TRUE AND id IN (${addonIds.map(() => '?').join(',')})`,
        addonIds
      );
      if (rows.length !== addonIds.length) {
        await connection.rollback();
        transactionStarted = false;
        await removeUploadedFile(req.file);
        return res.status(400).json({ message: 'มีบริการเสริมที่เลือกไม่ถูกต้อง' });
      }
      addonRows = rows;
      totalPrice += rows.reduce((sum, row) => sum + Number(row.price), 0);
    }

    const bookingCode = makeBookingCode();
    const slipPath = req.file ? `/uploads/${req.file.filename}` : null;
    const [result] = await connection.query(
      `INSERT INTO bookings
        (booking_code, user_id, service_id, booking_date, booking_time, customer_name, customer_phone,
         car_model, car_plate, total_price, status, payment_status, slip_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        bookingCode,
        req.user.id,
        serviceIdNumber,
        normalizedDate,
        normalizedTime,
        String(customerName).trim(),
        String(customerPhone).trim(),
        String(carModel).trim(),
        String(carPlate).trim(),
        totalPrice,
        slipPath ? 'pending_review' : 'unpaid',
        slipPath
      ]
    );

    for (const addon of addonRows) {
      await connection.query(
        'INSERT INTO booking_addons (booking_id, addon_id, price_at_booking) VALUES (?, ?, ?)',
        [result.insertId, addon.id, addon.price]
      );
    }

    await connection.commit();
    transactionStarted = false;
    res.status(201).json({
      bookingCode,
      totalPrice,
      paymentStatus: slipPath ? 'pending_review' : 'unpaid',
      bookingDate: normalizedDate,
      bookingTime: normalizedTime
    });
  } catch (error) {
    if (transactionStarted && connection) await connection.rollback().catch(() => undefined);
    await removeUploadedFile(req.file);
    next(error);
  } finally {
    if (lockAcquired && connection) await connection.query('SELECT RELEASE_LOCK(?)', [slotLockName]).catch(() => undefined);
    if (connection) connection.release();
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
  } catch (error) {
    next(error);
  }
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
  } catch (error) {
    next(error);
  }
});

module.exports = router;
