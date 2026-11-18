const router = require('express').Router();
const db = require('../db');
const { requireAdmin } = require('../middleware');

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { event_id, name, description, price, capacity, color } = req.body;
    if (!event_id || !name) return res.status(400).json({ error: 'Evento e nome do setor são obrigatórios.' });
    const [r] = await db.execute(
      'INSERT INTO sectors(event_id,name,description,price,capacity,color) VALUES(?,?,?,?,?,?)',
      [event_id, name, description || '', Number(price || 0), Number(capacity || 100), color || '#8b5cf6']
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await db.execute('DELETE FROM sectors WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
