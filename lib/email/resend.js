const RESEND_API_URL = "https://api.resend.com/emails";

function getAppUrl() {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendNotificationEmail({ to, subject, message, href }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.warn("Resend is not configured. The in-app notification was saved without sending an email.");
    return { sent: false, skipped: true };
  }

  const destination = new URL(href, `${getAppUrl()}/`).toString();
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message);

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html: `
        <main style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#5C1F3A">
          <p style="margin:0 0 8px;color:#C0567A;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase">Narabi</p>
          <h1 style="margin:0 0 16px;font-size:24px">${safeSubject}</h1>
          <p style="margin:0 0 24px;line-height:1.6">${safeMessage}</p>
          <a href="${destination}" style="display:inline-block;border-radius:999px;background:#5C1F3A;padding:12px 18px;color:#fff;text-decoration:none;font-weight:700">Ver detalle</a>
        </main>
      `,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend failed with status ${response.status}: ${error}`);
  }

  return { sent: true };
}
