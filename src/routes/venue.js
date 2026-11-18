const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { requireAdmin } = require('../middleware');

const uploadDir = path.join(__dirname, '../../public/uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.glb', '.gltf'].includes(ext)) return cb(new Error('Envie somente arquivos .glb ou .gltf.'));
    cb(null, true);
  }
});

router.get('/:eventId', async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT id,title,model_url FROM venue_models WHERE event_id=? ORDER BY id DESC LIMIT 1',
      [req.params.eventId]
    );
    res.json(rows[0] || null);
  } catch (e) { next(e); }
});

router.post('/upload', requireAdmin, upload.single('model'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Selecione um arquivo GLB ou GLTF.' });
    const eventId = req.body.event_id ? Number(req.body.event_id) : null;
    const title = String(req.body.title || 'Modelo 3D').slice(0, 160);
    const modelUrl = `/uploads/${req.file.filename}`;
    await db.execute(
      'INSERT INTO venue_models(event_id,title,model_url) VALUES(?,?,?)',
      [eventId, title, modelUrl]
    );
    res.status(201).json({ title, model_url: modelUrl });
  } catch (e) { next(e); }
});

module.exports = router;
