/**
 * Official Excalidraw Schema Validation
 * Based on @excalidraw/excalidraw package types
 * 
 * This module validates that our CLI output matches the official Excalidraw format
 */

// Official Excalidraw element types (from @excalidraw/excalidraw)
export const VALID_ELEMENT_TYPES = [
  'rectangle',
  'diamond', 
  'ellipse',
  'text',
  'line',
  'arrow',
  'freedraw',
  'image',
  'frame',
  'magicframe',
  'iframe',
  'embeddable',
  'selection'
] as const;

export const VALID_FILL_STYLES = ['hachure', 'cross-hatch', 'solid', 'zigzag'] as const;
export const VALID_STROKE_STYLES = ['solid', 'dashed', 'dotted'] as const;
export const VALID_TEXT_ALIGNS = ['left', 'center', 'right'] as const;
export const VALID_VERTICAL_ALIGNS = ['top', 'middle', 'bottom'] as const;
export const VALID_ARROWHEADS = [
  null, 'arrow', 'bar', 'dot', 'circle', 'circle_outline',
  'triangle', 'triangle_outline', 'diamond', 'diamond_outline',
  'crowfoot_one', 'crowfoot_many', 'crowfoot_one_or_many'
] as const;
export const VALID_FONT_FAMILIES = [1, 2, 3, 4, 5] as const; // Virgil, Helvetica, Cascadia, + newer fonts
export const VALID_ROUNDNESS_TYPES = [1, 2, 3] as const;

export type ElementType = typeof VALID_ELEMENT_TYPES[number];
export type FillStyle = typeof VALID_FILL_STYLES[number];
export type StrokeStyle = typeof VALID_STROKE_STYLES[number];
export type Arrowhead = typeof VALID_ARROWHEADS[number];

export interface ValidationError {
  path: string;
  message: string;
  value?: unknown;
  expected?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validate a single element against the official Excalidraw schema
 */
export function validateElement(element: unknown, index: number): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const path = `elements[${index}]`;

  if (!element || typeof element !== 'object') {
    errors.push({ path, message: 'Element must be an object', value: element });
    return { valid: false, errors, warnings };
  }

  const el = element as Record<string, unknown>;

  // Required base properties
  const requiredProps = ['id', 'type', 'x', 'y', 'width', 'height', 'version', 'seed'];
  for (const prop of requiredProps) {
    if (el[prop] === undefined) {
      errors.push({ path: `${path}.${prop}`, message: `Missing required property: ${prop}` });
    }
  }

  // Type validation
  if (el.type && !VALID_ELEMENT_TYPES.includes(el.type as ElementType)) {
    errors.push({
      path: `${path}.type`,
      message: `Invalid element type`,
      value: el.type,
      expected: VALID_ELEMENT_TYPES.join(', ')
    });
  }

  // ID must be a string (typically 21 chars from nanoid)
  if (el.id !== undefined && typeof el.id !== 'string') {
    errors.push({ path: `${path}.id`, message: 'ID must be a string', value: el.id });
  }

  // Numeric validations
  const numericProps = ['x', 'y', 'width', 'height', 'angle', 'opacity', 'strokeWidth', 'roughness', 'seed', 'version', 'versionNonce'];
  for (const prop of numericProps) {
    if (el[prop] !== undefined && typeof el[prop] !== 'number') {
      errors.push({ path: `${path}.${prop}`, message: `${prop} must be a number`, value: el[prop] });
    }
  }

  // Opacity range
  if (typeof el.opacity === 'number' && (el.opacity < 0 || el.opacity > 100)) {
    warnings.push({ path: `${path}.opacity`, message: 'Opacity should be 0-100', value: el.opacity });
  }

  // Angle validation (should be in radians, typically 0-2π)
  if (typeof el.angle === 'number' && (el.angle < -Math.PI * 2 || el.angle > Math.PI * 2)) {
    warnings.push({ path: `${path}.angle`, message: 'Angle should be in radians (-2π to 2π)', value: el.angle });
  }

  // Fill style validation
  if (el.fillStyle && !VALID_FILL_STYLES.includes(el.fillStyle as FillStyle)) {
    errors.push({
      path: `${path}.fillStyle`,
      message: 'Invalid fill style',
      value: el.fillStyle,
      expected: VALID_FILL_STYLES.join(', ')
    });
  }

  // Stroke style validation
  if (el.strokeStyle && !VALID_STROKE_STYLES.includes(el.strokeStyle as StrokeStyle)) {
    errors.push({
      path: `${path}.strokeStyle`,
      message: 'Invalid stroke style',
      value: el.strokeStyle,
      expected: VALID_STROKE_STYLES.join(', ')
    });
  }

  // Color validation (should be valid CSS color)
  const colorProps = ['strokeColor', 'backgroundColor'];
  for (const prop of colorProps) {
    if (el[prop] !== undefined && typeof el[prop] !== 'string') {
      errors.push({ path: `${path}.${prop}`, message: `${prop} must be a string`, value: el[prop] });
    }
  }

  // Boolean validations
  const boolProps = ['isDeleted', 'locked'];
  for (const prop of boolProps) {
    if (el[prop] !== undefined && typeof el[prop] !== 'boolean') {
      errors.push({ path: `${path}.${prop}`, message: `${prop} must be a boolean`, value: el[prop] });
    }
  }

  // Array validations
  if (el.groupIds !== undefined && !Array.isArray(el.groupIds)) {
    errors.push({ path: `${path}.groupIds`, message: 'groupIds must be an array', value: el.groupIds });
  }

