import { parseCorsOrigins } from './parse-cors-origins.util';

describe('parseCorsOrigins', () => {
  it('returns true for missing value outside production', () => {
    expect(parseCorsOrigins(undefined, 'development')).toBe(true);
  });

  it('returns false for missing value in production', () => {
    expect(parseCorsOrigins(undefined, 'production')).toBe(false);
  });

  it('returns an array with one origin for a single URL', () => {
    expect(parseCorsOrigins('https://example.com')).toEqual([
      'https://example.com',
    ]);
  });

  it('returns an array of trimmed origins for comma-separated values', () => {
    expect(
      parseCorsOrigins('  https://example.com  ,  https://other.com  '),
    ).toEqual(['https://example.com', 'https://other.com']);
  });

  it('filters empty values', () => {
    expect(parseCorsOrigins('https://a.com,, https://b.com')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });
});
