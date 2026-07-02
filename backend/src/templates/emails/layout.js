/**
 * Reusable branded email layout wrapper.
 * All transactional emails share this shell for consistency.
 */
export const emailLayout = ({ title, previewText = '', bodyHtml, ctaLabel, ctaUrl, footerNote = '' }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${previewText}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F1F5F9;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#0F172A 0%,#1E40AF 60%,#06B6D4 100%);padding:32px 32px;text-align:center;">
          <h1 style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">MetlifeDM<span style="color:#67E8F9;">.</span></h1>
          <p style="margin:4px 0 0;font-size:12px;color:#BAE6FD;letter-spacing:0.08em;text-transform:uppercase;">Digital Marketing Excellence</p>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 36px 28px;">
          <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0F172A;">${title}</h2>
          <div style="font-size:15px;line-height:1.65;color:#334155;">${bodyHtml}</div>
          ${
            ctaLabel && ctaUrl
              ? `<div style="text-align:center;margin:32px 0 8px;">
                  <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#1E40AF,#06B6D4);color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:12px;box-shadow:0 8px 20px rgba(6,182,212,0.35);">${ctaLabel}</a>
                </div>`
              : ''
          }
          ${footerNote ? `<p style="margin-top:24px;font-size:13px;color:#64748B;line-height:1.6;">${footerNote}</p>` : ''}
        </td>
      </tr>
      <tr>
        <td style="background:#F8FAFC;padding:24px 32px;text-align:center;border-top:1px solid #E2E8F0;">
          <p style="margin:0 0 6px;font-size:12px;color:#64748B;">MetlifeDM LLC · USA</p>
          <p style="margin:0;font-size:11px;color:#94A3B8;">You're receiving this because you interact with MetlifeDM.<br/><a href="{{unsubscribeUrl}}" style="color:#64748B;">Manage preferences</a></p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;

export default emailLayout;
