import { Resend } from 'resend'

// TODO: swap FROM_ADDRESS when custom domain verified in Resend
export const FROM_ADDRESS = 'Volta <onboarding@resend.dev>'
export const APP_URL      = 'https://volta-closed-beta.vercel.app'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInviteEmail(opts: {
  to: string
  inviterName: string
  eventTitle: string
  eventDate: string | null
  token: string
  eventId: string
}) {
  const link   = `${APP_URL}/events/${opts.eventId}/join/${opts.token}`
  const dateStr = opts.eventDate
    ? new Date(opts.eventDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : null

  await resend.emails.send({
    from: FROM_ADDRESS,
    to:   opts.to,
    subject: `${opts.inviterName} invited you to ${opts.eventTitle}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:480px;margin:40px auto;padding:0 20px">
    <div style="background:#161616;border:1px solid #2a2a2a;border-radius:16px;padding:32px">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#7F77DD">You're invited</p>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#fff;line-height:1.2">${opts.eventTitle}</h1>
      ${dateStr ? `<p style="margin:0 0 24px;font-size:14px;color:#888">${dateStr}</p>` : '<div style="margin-bottom:24px"></div>'}
      <p style="margin:0 0 28px;font-size:14px;color:#aaa;line-height:1.6">
        <strong style="color:#fff">${opts.inviterName}</strong> invited you to join this event on Volta.
      </p>
      <a href="${link}" style="display:inline-block;background:#7F77DD;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700">
        See details &amp; RSVP &rarr;
      </a>
    </div>
    <p style="margin:20px 0 0;font-size:11px;color:#444;text-align:center">
      You were invited by ${opts.inviterName} via Volta
    </p>
  </div>
</body>
</html>`,
  })
}
