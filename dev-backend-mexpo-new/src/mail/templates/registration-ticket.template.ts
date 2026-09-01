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
  } = props;

  const dynamicAnswersHtml =
    answers && answers.length > 0
      ? `
      <div style="margin-top: 20px; border-top: 1px dashed #e2e8f0; padding-top: 16px;">
        <h4 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Data Pendaftaran Tambahan</h4>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
          ${answers
            .map(
              (ans) => `
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 40%; vertical-align: top;">${ans.label}</td>
              <td style="padding: 6px 0; color: #1e293b; font-weight: 600; vertical-align: top;">${ans.value || '-'}</td>
            </tr>
          `,
            )
            .join('')}
        </table>
      </div>
    `
      : '';

  const credentialNoticeHtml = temporaryPassword
    ? `
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h4 style="margin: 0 0 8px 0; color: #166534; font-size: 15px; font-weight: bold;">Akun Mexpo Baru Dibuat 🎉</h4>
        <p style="margin: 0 0 8px 0; color: #15803d; font-size: 13px;">Anda dapat menggunakan akun ini untuk masuk ke platform Mexpo:</p>
        <div style="background-color: #ffffff; border: 1px solid #dcfce7; border-radius: 6px; padding: 10px; font-family: monospace; font-size: 13px; color: #166534;">
          <div><strong>Email:</strong> ${userEmail}</div>
          <div><strong>Password Sementara:</strong> ${temporaryPassword}</div>
        </div>
      </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>E-Tiket & Konfirmasi Pendaftaran - ${eventName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; padding: 32px 24px; text-align: center;">
              <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #93c5fd; margin-bottom: 6px;">E-Tiket Resmi</div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; line-height: 1.3;">${eventName}</h1>
              ${
                eventDate
                  ? `<div style="margin-top: 10px; font-size: 14px; color: #e0e7ff;">📅 ${eventDate}</div>`
                  : ''
              }
              ${
                eventLocation
                  ? `<div style="margin-top: 4px; font-size: 14px; color: #e0e7ff;">📍 ${eventLocation}</div>`
                  : ''
              }
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 30px 24px;">
              <p style="margin: 0 0 16px 0; font-size: 16px;">Halo <strong>${userName}</strong>,</p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Pendaftaran Anda untuk <strong>${eventName}</strong> telah berhasil. Simpan email ini dan tunjukkan Kode QR di bawah saat memasuki area acara atau stan pameran.
              </p>

              <!-- QR Code Card -->
              <div style="text-align: center; background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <div style="font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">QR Code Check-in Peserta</div>
                <img src="cid:${qrCid}" alt="QR Code Tiket" width="180" height="180" style="display: inline-block; border-radius: 8px; background-color: #ffffff; padding: 8px; border: 1px solid #e2e8f0;" />
                <div style="margin-top: 12px; font-size: 12px; color: #64748b;">Tunjukkan QR Code ini kepada panitia saat kedatangan.</div>
              </div>

              <!-- Participant Details Card -->
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Detail Peserta & Tiket</h4>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; width: 40%;">Nama</td>
                    <td style="padding: 6px 0; color: #1e293b; font-weight: 600;">${userName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Email</td>
                    <td style="padding: 6px 0; color: #1e293b; font-weight: 600;">${userEmail}</td>
                  </tr>
                  ${
                    userPhone
                      ? `
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">No. Telepon</td>
                    <td style="padding: 6px 0; color: #1e293b; font-weight: 600;">${userPhone}</td>
                  </tr>`
                      : ''
                  }
                  ${
                    userOrganization
                      ? `
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Instansi</td>
                    <td style="padding: 6px 0; color: #1e293b; font-weight: 600;">${userOrganization}</td>
                  </tr>`
                      : ''
                  }
                  ${
                    ticketName
                      ? `
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Jenis Tiket</td>
                    <td style="padding: 6px 0; color: #2563eb; font-weight: 700;">${ticketName}</td>
                  </tr>`
                      : ''
                  }
                  ${
                    paymentMethod
                      ? `
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Pembayaran</td>
                    <td style="padding: 6px 0; color: #1e293b;">${paymentMethod} ${
                          paymentReference ? `(${paymentReference})` : ''
                        }</td>
                  </tr>`
                      : ''
                  }
                  ${
                    paymentStatus
                      ? `
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Status</td>
                    <td style="padding: 6px 0; color: ${
                      paymentStatus === 'APPROVED' || paymentStatus === 'PAID'
                        ? '#16a34a'
                        : '#ca8a04'
                    }; font-weight: 700;">${paymentStatus}</td>
                  </tr>`
                      : ''
                  }
                </table>

                ${dynamicAnswersHtml}
              </div>

              ${credentialNoticeHtml}

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0 10px 0;">
                <a href="${loginUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 15px; font-weight: bold; display: inline-block;">
                  Buka Akun / Dashboard
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
              <div>© ${new Date().getFullYear()} Mexpo Event Platform. All rights reserved.</div>
              <div style="margin-top: 4px;">Email ini dikirim secara otomatis. Mohon tidak membalas langsung ke email ini.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
