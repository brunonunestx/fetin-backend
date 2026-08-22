import { parseCorsOrigins } from './cors';

describe('parseCorsOrigins', () => {
  it('keeps CORS disabled when no origin is configured', () => {
    expect(parseCorsOrigins(undefined)).toBeUndefined();
    expect(parseCorsOrigins('   ')).toBeUndefined();
  });

  it('normalizes a comma-separated list of origins', () => {
    expect(
      parseCorsOrigins(' https://app.example.com,https://admin.example.com '),
    ).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });

  it('removes duplicate origins', () => {
    expect(
      parseCorsOrigins('https://app.example.com,https://app.example.com'),
    ).toEqual(['https://app.example.com']);
  });
});
