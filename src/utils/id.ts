import { nanoid } from 'nanoid';

/**
 * Generate a unique element ID
 */
export function generateId(): string {
  return nanoid(21);
}

/**
 * Generate a random seed for element rendering
 */
export function generateSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

/**
 * Generate version nonce
 */
export function generateVersionNonce(): number {
  return Math.floor(Math.random() * 2147483647);
}
