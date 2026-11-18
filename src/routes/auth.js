const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth } = require('../middleware');

router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
      return res.status(400).json({ error: 'Informe nome, e-mail válido e senha com pelo menos 8 caracteres.' });
    }
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ error: 'Este e-mail já possui cadastro.' });
    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      "INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,'customer')",
      [name, email, hash]
    );
    req.session.user = { id: result.insertId, name, email, role: 'customer' };
    res.status(201).json({ user: req.session.user });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const [rows] = await db.execute('SELECT id,name,email,password_hash,role FROM users WHERE email = ?', [email]);
    if (!rows.length || !(await bcrypt.compare(String(req.body.password || ''), rows[0].password_hash))) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }
    const u = rows[0];
    req.session.regenerate(err => {
      if (err) return next(err);
      req.session.user = { id: u.id, name: u.name, email: u.email, role: u.role };
      req.session.save(error => {
        if (error) return next(error);
        res.json({ user: req.session.user });
      });
    });
  } catch (e) { next(e); }
});

router.get('/me', (req, res) => res.json({ user: req.session.user || null }));

router.post('/logout', requireAuth, (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);
    res.clearCookie('kiau.sid');
    res.json({ ok: true });
  });
});

module.exports = router;
