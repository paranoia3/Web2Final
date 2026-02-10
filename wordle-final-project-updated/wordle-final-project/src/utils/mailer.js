const nodemailer = require("nodemailer");

// Uses env-based SMTP settings.
// In production, use a provider (SendGrid/Mailgun/Postmark) instead of a personal account.
function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE || "false") === "true";

  if (!host || !user || !pass) {
    return null; // email is optional; app still works without it
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

async function sendMail({ to, subject, html, text }) {
  const transport = createTransport();
  if (!transport) {
    // Don't fail the request if SMTP isn't configured (common in local dev).
    console.warn("⚠️ SMTP not configured. Skipping email:", subject);
    return;
  }

  const from = process.env.MAIL_FROM || "no-reply@example.com";
  await transport.sendMail({ from, to, subject, html, text });
}

module.exports = { sendMail };
