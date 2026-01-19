/**
 * excalidraw-agent - Programmatic API
 * 
 * Use these exports for programmatic access to excalidraw-agent functionality.
 */

// Types
export * from './types/excalidraw.js';

// Utilities
export { 
  createEmptyFile, 
  readFile, 
  writeFile,
  validateExcalidrawFile,
  calculateBounds,
  countElementsByType 
} from './utils/file.js';

export {
  createElement,
  createRectangle,
  createEllipse,
  createDiamond,
  createText,
  createLine,
  createArrow,
  createFreedraw,
  mergeElement
} from './utils/element.js';

export { generateId, generateSeed } from './utils/id.js';

// Validation
export {
  validateFile,
  validateElement,
  formatValidationResult,
  VALID_ELEMENT_TYPES,
  VALID_FILL_STYLES,
  VALID_STROKE_STYLES,
  VALID_ARROWHEADS
} from './validation/schema.js';

export type { ValidationResult, ValidationError } from './validation/schema.js';
