import type { ExcalidrawElement } from '../types/excalidraw.js';

export interface OutputOptions {
  verbose?: boolean;
  quiet?: boolean;
  json?: boolean;
}

let globalOptions: OutputOptions = {};

export function setOutputOptions(options: OutputOptions): void {
  globalOptions = options;
}

export function getOutputOptions(): OutputOptions {
  return globalOptions;
}

/**
 * Output success result as JSON
 */
export function outputJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Output brief element info
 */
export function outputBriefElements(elements: ExcalidrawElement[]): void {
  const brief = elements.map(el => ({
    id: el.id,
    type: el.type,
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height
  }));
  outputJson(brief);
}

/**
 * Output element IDs only
 */
export function outputIds(elements: ExcalidrawElement[]): void {
  for (const el of elements) {
    console.log(el.id);
  }
}

/**
 * Output as table
 */
export function outputTable(elements: ExcalidrawElement[]): void {
  if (elements.length === 0) {
    console.log('No elements');
    return;
  }
  
  const headers = ['ID', 'Type', 'X', 'Y', 'Width', 'Height'];
  const rows = elements.map(el => [
    el.id.slice(0, 8) + '...',
    el.type,
    Math.round(el.x),
    Math.round(el.y),
    Math.round(el.width),
    Math.round(el.height)
  ]);
  
  // Calculate column widths
  const widths = headers.map((h, i) => {
    const values = rows.map(r => String(r[i]).length);
    return Math.max(h.length, ...values);
  });
  
  // Print header
  const headerLine = headers.map((h, i) => h.padEnd(widths[i])).join('  ');
  console.log(headerLine);
  console.log('-'.repeat(headerLine.length));
  
  // Print rows
  for (const row of rows) {
    console.log(row.map((v, i) => String(v).padEnd(widths[i])).join('  '));
  }
}

/**
 * Verbose log (only when --verbose)
 */
export function verbose(message: string): void {
  if (globalOptions.verbose) {
    console.error(`[verbose] ${message}`);
  }
}

/**
 * Info log (suppressed with --quiet)
 */
export function info(message: string): void {
  if (!globalOptions.quiet) {
    console.error(message);
  }
}

/**
 * Error output
 */
export function error(message: string): void {
  console.error(`Error: ${message}`);
}
