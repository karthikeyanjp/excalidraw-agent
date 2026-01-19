import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ExcalidrawFile, ExcalidrawElement } from '../types/excalidraw.js';

/**
 * Create an empty Excalidraw file structure
 */
export function createEmptyFile(options: {
  backgroundColor?: string;
  gridSize?: number | null;
} = {}): ExcalidrawFile {
  return {
    type: 'excalidraw',
    version: 2,
    source: 'excalidraw-agent',
    elements: [],
    appState: {
      gridSize: options.gridSize ?? null,
      viewBackgroundColor: options.backgroundColor ?? '#ffffff'
    },
    files: {}
  };
}

/**
 * Read an Excalidraw file from disk
 */
export function readFile(filePath: string): ExcalidrawFile {
  const resolved = path.resolve(filePath);
  
  if (!fs.existsSync(resolved)) {
    throw new FileNotFoundError(filePath);
  }
  
  const content = fs.readFileSync(resolved, 'utf-8');
  
  try {
    const data = JSON.parse(content);
    validateExcalidrawFile(data);
    return data as ExcalidrawFile;
  } catch (error) {
    if (error instanceof InvalidJsonError || error instanceof InvalidFileError) {
      throw error;
    }
    throw new InvalidJsonError(filePath, error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Write an Excalidraw file to disk
 */
export function writeFile(filePath: string, file: ExcalidrawFile, options: { force?: boolean } = {}): void {
  const resolved = path.resolve(filePath);
  
  if (fs.existsSync(resolved) && !options.force) {
    throw new FileExistsError(filePath);
  }
  
  // Ensure directory exists
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Update version on write
  file.source = 'excalidraw-agent';
  
  fs.writeFileSync(resolved, JSON.stringify(file, null, 2), 'utf-8');
}

/**
 * Validate that a parsed object is a valid Excalidraw file
 */
export function validateExcalidrawFile(data: unknown): asserts data is ExcalidrawFile {
  if (typeof data !== 'object' || data === null) {
    throw new InvalidFileError('File is not a valid JSON object');
  }
  
  const file = data as Record<string, unknown>;
  
  if (file.type !== 'excalidraw') {
    throw new InvalidFileError('File type must be "excalidraw"');
  }
  
  if (!Array.isArray(file.elements)) {
    throw new InvalidFileError('File must have an "elements" array');
  }
  
  if (typeof file.appState !== 'object' || file.appState === null) {
    throw new InvalidFileError('File must have an "appState" object');
  }
}

/**
 * Calculate bounds of all elements
 */
export function calculateBounds(elements: ExcalidrawElement[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  for (const el of elements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Count elements by type
 */
export function countElementsByType(elements: ExcalidrawElement[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const el of elements) {
    counts[el.type] = (counts[el.type] || 0) + 1;
  }
  return counts;
}

// Error classes
export class FileNotFoundError extends Error {
  constructor(filePath: string) {
    super(`File not found: ${filePath}`);
    this.name = 'FileNotFoundError';
  }
}

export class FileExistsError extends Error {
  constructor(filePath: string) {
    super(`File already exists: ${filePath} (use --force to overwrite)`);
    this.name = 'FileExistsError';
  }
}

export class InvalidJsonError extends Error {
  constructor(filePath: string, reason: string) {
    super(`Invalid JSON in ${filePath}: ${reason}`);
    this.name = 'InvalidJsonError';
  }
}

export class InvalidFileError extends Error {
  constructor(reason: string) {
    super(`Invalid Excalidraw file: ${reason}`);
    this.name = 'InvalidFileError';
  }
}
