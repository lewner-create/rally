import { Resend } from 'resend'

export const FROM_ADDRESS = 'Volta <onboarding@resend.dev>'
export const APP_URL      = 'https://volta-closed-beta.vercel.app'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendInviteEmail(opts: {
  to: string
  inviterName: string
  eventTitle: string
  eventDate: string | null
  token: string
  eventId: string
}) {
  const link    = APP_URL + '/events/' + opts.eventId + '/join/' + opts.token
  const dateStr = opts.eventDate
    ? new Date(opts.eventDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : null

  const invited = "You're invited"
  const subj    = opts.inviterName + ' invited you to ' + opts.eventTitle
  const dateHtml = dateStr ? '<p style="margin:0 0 24px;font-size:14px;color:#888">' + dateStr + '</p>' : '<div style="margin-bottom:24px"></div>'

  const html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head>' +
    '<body style="margin:0;padding:0;background:#0f0f0f;font-family:sans-serif">' +
    '<div style="max-width:480px;margin:40px auto;padding:0 20px">' +
    '<div style="background:#161616;border:1px solid #2a2a2a;border-radius:16px;padding:32px">' +
    '<p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#7F77DD">' + invited + '</p>' +
    '<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#fff">' + opts.eventTitle + '</h1>' +
    dateHtml +
    '<p style="margin:0 0 28px;font-size:14px;color:#aaa"><strong style="color:#fff">' + opts.inviterName + '</strong> invited you to join this event on Volta.</p>' +
    '<a href="' + link + '" style="display:inline-block;background:#7F77DD;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700">See details &amp; RSVP &rarr;</a>' +
    '</div>' +
    '<p style="margin:20px 0 0;font-size:11px;color:#444;text-align:center">Invited by ' + opts.inviterName + ' via Volta</p>' +
    '</div></body></html>'

  await getResend().emails.send({ from: FROM_ADDRESS, to: opts.to, subject: subj, html })
}