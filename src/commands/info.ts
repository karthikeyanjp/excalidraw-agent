import { Command } from 'commander';
import { readFile, calculateBounds, countElementsByType } from '../utils/file.js';
import { outputJson, verbose } from '../utils/output.js';

export interface InfoOptions {
  format?: 'json' | 'text';
}

export function infoCommand(): Command {
  return new Command('info')
    .description('Show file metadata and statistics')
    .argument('<file>', 'Path to the .excalidraw file')
    .option('--format <fmt>', 'Output format (json, text)', 'json')
    .action(async (filePath: string, options: InfoOptions) => {
      verbose(`Reading info from: ${filePath}`);
      
      const file = readFile(filePath);
      
      // Filter out deleted elements for stats
      const activeElements = file.elements.filter(el => !el.isDeleted);
      
      const info = {
        version: file.version,
        source: file.source,
        elementCount: activeElements.length,
        elementTypes: countElementsByType(activeElements),
        bounds: calculateBounds(activeElements),
        appState: {
          gridSize: file.appState.gridSize,
          viewBackgroundColor: file.appState.viewBackgroundColor
        }
      };
      
      if (options.format === 'text') {
        console.log(`Version: ${info.version}`);
        console.log(`Source: ${info.source}`);
        console.log(`Elements: ${info.elementCount}`);
        console.log(`Types: ${Object.entries(info.elementTypes).map(([t, c]) => `${t}(${c})`).join(', ')}`);
        console.log(`Bounds: x=${info.bounds.x}, y=${info.bounds.y}, w=${info.bounds.width}, h=${info.bounds.height}`);
        console.log(`Background: ${info.appState.viewBackgroundColor}`);
        console.log(`Grid: ${info.appState.gridSize ?? 'none'}`);
      } else {
        outputJson(info);
      }
    });
}
