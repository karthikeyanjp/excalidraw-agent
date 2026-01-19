import { Command } from 'commander';
import { readFile } from '../utils/file.js';
import { outputJson, outputBriefElements, outputIds, outputTable, verbose } from '../utils/output.js';
import type { ExcalidrawElement, ElementType } from '../types/excalidraw.js';

export interface ListOptions {
  type?: ElementType;
  id?: string;
  format?: 'json' | 'table' | 'ids';
  brief?: boolean;
}

/**
 * Match element ID with glob-like pattern
 * Supports * wildcard at start or end
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

export function listCommand(): Command {
  return new Command('list')
    .description('List elements in an Excalidraw file')
    .argument('<file>', 'Path to the .excalidraw file')
    .option('--type <type>', 'Filter by element type')
    .option('--id <id>', 'Filter by ID (supports * glob)')
    .option('--format <fmt>', 'Output format (json, table, ids)', 'json')
    .option('--brief', 'Only output id, type, position')
    .action(async (filePath: string, options: ListOptions) => {
      verbose(`Listing elements from: ${filePath}`);
      
      const file = readFile(filePath);
      let elements: ExcalidrawElement[] = file.elements;
      
      // Filter by type
      if (options.type) {
        verbose(`Filtering by type: ${options.type}`);
        elements = elements.filter(el => el.type === options.type);
      }
      
      // Filter by ID
      if (options.id) {
        verbose(`Filtering by ID pattern: ${options.id}`);
        elements = elements.filter(el => matchId(el.id, options.id!));
      }
      
      // Filter out deleted
      elements = elements.filter(el => !el.isDeleted);
      
      verbose(`Found ${elements.length} element(s)`);
      
      // Output in requested format
      switch (options.format) {
        case 'ids':
          outputIds(elements);
          break;
        case 'table':
          outputTable(elements);
          break;
        case 'json':
        default:
          if (options.brief) {
            outputBriefElements(elements);
          } else {
            outputJson(elements);
          }
          break;
      }
    });
}
