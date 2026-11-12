import type { SendMailOptions } from 'nodemailer';
import { MEXPO_LOGO_CID, getMexpoLogoBuffer } from '../assets/mexpo-logo';

export interface RegistrationTicketEmailProps {
  eventName: string;
  eventDate?: string;
  eventLocation?: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  userOrganization?: string;
  ticketName?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paymentStatus?: string;
  loginUrl: string;
  temporaryPassword?: string;
  answers?: Array<{ label: string; value: string }>;
  qrCid?: string;
  logoCid?: string;
}

// Mexpo design tokens (mirrors dev-frontend-mexpo-new/src/app/globals.css).
const C = {
  brand500: '#3c85f3',
  brand600: '#3641f5',
  brand50: '#ecf3ff',
  brand100: '#dde9ff',
  gray25: '#fcfcfd',
  gray50: '#f9fafb',
  gray100: '#f2f4f7',
  gray200: '#e4e7ec',
  gray300: '#d0d5dd',
  gray500: '#667085',
  gray600: '#475467',
  gray700: '#344054',
  gray900: '#101828',
  success50: '#ecfdf3',
  success200: '#a6f4c5',
  success600: '#039855',
  success700: '#027a48',
  warning50: '#fffaeb',
  warning600: '#dc6803',
  warning700: '#b54708',
  error50: '#fef3f2',
  error600: '#d92d20',
};

const FONT =
  "'Outfit','Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif";

/** Escape user-controlled text before interpolating it into the HTML. */
export function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const STATUS_STYLES: Record<string, { label: string; bg: string; fg: string }> =
  {
    PENDING: { label: 'Menunggu', bg: C.warning50, fg: C.warning700 },
    APPROVED: { label: 'Disetujui', bg: C.success50, fg: C.success700 },
    PAID: { label: 'Lunas', bg: C.success50, fg: C.success700 },
    REJECTED: { label: 'Ditolak', bg: C.error50, fg: C.error600 },
    CANCELLED: { label: 'Dibatalkan', bg: C.gray100, fg: C.gray600 },
  };

function statusBadge(status: string): string {
  const style = STATUS_STYLES[status.toUpperCase()] ?? {
    label: status,
    bg: C.gray100,
    fg: C.gray600,
  };
  return `<span style="display:inline-block;background-color:${style.bg};color:${style.fg};font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px;">${escapeHtml(style.label)}</span>`;
}

function detailRow(label: string, valueHtml: string): string {
  return `
    <tr>
      <td style="padding:8px 0;color:${C.gray500};font-size:13px;width:38%;vertical-align:top;border-bottom:1px solid ${C.gray200};">${escapeHtml(label)}</td>
      <td style="padding:8px 0;color:${C.gray900};font-size:14px;font-weight:600;vertical-align:top;border-bottom:1px solid ${C.gray200};">${valueHtml}</td>
    </tr>`;
}

/**
 * RFC 2392 content ids are msg-ids (`local@domain`). Some clients, Gmail among
 * them, fail to match a bare id such as `ticket-qr`: the image then shows up as
 * a broken picture in the body plus a downloadable attachment. Both the
 * `cid:` reference and the attachment header go through this helper so they
 * always agree.
 */
export function toContentId(id: string): string {
  return id.includes('@') ? id : `${id}@mexpo.local`;
}

/**
 * Inline attachments referenced by the ticket email via `cid:`.
 * Both are marked `inline` so mail clients embed them in the body instead of
 * listing them as downloadable attachments.
 */
export function buildTicketEmailAttachments(
  qrBuffer: Buffer,
  qrCid = 'ticket-qr',
  logoCid = MEXPO_LOGO_CID,
): NonNullable<SendMailOptions['attachments']> {
  return [
    {
      filename: 'ticket-qr.png',
      content: qrBuffer,
      cid: toContentId(qrCid),
      contentType: 'image/png',
      contentDisposition: 'inline',
    },
    {
      filename: 'mexpo-logo.png',
      content: getMexpoLogoBuffer(),
      cid: toContentId(logoCid),
      contentType: 'image/png',
      contentDisposition: 'inline',
    },
  ];
}

