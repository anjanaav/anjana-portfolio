// ============================================================
// Contact form API for Anjana A V's portfolio
// Real functionality: validates, sanitizes, rate-limits, and
// emails submissions via SMTP (nodemailer). Nothing here fakes
// success — if email sending fails, the API returns an error.
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;

// ---------- Middleware ----------
app.use(express.json({ limit: '20kb' }));

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// Basic spam protection: max 5 submissions per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many messages sent. Please try again later.' },
});

// ---------- Helpers ----------
function sanitize(str) {
  return String(str)
    .trim()
    .replace(/[<>]/g, ''); // strip characters that could be used for HTML/script injection
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------- Mail transport ----------
// Configure via environment variables — see .env.example
let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ---------- Routes ----------
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', mailConfigured: Boolean(transporter) });
});

app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body || {};

  // Server-side validation (never trust the client)
  const errors = [];
  if (!name || sanitize(name).length < 2) errors.push('Name is required.');
  if (!email || !isValidEmail(email)) errors.push('A valid email is required.');
  if (!subject || sanitize(subject).length < 3) errors.push('Subject is required.');
  if (!message || sanitize(message).length < 10) errors.push('Message is too short.');

  if (errors.length) {
    return res.status(400).json({ message: errors.join(' ') });
  }

  const clean = {
    name: sanitize(name),
    email: sanitize(email),
    subject: sanitize(subject),
    message: sanitize(message),
  };

  if (!transporter) {
    // No SMTP configured — tell the truth rather than faking success.
    return res.status(503).json({
      message: 'Email delivery is not configured on the server yet. Please try again later or email directly.',
    });
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.CONTACT_TO || process.env.SMTP_USER,
      replyTo: clean.email,
      subject: `[Portfolio Contact] ${clean.subject}`,
      text: `From: ${clean.name} <${clean.email}>\n\n${clean.message}`,
    });

    return res.status(200).json({ message: 'Message sent — thank you for reaching out!' });
  } catch (err) {
    console.error('Mail send failed:', err.message);
    return res.status(502).json({ message: 'Could not send your message right now. Please try again later.' });
  }
});

// Fallback 404 for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Contact API running on port ${PORT}`);
});


allowed