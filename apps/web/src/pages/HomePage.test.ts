import { describe, expect, it } from 'vitest';
import { resolveHomeRedirectTarget } from './HomePage';

describe('resolveHomeRedirectTarget', () => {
  it('preserves query params when redirecting to a Telegram mini app route', () => {
    expect(resolveHomeRedirectTarget('?startapp=keyholding&currency=USD')).toBe(
      '/keyholding?startapp=keyholding&currency=USD',
    );
  });

  it('uses the Telegram start param when present', () => {
    expect(resolveHomeRedirectTarget('', 'tasks')).toBe('/tasks');
  });
});
