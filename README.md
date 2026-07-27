# Anjana A V — Portfolio

A lightweight, fully responsive personal portfolio built with vanilla HTML, CSS,
and JavaScript, plus a small Express backend for a real (not faked) contact form.

## Project overview

- **Frontend:** static site — `index.html`, `style.css`, `script.js`
- **Backend:** `backend/` — Express API that validates, sanitizes, rate-limits,
  and emails contact form submissions via SMTP

## Project structure

```
portfolio/
├── index.html
├── style.css
├── script.js
├── assets/
│   ├── profile.jpg
│   └── Anjana_A_V_Resume.pdf
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── README.md
```

## Running the frontend locally

The frontend has no build step. Open `index.html` directly in a browser, or
serve it locally:

```bash
npx serve .
```

For the contact form to actually work, run the backend (below) and have the
frontend requests reach it — either by hosting both under the same domain, or
by pointing `script.js`'s `fetch('/api/contact', ...)` at your deployed API URL.

## Running the backend locally

```bash
cd backend
cp .env.example .env   # fill in real SMTP credentials
npm install
npm start
```

The API listens on `http://localhost:3000` by default:

- `GET /api/health` — returns `{ status: 'ok', mailConfigured: true|false }`
- `POST /api/contact` — body: `{ name, email, subject, message }`

## Email configuration

Fill in `backend/.env` (never commit this file — see `.gitignore`):

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — your mail
  provider's SMTP credentials (for Gmail, use an
  [App Password](https://myaccount.google.com/apppasswords), not your login password)
- `CONTACT_TO` — the inbox that should receive messages
- `ALLOWED_ORIGIN` — set to your deployed frontend's URL for CORS

If `SMTP_HOST` isn't set, the API still runs and validates requests, but
responds with a clear "email delivery not configured" message instead of
pretending to send anything.

## Deployment

**Frontend:** any static host — Netlify, Vercel, GitHub Pages, Cloudflare Pages.

**Backend:** any Node host that supports environment variables — Render,
Railway, Fly.io, or a small VPS. Set the environment variables from
`.env.example` in your host's dashboard.

If frontend and backend are on different domains, update:

- `ALLOWED_ORIGIN` in the backend's environment
- The `fetch('/api/contact', ...)` URL in `script.js` to the full backend URL

## Environment variables reference

See `backend/.env.example` for the full list with descriptions.

## Future improvements

- Automated tests for the contact API (unit + integration)
- CI pipeline for linting and deployment
- Optional database logging of submissions (currently email-only by design)
