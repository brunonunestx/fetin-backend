import { describe, expect, it } from 'vitest';
import { formatPhone, getInitials, isValidPhone, normalizePhone } from './profile-formatters';

describe('profile formatters', () => {
  it('formats and normalizes a Brazilian mobile phone', () => {
    expect(formatPhone('35999999999')).toBe('(35) 99999-9999');
    expect(formatPhone('+5535999999999')).toBe('(35) 99999-9999');
    expect(normalizePhone('(35) 99999-9999')).toBe('+5535999999999');
    expect(isValidPhone('(35) 99999-9999')).toBe(true);
  });

  it('rejects incomplete phone numbers', () => {
    expect(isValidPhone('(35) 9999')).toBe(false);
  });

  it('creates short initials without exposing identifiers', () => {
    expect(getInitials('Ana Clara Souza')).toBe('AS');
    expect(getInitials('João')).toBe('J');
    expect(getInitials(null)).toBe('TF');
  });
});
