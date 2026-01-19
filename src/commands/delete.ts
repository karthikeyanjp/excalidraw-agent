import { Command } from 'commander';
import { readFile, writeFile } from '../utils/file.js';
import { outputJson, verbose, info } from '../utils/output.js';
import type { ExcalidrawElement, ElementType } from '../types/excalidraw.js';

export interface DeleteOptions {
  id?: string;
  type?: ElementType;
  all?: boolean;
  dryRun?: boolean;
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

export function deleteCommand(): Command {
  return new Command('delete')
    .description('Delete elements from an Excalidraw file')
    .argument('<file>', 'Path to the .excalidraw file')
    .option('--id <id>', 'Element ID to delete (supports * glob)')
    .option('--type <type>', 'Delete all elements of this type')
    .option('--all', 'Delete all elements')
    .option('--dry-run', 'Show what would be deleted without deleting')
    .action(async (filePath: string, options: DeleteOptions) => {
      verbose(`Deleting elements from: ${filePath}`);
      
      if (!options.id && !options.type && !options.all) {
        console.error('Error: Specify --id, --type, or --all');
        process.exit(1);
      }
      
      const file = readFile(filePath);
      
      // Find elements to delete
      const toDelete: ExcalidrawElement[] = [];
      const toKeep: ExcalidrawElement[] = [];
      
      for (const el of file.elements) {
        let shouldDelete = false;
        
        if (options.all) {
          shouldDelete = true;
        } else if (options.id && matchId(el.id, options.id)) {
          shouldDelete = true;
        } else if (options.type && el.type === options.type) {
          shouldDelete = true;
        }
        
        if (shouldDelete) {
          toDelete.push(el);
        } else {
          toKeep.push(el);
        }
      }
      
      if (toDelete.length === 0) {
        info('No elements matched the deletion criteria');
        outputJson({
          success: true,
          deleted: []
        });
        return;
      }
      
      if (options.dryRun) {
        info(`Would delete ${toDelete.length} element(s):`);
        outputJson({
          dryRun: true,
          wouldDelete: toDelete.map(el => ({
            id: el.id,
            type: el.type,
            x: el.x,
            y: el.y
          }))
        });
        return;
      }
      
      // Update file
      file.elements = toKeep;
      
      // Save
      writeFile(filePath, file, { force: true });
      
      verbose(`Deleted ${toDelete.length} element(s)`);
      
      outputJson({
        success: true,
        deleted: toDelete.map(el => el.id)
      });
    });
}
