import { randomInt } from 'crypto';

/** No 0/O/1/I/L: the code is also read aloud and typed by hand at the counter. */
const ALPHABET = `23456789ABCDEFGHJKMNPQRSTUVWXYZ`;
const CODE_LENGTH = 10;
const PREFIX = `SV-`;

/** Matches a (normalised) redemption voucher, e.g. `SV-7K2M9QX4HB`. */
export const VOUCHER_CODE_PATTERN = /^SV-[A-Z0-9]{10}$/;

/** A new random voucher code (cryptographically random, ~50 bits). */
export function generateVoucherCode(): string {
  let body = ``;
  for (let i = 0; i < CODE_LENGTH; i++) {
    body += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `${PREFIX}${body}`;
}

/**
 * Normalises what the counter typed or scanned: trims, upper-cases and drops
 * stray spaces. Returns null when it is not a voucher code.
 */
export function normalizeVoucherCode(
  raw: string | null | undefined,
): string | null {
  const code = (raw ?? ``).replace(/\s+/g, ``).toUpperCase();
  return VOUCHER_CODE_PATTERN.test(code) ? code : null;
}
