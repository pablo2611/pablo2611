import { describe, expect, it } from 'vitest';
import { entropy, hashText } from '@/lib/aether';
describe('Aether crypto tools', () => {
  it('calculates SHA-256 for qwerty', async () => {
    expect(await hashText('qwerty', 'SHA-256')).toBe('65e84be33532fb784c48129675f9eff3a682b27168c0ea744b2cf58ee02337c5');
  });
  it('calculates Keccak-256 for the empty string', async () => {
    expect(await hashText('', 'Keccak-256')).toBe('c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
  });
  it('measures 1 bit/byte for two equally likely characters', () => { expect(entropy('abab')).toBe(1); });
});
