import * as nodemailer from 'nodemailer';
import {
  buildRegistrationTicketEmailHtml,
  buildTicketEmailAttachments,
  toContentId,
} from './registration-ticket.template';

// 1x1 transparent PNG: enough to stand in for the generated QR code.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

async function renderRaw(): Promise<{ html: string; raw: string }> {
  const html = buildRegistrationTicketEmailHtml({
    eventName: 'Tech Expo',
    userName: 'Peserta',
    userEmail: 'peserta@example.com',
    loginUrl: 'http://localhost:3000/auth',
    qrCid: 'ticket-qr',
  });
  const transport = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
  });
  const info = await transport.sendMail({
    from: 'no-reply@example.com',
    to: 'peserta@example.com',
    subject: 'tiket',
    html,
    attachments: buildTicketEmailAttachments(PNG, 'ticket-qr'),
  });
  return { html, raw: (info.message as Buffer).toString() };
}

describe('toContentId', () => {
  it('adds a domain to a bare id and keeps a full id as it is', () => {
    expect(toContentId('ticket-qr')).toBe('ticket-qr@mexpo.local');
    expect(toContentId('qr@example.com')).toBe('qr@example.com');
  });
});

describe('registration ticket email', () => {
  it('sends the QR and the logo as inline parts of multipart/related', async () => {
    const { raw } = await renderRaw();
    expect(raw).toMatch(/Content-Type: multipart\/related/);
    expect(raw).not.toMatch(/multipart\/mixed/);
    expect(raw).not.toMatch(/Content-Disposition: attachment/i);
    expect(raw.match(/Content-Disposition: inline/gi)).toHaveLength(2);
  });

  it('references every image by the exact Content-ID of its part', async () => {
    const { html, raw } = await renderRaw();
    const refs = [...html.matchAll(/src="cid:([^"]+)"/g)].map((m) => m[1]);
    expect(refs).toEqual(
      expect.arrayContaining([
        'ticket-qr@mexpo.local',
        'mexpo-logo@mexpo.local',
      ]),
    );
    for (const ref of refs) {
      expect(raw).toContain(`Content-ID: <${ref}>`);
    }
  });
});
