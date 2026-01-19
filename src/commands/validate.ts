import { Command } from 'commander';
import * as fs from 'node:fs';
import { validateFile, formatValidationResult } from '../validation/schema.js';
import { outputJson, verbose, error as logError } from '../utils/output.js';

export interface ValidateOptions {
  strict?: boolean;
  json?: boolean;
}

export function validateCommand(): Command {
  return new Command('validate')
    .description('Validate an Excalidraw file against the official schema')
    .argument('<file>', 'Path to the .excalidraw file')
    .option('--strict', 'Treat warnings as errors')
    .option('--json', 'Output as JSON')
    .action((filePath: string, options: ValidateOptions) => {
      verbose(`Validating: ${filePath}`);

      if (!fs.existsSync(filePath)) {
        logError(`File not found: ${filePath}`);
        process.exit(1);
      }

      let data: unknown;
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        data = JSON.parse(content);
      } catch (err) {
        logError(`Failed to parse JSON: ${(err as Error).message}`);
        process.exit(1);
      }

      const result = validateFile(data);

      // In strict mode, warnings become errors
      if (options.strict && result.warnings.length > 0) {
        result.valid = false;
        result.errors.push(...result.warnings.map(w => ({ ...w, message: `[strict] ${w.message}` })));
      }

      if (options.json) {
        outputJson({
          valid: result.valid,
          errorCount: result.errors.length,
          warningCount: result.warnings.length,
          errors: result.errors,
          warnings: result.warnings
        });
      } else {
        console.log(formatValidationResult(result));
      }

      process.exit(result.valid ? 0 : 1);
    });
}