export function buildRegistrationTicketEmailHtml(
  props: RegistrationTicketEmailProps,
): string {
  const {
    eventName,
    eventDate,
    eventLocation,
    userName,
    userEmail,
    userPhone,
    userOrganization,
    ticketName,
    paymentMethod,
    paymentReference,
    paymentStatus,
    loginUrl,
    temporaryPassword,
    answers,
    qrCid = 'ticket-qr',
    logoCid = MEXPO_LOGO_CID,
  } = props;

  const e = escapeHtml;

  const heroMeta = [
    eventDate ? { label: 'Tanggal', value: eventDate } : null,
    eventLocation ? { label: 'Lokasi', value: eventLocation } : null,
  ].filter((m): m is { label: string; value: string } => m !== null);

  const heroMetaHtml =
    heroMeta.length > 0
      ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;">
          <tr>
            ${heroMeta
              .map(
                (m) => `
            <td style="vertical-align:top;padding-right:16px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#dde9ff;">${e(m.label)}</div>
              <div style="margin-top:4px;font-size:15px;font-weight:600;color:#ffffff;line-height:1.4;">${e(m.value)}</div>
            </td>`,
              )
              .join('')}
          </tr>
        </table>`
      : '';

  const detailRows = [
    detailRow('Nama', e(userName)),
    detailRow('Email', e(userEmail)),
    userPhone ? detailRow('No. Telepon', e(userPhone)) : '',
    userOrganization ? detailRow('Instansi', e(userOrganization)) : '',
    ticketName
      ? detailRow(
          'Jenis Tiket',
          `<span style="display:inline-block;background-color:${C.brand50};color:${C.brand600};font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px;">${e(ticketName)}</span>`,
        )
      : '',
    paymentMethod
      ? detailRow(
          'Pembayaran',
          `${e(paymentMethod)}${paymentReference ? ` <span style="color:${C.gray500};font-weight:400;">(${e(paymentReference)})</span>` : ''}`,
        )
      : '',
    paymentStatus ? detailRow('Status', statusBadge(paymentStatus)) : '',
  ].join('');

  const dynamicAnswersHtml =
    answers && answers.length > 0
      ? `
      <div style="margin-top:22px;">
        <div style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${C.gray500};margin-bottom:4px;">Data Pendaftaran Tambahan</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${answers.map((a) => detailRow(a.label, e(a.value || '-'))).join('')}
        </table>
      </div>`
      : '';

  const credentialNoticeHtml = temporaryPassword
    ? `
      <tr>
        <td style="padding:0 32px 24px 32px;">
          <div style="background-color:${C.success50};border:1px solid ${C.success200};border-radius:12px;padding:18px 20px;">
            <div style="font-size:15px;font-weight:700;color:${C.success700};">Akun Mexpo Anda sudah dibuat</div>
            <div style="margin-top:6px;font-size:13px;line-height:1.6;color:${C.success700};">Gunakan kredensial berikut untuk masuk ke platform Mexpo. Segera ganti password setelah login pertama.</div>
            <div style="margin-top:12px;background-color:#ffffff;border:1px solid ${C.success200};border-radius:8px;padding:12px 14px;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:13px;color:${C.gray900};line-height:1.8;">
              <div><span style="color:${C.gray500};">Email</span>&nbsp;&nbsp;${e(userEmail)}</div>
              <div><span style="color:${C.gray500};">Password</span>&nbsp;&nbsp;${e(temporaryPassword)}</div>
            </div>
          </div>
        </td>
      </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>E-Tiket - ${e(eventName)}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.gray100};font-family:${FONT};color:${C.gray900};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">E-tiket Anda untuk ${e(eventName)} sudah siap. Tunjukkan QR Code saat check-in.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.gray100};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${C.gray200};">

          <!-- Brand header -->
          <tr>
            <td style="padding:22px 32px;background-color:#ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    <img src="cid:${e(toContentId(logoCid))}" alt="Mexpo" width="132" height="44" border="0" style="display:block;width:132px;height:auto;border:0;outline:none;" />
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="display:inline-block;background-color:${C.brand50};color:${C.brand600};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:6px 12px;border-radius:999px;">E-Tiket Resmi</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Event hero -->
          <tr>
            <td bgcolor="${C.brand500}" style="background-color:${C.brand500};padding:32px;color:#ffffff;">
              <div style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#dde9ff;">Pendaftaran Berhasil</div>
              <h1 style="margin:8px 0 0 0;font-size:28px;font-weight:800;line-height:1.25;color:#ffffff;">${e(eventName)}</h1>
              ${heroMetaHtml}
            </td>
          </tr>

          <!-- Ticket perforation -->
          <tr>
            <td style="padding:0;background-color:#ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="12" style="width:12px;height:24px;background-color:${C.gray100};border-radius:0 12px 12px 0;font-size:0;line-height:0;">&nbsp;</td>
                  <td style="border-bottom:2px dashed ${C.gray300};height:12px;font-size:0;line-height:0;">&nbsp;</td>
                  <td width="12" style="width:12px;height:24px;background-color:${C.gray100};border-radius:12px 0 0 12px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:24px 32px 8px 32px;">
              <p style="margin:0 0 10px 0;font-size:18px;font-weight:700;color:${C.gray900};">Halo, ${e(userName)}</p>
              <p style="margin:0;font-size:14px;line-height:1.7;color:${C.gray600};">
                Pendaftaran Anda untuk <strong style="color:${C.gray900};">${e(eventName)}</strong> telah berhasil. Simpan email ini dan tunjukkan QR Code di bawah saat memasuki area acara atau stan pameran.
              </p>
            </td>
          </tr>

          <!-- QR code -->
          <tr>
            <td align="center" style="padding:20px 32px 8px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:${C.gray25};border:1px solid ${C.gray200};border-radius:16px;width:100%;">
                <tr>
                  <td align="center" style="padding:24px 16px;">
                    <div style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.gray500};margin-bottom:14px;">QR Code Check-in</div>
                    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="background-color:#ffffff;border:2px solid ${C.brand100};border-radius:16px;">
                      <tr>
                        <td style="padding:12px;">
                          <img src="cid:${e(toContentId(qrCid))}" alt="QR Code Tiket" width="200" height="200" border="0" style="display:block;width:200px;height:200px;border:0;outline:none;background-color:#ffffff;" />
                        </td>
                      </tr>
                    </table>
                    <div style="margin-top:14px;font-size:13px;color:${C.gray600};">Tunjukkan QR Code ini kepada panitia saat kedatangan.</div>
                    <div style="margin-top:6px;font-size:12px;line-height:1.5;color:${C.gray500};">QR tidak tampil? Aktifkan tampilan gambar di email Anda, atau buka dashboard Mexpo dan pilih menu Badge pada event ini.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Participant details -->
          <tr>
            <td style="padding:16px 32px 24px 32px;">
              <div style="background-color:${C.gray50};border:1px solid ${C.gray200};border-radius:12px;padding:20px;">
                <div style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${C.gray500};margin-bottom:4px;">Detail Peserta &amp; Tiket</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${detailRows}
                </table>
                ${dynamicAnswersHtml}
              </div>
            </td>
          </tr>

          ${credentialNoticeHtml}

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:0 32px 36px 32px;">
              <a href="${e(loginUrl)}" target="_blank" style="display:inline-block;background-color:${C.brand500};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;">Buka Dashboard Mexpo</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:${C.gray50};border-top:1px solid ${C.gray200};padding:22px 32px;">
              <div style="font-size:13px;font-weight:700;color:${C.gray700};">Mexpo Event Platform</div>
              <div style="margin-top:6px;font-size:12px;line-height:1.6;color:${C.gray500};">&copy; ${new Date().getFullYear()} Mexpo. All rights reserved.<br/>Email ini dikirim secara otomatis. Mohon tidak membalas langsung ke email ini.</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
