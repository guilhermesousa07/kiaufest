const router = require('express').Router();
const crypto = require('crypto');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware');

router.post('/', requireAuth, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const eventId = Number(req.body.event_id);
    const sectorId = Number(req.body.sector_id);
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return res.status(400).json({ error: 'Quantidade deve ser de 1 a 10.' });
    }
    await conn.beginTransaction();
    const [sectors] = await conn.execute(
      `SELECT s.id,s.price,s.capacity,e.id AS event_id
       FROM sectors s JOIN events e ON e.id=s.event_id
       WHERE s.id=? AND e.id=? AND e.status='published' FOR UPDATE`,
      [sectorId, eventId]
    );
    if (!sectors.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Setor não encontrado para este evento.' });
    }
    const [sold] = await conn.execute(
      "SELECT COALESCE(SUM(oi.quantity),0) AS total FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE oi.sector_id=? AND o.status IN ('pending','paid')",
      [sectorId]
    );
    if (Number(sold[0].total) + quantity > Number(sectors[0].capacity)) {
      await conn.rollback();
      return res.status(409).json({ error: 'Não há lugares suficientes neste setor.' });
    }
    const total = Number(sectors[0].price) * quantity;
    const code = crypto.randomBytes(5).toString('hex').toUpperCase();
    const [order] = await conn.execute(
      "INSERT INTO orders(user_id,event_id,total,status,code) VALUES(?,?,?,'pending',?)",
      [req.session.user.id, eventId, total, code]
    );
    await conn.execute(
      'INSERT INTO order_items(order_id,sector_id,quantity,unit_price) VALUES(?,?,?,?)',
      [order.insertId, sectorId, quantity, sectors[0].price]
    );
    await conn.commit();
    res.status(201).json({ id: order.insertId, code, total, status: 'pending' });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally { conn.release(); }
});

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT o.id,o.code,o.total,o.status,o.created_at,e.title,e.event_date,
              s.name AS sector_name,oi.quantity
       FROM orders o JOIN events e ON e.id=o.event_id
       JOIN order_items oi ON oi.order_id=o.id JOIN sectors s ON s.id=oi.sector_id
       WHERE o.user_id=? ORDER BY o.created_at DESC`,
      [req.session.user.id]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/admin/all', requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT o.id,o.code,o.total,o.status,o.created_at,u.name AS customer,e.title AS event_title
       FROM orders o JOIN users u ON u.id=o.user_id JOIN events e ON e.id=o.event_id
       ORDER BY o.created_at DESC LIMIT 200`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

module.exports = router;
