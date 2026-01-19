#!/usr/bin/env node

import { Command } from 'commander';
import { setOutputOptions } from './utils/output.js';
import {
  createCommand,
  addCommand,
  listCommand,
  modifyCommand,
  deleteCommand,
  infoCommand,
  exportCommand,
  batchCommand,
  validateCommand,
  connectCommand,
  quickCommand
} from './commands/index.js';
import {
  FileNotFoundError,
  FileExistsError,
  InvalidJsonError,
  InvalidFileError
} from './utils/file.js';
import { InvalidElementError } from './utils/element.js';

const program = new Command();

program
  .name('excalidraw-agent')
  .description('Agent-first CLI for creating, reading, modifying, and exporting Excalidraw drawings')
  .version('1.0.0')
  .option('-v, --verbose', 'Verbose output for debugging')
  .option('-q, --quiet', 'Suppress non-essential output')
  .option('--json', 'Force JSON output')
  .option('--no-color', 'Disable colored output')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    setOutputOptions({
      verbose: opts.verbose,
      quiet: opts.quiet,
      json: opts.json
    });
  });

// Register commands
program.addCommand(createCommand());
program.addCommand(addCommand());
program.addCommand(listCommand());
program.addCommand(modifyCommand());
program.addCommand(deleteCommand());
program.addCommand(infoCommand());
program.addCommand(exportCommand());
program.addCommand(batchCommand());
program.addCommand(validateCommand());
program.addCommand(connectCommand());
program.addCommand(quickCommand());

// Global error handler
process.on('uncaughtException', (err) => {
  handleError(err);
});

process.on('unhandledRejection', (err) => {
  handleError(err instanceof Error ? err : new Error(String(err)));
});

function handleError(err: Error): void {
  if (err instanceof FileNotFoundError) {
    console.error(`Error: ${err.message}`);
    process.exit(2);
  }
  
  if (err instanceof InvalidJsonError) {
    console.error(`Error: ${err.message}`);
    process.exit(3);
  }
  
  if (err instanceof InvalidFileError || err instanceof InvalidElementError) {
    console.error(`Error: ${err.message}`);
    process.exit(4);
  }
  
  if (err instanceof FileExistsError) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
  
  // Unknown error
  console.error(`Error: ${err.message}`);
  if (program.opts().verbose) {
    console.error(err.stack);
  }
  process.exit(1);
}

// Parse and execute
program.parseAsync(process.argv).catch(handleError);
