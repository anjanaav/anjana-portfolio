// ============================================================
// Contact form API for Anjana A V's portfolio
// Uses Resend Email API instead of Gmail SMTP
// ============================================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Resend } = require('resend');

const app = express();

app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;

// ---------- Resend ----------
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// ---------- Middleware ----------
app.use(express.json({ limit: '20kb' }));

const allowedOrigin =
  process.env.ALLOWED_ORIGIN ||
  'https://anjana-portfolio-zeta.vercel.app';

app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// ---------- Rate Limiting ----------
// Maximum 5 contact submissions per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many messages sent. Please try again later.',
  },
});

// ---------- Helpers ----------
function sanitize(str) {
  return String(str)
    .trim()
    .replace(/[<>]/g, '');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------- Health Check ----------
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    mailConfigured: Boolean(resend),
  });
});

// ---------- Contact Form ----------
app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body || {};

  // Server-side validation
  const errors = [];

  if (!name || sanitize(name).length < 2) {
    errors.push('Name is required.');
  }

  if (!email || !isValidEmail(email)) {
    errors.push('A valid email is required.');
  }

  if (!subject || sanitize(subject).length < 3) {
    errors.push('Subject is required.');
  }

  if (!message || sanitize(message).length < 10) {
    errors.push('Message is too short.');
  }

  if (errors.length) {
    return res.status(400).json({
      message: errors.join(' '),
    });
  }

  // Clean user input
  const clean = {
    name: sanitize(name),
    email: sanitize(email),
    subject: sanitize(subject),
    message: sanitize(message),
  };

  // Check Resend configuration
  if (!resend) {
    console.error('RESEND_API_KEY is not configured.');

    return res.status(503).json({
      message:
        'Email delivery is not configured on the server yet. Please try again later or email directly.',
    });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM,
      to: [process.env.CONTACT_TO],
      replyTo: clean.email,
      subject: `[Portfolio Contact] ${clean.subject}`,
      text:
        `From: ${clean.name} <${clean.email}>\n\n` +
        `Subject: ${clean.subject}\n\n` +
        `${clean.message}`,
      html: `
        <h2>New Portfolio Contact Message</h2>

        <p><strong>Name:</strong> ${clean.name}</p>
        <p><strong>Email:</strong> ${clean.email}</p>
        <p><strong>Subject:</strong> ${clean.subject}</p>

        <hr>

        <p><strong>Message:</strong></p>
        <p>${clean.message.replace(/\n/g, '<br>')}</p>
      `,
    });

    if (error) {
      console.error('Resend email failed:', error);

      return res.status(502).json({
        message:
          'Could not send your message right now. Please try again later.',
      });
    }

    console.log('Email sent successfully:', data);

    return res.status(200).json({
      message: 'Message sent — thank you for reaching out!',
    });

  } catch (err) {
    console.error('Unexpected email error:', err);

    return res.status(502).json({
      message:
        'Could not send your message right now. Please try again later.',
    });
  }
});

// ---------- Fallback 404 ----------
app.use('/api', (req, res) => {
  res.status(404).json({
    message: 'Not found',
  });
});

// ---------- Start Server ----------
app.listen(PORT, () => {
  console.log(`Contact API running on port ${PORT}`);
});