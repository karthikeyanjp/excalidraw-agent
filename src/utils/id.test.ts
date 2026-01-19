import { describe, it, expect } from 'vitest';
import { generateId, generateSeed, generateVersionNonce } from './id.js';

describe('id utilities', () => {
  describe('generateId', () => {
    it('should generate a 21-character string', () => {
      const id = generateId();
      expect(id).toHaveLength(21);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(1000);
    });

    it('should only contain valid nanoid characters', () => {
      const id = generateId();
      expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('generateSeed', () => {
    it('should generate a positive integer', () => {
      const seed = generateSeed();
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
    });

    it('should generate values less than 2147483647', () => {
      for (let i = 0; i < 100; i++) {
        const seed = generateSeed();
        expect(seed).toBeLessThan(2147483647);
      }
    });
  });

  describe('generateVersionNonce', () => {
    it('should generate a positive integer', () => {
      const nonce = generateVersionNonce();
      expect(Number.isInteger(nonce)).toBe(true);
      expect(nonce).toBeGreaterThanOrEqual(0);
    });
  });
});
