import { Command } from 'commander';
import { readFile, writeFile } from '../utils/file.js';
import { mergeElement } from '../utils/element.js';
import { outputJson, verbose } from '../utils/output.js';
import type { ExcalidrawElement } from '../types/excalidraw.js';

export interface ModifyOptions {
  id?: string;
  set?: string[];
  data?: string;
  stdin?: boolean;
  move?: string;
  moveto?: string;
  resize?: string;
  rotate?: string;
}

/**
 * Match element ID with glob-like pattern
 */
function matchId(id: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (pattern.startsWith('*') && pattern.endsWith('*')) {
    return id.includes(pattern.slice(1, -1));
  }
  if (pattern.startsWith('*')) {
    return id.endsWith(pattern.slice(1));
  }
  if (pattern.endsWith('*')) {
    return id.startsWith(pattern.slice(0, -1));
  }
  return id === pattern;
}

/**
 * Parse --set key=value pairs
 */
function parseSetOptions(sets: string[]): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  
  for (const s of sets) {
    const eqIndex = s.indexOf('=');
    if (eqIndex === -1) {
      throw new Error(`Invalid --set format: ${s}. Use key=value`);
    }
    
    const key = s.slice(0, eqIndex);
    let value: unknown = s.slice(eqIndex + 1);
    
    // Try to parse as JSON for complex values
    try {
      value = JSON.parse(value as string);
    } catch {
      // Keep as string if not valid JSON
    }
    
    updates[key] = value;
  }
  
  return updates;
}

/**
 * Read from stdin
 */
function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    
    if (process.stdin.isTTY) {
      reject(new Error('No input provided on stdin'));
      return;
    }
    
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

export function modifyCommand(): Command {
  return new Command('modify')
    .description('Modify existing elements in an Excalidraw file')
    .argument('<file>', 'Path to the .excalidraw file')
    .option('--id <id>', 'Element ID to modify (supports * glob)')
    .option('--set <key=value>', 'Set property (repeatable)', (v, prev: string[]) => [...prev, v], [])
    .option('--data <json>', 'Merge JSON into element')
    .option('--stdin', 'Read modifications from stdin')
    .option('--move <dx,dy>', 'Relative move by dx,dy')
    .option('--moveto <x,y>', 'Absolute move to x,y')
    .option('--resize <w,h>', 'Set size to w,h')
    .option('--rotate <angle>', 'Set rotation in degrees')
    .action(async (filePath: string, options: ModifyOptions) => {
      verbose(`Modifying elements in: ${filePath}`);
      
      if (!options.id && !options.stdin) {
        console.error('Error: --id is required (or use --stdin)');
        process.exit(1);
      }
      
      const file = readFile(filePath);
      
      // Build updates
      let updates: Record<string, unknown> = {};
      
      // From --set options
      if (options.set && options.set.length > 0) {
        updates = { ...updates, ...parseSetOptions(options.set) };
      }
      
      // From --data
      if (options.data) {
        updates = { ...updates, ...JSON.parse(options.data) };
      }
      
      // From stdin
      if (options.stdin) {
        const input = await readStdin();
        updates = { ...updates, ...JSON.parse(input) };
      }
      
      // Handle convenience options
      if (options.move) {
        const [dx, dy] = options.move.split(',').map(Number);
        updates._move = { dx, dy };
      }
      
      if (options.moveto) {
        const [x, y] = options.moveto.split(',').map(Number);
        updates.x = x;
        updates.y = y;
      }
      
      if (options.resize) {
        const [w, h] = options.resize.split(',').map(Number);
        updates.width = w;
        updates.height = h;
      }
      
      if (options.rotate) {
        updates.angle = (parseFloat(options.rotate) * Math.PI) / 180;
      }
      
      // Find and modify matching elements
      const modified: ExcalidrawElement[] = [];
      
      file.elements = file.elements.map(el => {
        if (options.id && !matchId(el.id, options.id)) {
          return el;
        }
        
        // Handle relative move
        const finalUpdates = { ...updates };
        if (finalUpdates._move) {
          const move = finalUpdates._move as { dx: number; dy: number };
          finalUpdates.x = el.x + move.dx;
          finalUpdates.y = el.y + move.dy;
          delete finalUpdates._move;
        }
        
        verbose(`Modifying element ${el.id}`);
        const merged = mergeElement(el, finalUpdates as Partial<ExcalidrawElement>);
        modified.push(merged);
        return merged;
      });
      
      if (modified.length === 0) {
        console.error(`Error: No elements matched ID pattern: ${options.id}`);
        process.exit(1);
      }
      
      // Save
      writeFile(filePath, file, { force: true });
      
      verbose(`Modified ${modified.length} element(s)`);
      
      outputJson({
        success: true,
        modified: modified.map(el => ({
          id: el.id,
          type: el.type,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height
        }))
      });
    });
}
