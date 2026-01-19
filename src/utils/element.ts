import { generateId, generateSeed, generateVersionNonce } from './id.js';
import type {
  ExcalidrawElement,
  ElementInput,
  RectangleElement,
  EllipseElement,
  DiamondElement,
  TextElement,
  LinearElement,
  FreeDrawElement,
  BaseElement,
  FillStyle,
  StrokeStyle,
  Arrowhead,
  FontFamily,
  TextAlign,
  VerticalAlign
} from '../types/excalidraw.js';

/**
 * Default values for base element properties
 */
const baseDefaults: Omit<BaseElement, 'id' | 'type' | 'x' | 'y' | 'width' | 'height' | 'seed' | 'version' | 'versionNonce' | 'updated'> = {
  angle: 0,
  strokeColor: '#1e1e1e',
  backgroundColor: 'transparent',
  fillStyle: 'solid' as FillStyle,
  strokeWidth: 2,
  strokeStyle: 'solid' as StrokeStyle,
  roughness: 1,
  opacity: 100,
  groupIds: [],
  frameId: null,
  roundness: null,
  isDeleted: false,
  boundElements: null,
  link: null,
  locked: false
};

/**
 * Create base element with defaults
 */
function createBaseElement(input: ElementInput): Omit<BaseElement, 'type'> {
  const now = Date.now();
  return {
    id: input.id ?? generateId(),
    x: input.x,
    y: input.y,
    width: input.width ?? 100,
    height: input.height ?? 100,
    angle: input.angle ?? baseDefaults.angle,
    strokeColor: input.strokeColor ?? baseDefaults.strokeColor,
    backgroundColor: input.backgroundColor ?? input.fill ?? baseDefaults.backgroundColor,
    fillStyle: input.fillStyle ?? baseDefaults.fillStyle,
    strokeWidth: input.strokeWidth ?? baseDefaults.strokeWidth,
    strokeStyle: input.strokeStyle ?? baseDefaults.strokeStyle,
    roughness: input.roughness ?? baseDefaults.roughness,
    opacity: input.opacity ?? baseDefaults.opacity,
    groupIds: input.groupIds ?? baseDefaults.groupIds,
    frameId: baseDefaults.frameId,
    roundness: baseDefaults.roundness,
    seed: generateSeed(),
    version: 1,
    versionNonce: generateVersionNonce(),
    isDeleted: baseDefaults.isDeleted,
    boundElements: baseDefaults.boundElements,
    updated: now,
    link: baseDefaults.link,
    locked: input.locked ?? baseDefaults.locked
  };
}

/**
 * Create a rectangle element
 */
export function createRectangle(input: ElementInput): RectangleElement {
  const base = createBaseElement(input);
  return {
    ...base,
    type: 'rectangle',
    roundness: { type: 3 }
  };
}

/**
 * Create an ellipse element
 */
export function createEllipse(input: ElementInput): EllipseElement {
  const base = createBaseElement(input);
  return {
    ...base,
    type: 'ellipse'
  };
}

/**
 * Create a diamond element
 */
export function createDiamond(input: ElementInput): DiamondElement {
  const base = createBaseElement(input);
  return {
    ...base,
    type: 'diamond'
  };
}

/**
 * Create a text element
 */
export function createText(input: ElementInput): TextElement {
  const text = input.text ?? 'Text';
  const fontSize = input.fontSize ?? 20;
  const fontFamily = input.fontFamily ?? 1;
  
  // Estimate dimensions based on text
  const lineHeight = 1.25;
  const lines = text.split('\n');
  const estimatedWidth = Math.max(...lines.map(l => l.length)) * fontSize * 0.6;
  const estimatedHeight = lines.length * fontSize * lineHeight;
  
  const base = createBaseElement({
    ...input,
    width: input.width ?? estimatedWidth,
    height: input.height ?? estimatedHeight
  });
  
  return {
    ...base,
    type: 'text',
    text,
    fontSize,
    fontFamily: fontFamily as FontFamily,
    textAlign: input.textAlign ?? 'left',
    verticalAlign: input.verticalAlign ?? 'top',
    baseline: fontSize,
    containerId: null,
    originalText: text,
    lineHeight
  };
}

/**
 * Create a line element
 */
export function createLine(input: ElementInput): LinearElement {
  const points = input.points ?? [[0, 0], [100, 100]];
  
  // Calculate width/height from points
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  
  const base = createBaseElement({
    ...input,
    width: width || 1,
    height: height || 1
  });
  
  return {
    ...base,
    type: 'line',
    points,
    startBinding: input.startBinding ?? null,
    endBinding: input.endBinding ?? null,
    lastCommittedPoint: null,
    startArrowhead: input.startArrowhead ?? null,
    endArrowhead: input.endArrowhead ?? null
  };
}

/**
 * Create an arrow element
 */
export function createArrow(input: ElementInput): LinearElement {
  const line = createLine(input);
  return {
    ...line,
    type: 'arrow',
    endArrowhead: input.endArrowhead ?? 'arrow'
  };
}

/**
 * Create a freedraw element
 */
export function createFreedraw(input: ElementInput): FreeDrawElement {
  const points = input.points ?? [[0, 0]];
  const pressures = input.pressures ?? points.map(() => 0.5);
  
  // Calculate width/height from points
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  
  const base = createBaseElement({
    ...input,
    width: width || 1,
    height: height || 1
  });
  
  return {
    ...base,
    type: 'freedraw',
    points,
    pressures,
    simulatePressure: pressures.length === 0
  };
}

/**
 * Create element by type
 */
export function createElement(input: ElementInput): ExcalidrawElement {
  switch (input.type) {
    case 'rectangle':
      return createRectangle(input);
    case 'ellipse':
      return createEllipse(input);
    case 'diamond':
      return createDiamond(input);
    case 'text':
      return createText(input);
    case 'line':
      return createLine(input);
    case 'arrow':
      return createArrow(input);
    case 'freedraw':
      return createFreedraw(input);
    default:
      throw new InvalidElementError(`Unknown element type: ${(input as ElementInput).type}`);
  }
}

/**
 * Validate element input
 */
export function validateElementInput(input: unknown): asserts input is ElementInput {
  if (typeof input !== 'object' || input === null) {
    throw new InvalidElementError('Element must be an object');
  }
  
  const el = input as Record<string, unknown>;
  
  if (typeof el.type !== 'string') {
    throw new InvalidElementError('Element must have a "type" property');
  }
  
  const validTypes = ['rectangle', 'ellipse', 'diamond', 'text', 'line', 'arrow', 'freedraw'];
  if (!validTypes.includes(el.type)) {
    throw new InvalidElementError(`Invalid element type: ${el.type}. Valid types: ${validTypes.join(', ')}`);
  }
  
  if (typeof el.x !== 'number') {
    throw new InvalidElementError('Element must have numeric "x" property');
  }
  
  if (typeof el.y !== 'number') {
    throw new InvalidElementError('Element must have numeric "y" property');
  }
}

/**
 * Deep merge element with updates
 */
export function mergeElement<T extends ExcalidrawElement>(
  element: T,
  updates: Partial<T>
): T {
  const merged = { ...element };
  
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      (merged as unknown as Record<string, unknown>)[key] = value;
    }
  }
  
  // Update version
  merged.version += 1;
  merged.versionNonce = generateVersionNonce();
  merged.updated = Date.now();
  
  return merged;
}

// Error class
export class InvalidElementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidElementError';
  }
}