  // Roundness validation
  if (el.roundness !== null && el.roundness !== undefined) {
    if (typeof el.roundness !== 'object') {
      errors.push({ path: `${path}.roundness`, message: 'roundness must be an object or null', value: el.roundness });
    } else {
      const roundness = el.roundness as Record<string, unknown>;
      if (!VALID_ROUNDNESS_TYPES.includes(roundness.type as 1 | 2 | 3)) {
        warnings.push({ path: `${path}.roundness.type`, message: 'Invalid roundness type', value: roundness.type });
      }
    }
  }

  // Type-specific validations
  if (el.type === 'text') {
    if (typeof el.text !== 'string') {
      errors.push({ path: `${path}.text`, message: 'Text element must have text property', value: el.text });
    }
    if (el.fontSize !== undefined && typeof el.fontSize !== 'number') {
      errors.push({ path: `${path}.fontSize`, message: 'fontSize must be a number', value: el.fontSize });
    }
    if (el.fontFamily !== undefined && !VALID_FONT_FAMILIES.includes(el.fontFamily as 1 | 2 | 3 | 4 | 5)) {
      warnings.push({ path: `${path}.fontFamily`, message: 'Unknown font family', value: el.fontFamily });
    }
    if (el.textAlign && !VALID_TEXT_ALIGNS.includes(el.textAlign as 'left' | 'center' | 'right')) {
      errors.push({ path: `${path}.textAlign`, message: 'Invalid textAlign', value: el.textAlign });
    }
  }

  if (el.type === 'line' || el.type === 'arrow') {
    if (!Array.isArray(el.points)) {
      errors.push({ path: `${path}.points`, message: 'Linear element must have points array', value: el.points });
    } else {
      for (let i = 0; i < el.points.length; i++) {
        const point = (el.points as unknown[])[i];
        if (!Array.isArray(point) || point.length !== 2) {
          errors.push({ path: `${path}.points[${i}]`, message: 'Point must be [x, y] tuple', value: point });
        }
      }
    }

    // Arrowhead validation
    if (el.startArrowhead !== undefined && el.startArrowhead !== null && 
        !VALID_ARROWHEADS.includes(el.startArrowhead as Arrowhead)) {
      errors.push({ path: `${path}.startArrowhead`, message: 'Invalid arrowhead', value: el.startArrowhead });
    }
    if (el.endArrowhead !== undefined && el.endArrowhead !== null &&
        !VALID_ARROWHEADS.includes(el.endArrowhead as Arrowhead)) {
      errors.push({ path: `${path}.endArrowhead`, message: 'Invalid arrowhead', value: el.endArrowhead });
    }
  }

  if (el.type === 'freedraw') {
    if (!Array.isArray(el.points)) {
      errors.push({ path: `${path}.points`, message: 'Freedraw must have points array', value: el.points });
    }
    if (el.pressures !== undefined && !Array.isArray(el.pressures)) {
      errors.push({ path: `${path}.pressures`, message: 'pressures must be an array', value: el.pressures });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate an entire Excalidraw file
 */
export function validateFile(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    errors.push({ path: 'root', message: 'File must be an object', value: data });
    return { valid: false, errors, warnings };
  }

  const file = data as Record<string, unknown>;

  // Validate file type
  if (file.type !== 'excalidraw') {
    errors.push({ path: 'type', message: 'File type must be "excalidraw"', value: file.type });
  }

  // Validate version
  if (typeof file.version !== 'number') {
    errors.push({ path: 'version', message: 'File must have numeric version', value: file.version });
  } else if (file.version < 1 || file.version > 3) {
    warnings.push({ path: 'version', message: 'Unexpected file version', value: file.version });
  }

  // Validate elements array
  if (!Array.isArray(file.elements)) {
    errors.push({ path: 'elements', message: 'File must have elements array', value: file.elements });
  } else {
    for (let i = 0; i < file.elements.length; i++) {
      const result = validateElement(file.elements[i], i);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }
  }

  // Validate appState
  if (file.appState !== undefined && typeof file.appState !== 'object') {
    errors.push({ path: 'appState', message: 'appState must be an object', value: file.appState });
  } else if (file.appState) {
    const appState = file.appState as Record<string, unknown>;
    if (appState.viewBackgroundColor !== undefined && typeof appState.viewBackgroundColor !== 'string') {
      errors.push({ path: 'appState.viewBackgroundColor', message: 'viewBackgroundColor must be a string' });
    }
    if (appState.gridSize !== undefined && appState.gridSize !== null && typeof appState.gridSize !== 'number') {
      errors.push({ path: 'appState.gridSize', message: 'gridSize must be a number or null' });
    }
  }

  // Validate files object
  if (file.files !== undefined && (typeof file.files !== 'object' || file.files === null)) {
    errors.push({ path: 'files', message: 'files must be an object', value: file.files });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Format validation result for CLI output
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.valid) {
    lines.push('✓ File is valid according to Excalidraw schema');
  } else {
    lines.push('✗ File has validation errors');
  }

  if (result.errors.length > 0) {
    lines.push(`\nErrors (${result.errors.length}):`);
    for (const error of result.errors) {
      lines.push(`  ✗ ${error.path}: ${error.message}`);
      if (error.value !== undefined) lines.push(`    Got: ${JSON.stringify(error.value)}`);
      if (error.expected) lines.push(`    Expected: ${error.expected}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push(`\nWarnings (${result.warnings.length}):`);
    for (const warning of result.warnings) {
      lines.push(`  ⚠ ${warning.path}: ${warning.message}`);
      if (warning.value !== undefined) lines.push(`    Value: ${JSON.stringify(warning.value)}`);
    }
  }

  return lines.join('\n');
}
