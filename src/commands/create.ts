import { Command } from 'commander';
import { createEmptyFile, writeFile, FileExistsError } from '../utils/file.js';
import { outputJson, verbose } from '../utils/output.js';

export interface CreateOptions {
  background?: string;
  grid?: string;
  force?: boolean;
}

export function createCommand(): Command {
  return new Command('create')
    .description('Create a new .excalidraw file')
    .argument('<file>', 'Path to the new .excalidraw file')
    .option('--background <color>', 'Background color', '#ffffff')
    .option('--grid <size>', 'Grid size (null for no grid)')
    .option('--force', 'Overwrite existing file', false)
    .action(async (filePath: string, options: CreateOptions) => {
      try {
        verbose(`Creating file: ${filePath}`);
        
        const gridSize = options.grid ? parseInt(options.grid, 10) : null;
        
        const file = createEmptyFile({
          backgroundColor: options.background,
          gridSize
        });
        
        writeFile(filePath, file, { force: options.force });
        
        verbose(`File created successfully`);
        
        outputJson({
          success: true,
          file: filePath,
          appState: file.appState,
          elementCount: 0
        });
      } catch (err) {
        if (err instanceof FileExistsError) {
          console.error(`Error: ${err.message}`);
          process.exit(1);
        }
        throw err;
      }
    });
}
