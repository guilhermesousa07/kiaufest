const router = require('express').Router();
const db = require('../db');
const { requireAdmin } = require('../middleware');

const slugify = value => String(value || 'evento').toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      "SELECT id,title,slug,description,venue,city,event_date,image_url,price FROM events WHERE status='published' ORDER BY event_date ASC"
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/admin/list', requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM events ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      "SELECT id,title,slug,description,venue,city,event_date,image_url,price FROM events WHERE (id=? OR slug=?) AND status='published' LIMIT 1",
      [req.params.id, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Evento não encontrado.' });
    const [sectors] = await db.execute(
      'SELECT id,name,description,price,capacity,color FROM sectors WHERE event_id=? ORDER BY price ASC',
      [rows[0].id]
    );
    res.json({ ...rows[0], sectors });
  } catch (e) { next(e); }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.title || !b.event_date || !b.venue) return res.status(400).json({ error: 'Título, data e local são obrigatórios.' });
    const slug = `${slugify(b.title)}-${Date.now()}`;
    const [r] = await db.execute(
      'INSERT INTO events(title,slug,description,venue,city,event_date,image_url,price,status) VALUES(?,?,?,?,?,?,?,?,?)',
      [b.title, slug, b.description || '', b.venue, b.city || 'Araçuaí - MG', b.event_date, b.image_url || '', Number(b.price || 0), b.status === 'draft' ? 'draft' : 'published']
    );
    res.status(201).json({ id: r.insertId, message: 'Evento criado.' });
  } catch (e) { next(e); }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const b = req.body;
    await db.execute(
      'UPDATE events SET title=?,description=?,venue=?,city=?,event_date=?,image_url=?,price=?,status=? WHERE id=?',
      [b.title, b.description || '', b.venue, b.city || 'Araçuaí - MG', b.event_date, b.image_url || '', Number(b.price || 0), b.status || 'published', req.params.id]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await db.execute("UPDATE events SET status='cancelled' WHERE id=?", [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
