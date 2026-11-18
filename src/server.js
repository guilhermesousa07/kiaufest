require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const helmet = require('helmet');
const path = require('path');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('./db');

const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  createDatabaseTable: true
});

app.use(session({
  name: 'kiau.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000
  }
}));

app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/sectors', require('./routes/sectors'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/venue', require('./routes/venue'));

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../public/admin.html')));
app.get('/event/:slug', (req, res) => res.sendFile(path.join(__dirname, '../public/event.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor.' : err.message });
});

async function bootstrap() {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error('Configure SESSION_SECRET com pelo menos 32 caracteres no .env');
  }
  await db.query('SELECT 1');
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (email && password) {
    const [rows] = await db.execute('SELECT id FROM users WHERE email=?', [email]);
    if (!rows.length) {
      const hash = await bcrypt.hash(password, 12);
      await db.execute(
        "INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,'admin')",
        [process.env.ADMIN_NAME || 'Administrador', email, hash]
      );
      console.log('Administrador inicial criado:', email);
    } else {
      await db.execute("UPDATE users SET role='admin' WHERE email=?", [email]);
    }
  }
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`KIAU FEST rodando em http://localhost:${port}`));
}

bootstrap().catch(e => {
  console.error('Falha ao iniciar:', e.message);
  process.exit(1);
});
