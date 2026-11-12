import {
  generateVoucherCode,
  normalizeVoucherCode,
  VOUCHER_CODE_PATTERN,
} from './voucher-code';

describe('voucher code', () => {
  it('generates codes in the SV-XXXXXXXXXX format', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateVoucherCode()).toMatch(VOUCHER_CODE_PATTERN);
    }
  });

  it('avoids look-alike characters (0 O 1 I L)', () => {
    const all = Array.from({ length: 300 }, generateVoucherCode).join('');
    expect(all.replace(/SV-/g, '')).not.toMatch(/[01OIL]/);
  });

  it('does not repeat in a sample', () => {
    const codes = new Set(Array.from({ length: 2000 }, generateVoucherCode));
    expect(codes.size).toBe(2000);
  });

  it('normalises what the counter types or scans', () => {
    expect(normalizeVoucherCode('  sv-7k2m9qx4hb ')).toBe('SV-7K2M9QX4HB');
    expect(normalizeVoucherCode('sv- 7K2M 9QX4HB')).toBe('SV-7K2M9QX4HB');
  });

  it('rejects anything that is not a voucher', () => {
    expect(normalizeVoucherCode('')).toBeNull();
    expect(normalizeVoucherCode(null)).toBeNull();
    expect(normalizeVoucherCode('mexpo:event:user')).toBeNull();
    expect(normalizeVoucherCode('SV-SHORT')).toBeNull();
    expect(normalizeVoucherCode('SV-7K2M9QX4HB1')).toBeNull();
  });
});
