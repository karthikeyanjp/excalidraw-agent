import { Command } from 'commander';
import { readFile, writeFile } from '../utils/file.js';
import { createElement, mergeElement, validateElementInput } from '../utils/element.js';
import { outputJson, verbose } from '../utils/output.js';
import type { ExcalidrawElement, ElementInput } from '../types/excalidraw.js';

export interface BatchOperation {
  op: 'add' | 'modify' | 'delete';
  // For add
  type?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // For modify/delete
  id?: string;
  set?: Record<string, unknown>;
  // For delete
  all?: boolean;
  // Common
  [key: string]: unknown;
}

export interface BatchOptions {
  stdin?: boolean;
  ops?: string;
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

export function batchCommand(): Command {
  return new Command('batch')
    .description('Execute multiple operations in batch')
    .argument('<file>', 'Path to the .excalidraw file')
    .option('--stdin', 'Read operations from stdin')
    .option('--ops <json>', 'Operations JSON array')
    .action(async (filePath: string, options: BatchOptions) => {
      verbose(`Batch operations on: ${filePath}`);
      
      // Parse operations
      let opsJson: string;
      if (options.stdin) {
        opsJson = await readStdin();
      } else if (options.ops) {
        opsJson = options.ops;
      } else {
        console.error('Error: Provide operations via --stdin or --ops');
        process.exit(1);
      }
      
      const operations: BatchOperation[] = JSON.parse(opsJson);
      
      if (!Array.isArray(operations)) {
        console.error('Error: Operations must be an array');
        process.exit(1);
      }
      
      const file = readFile(filePath);
      
      const results: Array<{
        op: string;
        success: boolean;
        id?: string;
        ids?: string[];
        error?: string;
      }> = [];
      
      for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        verbose(`Operation ${i + 1}/${operations.length}: ${op.op}`);
        
        try {
          switch (op.op) {
            case 'add': {
              const { op: _, ...rest } = op;
              const input: ElementInput = {
                type: rest.type as ElementInput['type'],
                x: rest.x ?? 0,
                y: rest.y ?? 0,
                ...rest
              } as ElementInput;
              
              validateElementInput(input);
              const element = createElement(input);
              file.elements.push(element);
              
              results.push({
                op: 'add',
                success: true,
                id: element.id
              });
              break;
            }
            
            case 'modify': {
              if (!op.id) {
                throw new Error('modify requires id');
              }
              
              let found = false;
              file.elements = file.elements.map(el => {
                if (matchId(el.id, op.id!)) {
                  found = true;
                  const updates = op.set ?? { ...op };
                  delete (updates as Record<string, unknown>).op;
                  delete (updates as Record<string, unknown>).id;
                  return mergeElement(el, updates as Partial<ExcalidrawElement>);
                }
                return el;
              });
              
              if (!found) {
                throw new Error(`No element found with id: ${op.id}`);
              }
              
              results.push({
                op: 'modify',
                success: true,
                id: op.id
              });
              break;
            }
            
            case 'delete': {
              const deleted: string[] = [];
              
              file.elements = file.elements.filter(el => {
                if (op.all || (op.id && matchId(el.id, op.id))) {
                  deleted.push(el.id);
                  return false;
                }
                return true;
              });
              
              results.push({
                op: 'delete',
                success: true,
                ids: deleted
              });
              break;
            }
            
            default:
              throw new Error(`Unknown operation: ${op.op}`);
          }
        } catch (err) {
          results.push({
            op: op.op,
            success: false,
            error: err instanceof Error ? err.message : String(err)
          });
        }
      }
      
      // Save file
      writeFile(filePath, file, { force: true });
      
      outputJson({
        success: results.every(r => r.success),
        operations: results,
        elementCount: file.elements.length
      });
    });
}
