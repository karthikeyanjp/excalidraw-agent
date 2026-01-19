/**
 * Excalidraw element types and file format definitions
 */

export type FillStyle = 'solid' | 'hachure' | 'cross-hatch';
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type Arrowhead = null | 'arrow' | 'bar' | 'dot' | 'triangle';
export type TextAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';
export type FontFamily = 1 | 2 | 3; // 1=Virgil, 2=Helvetica, 3=Cascadia

export interface Roundness {
  type: 1 | 2 | 3;
  value?: number;
}

export interface Binding {
  elementId: string;
  focus: number;
  gap: number;
}

export interface BaseElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  roughness: number;
  opacity: number;
  groupIds: string[];
  frameId: string | null;
  roundness: Roundness | null;
  seed: number;
  version: number;
  versionNonce: number;
  isDeleted: boolean;
  boundElements: { id: string; type: string }[] | null;
  updated: number;
  link: string | null;
  locked: boolean;
}

export interface RectangleElement extends BaseElement {
  type: 'rectangle';
}

export interface EllipseElement extends BaseElement {
  type: 'ellipse';
}

export interface DiamondElement extends BaseElement {
  type: 'diamond';
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: FontFamily;
  textAlign: TextAlign;
  verticalAlign: VerticalAlign;
  baseline: number;
  containerId: string | null;
  originalText: string;
  lineHeight: number;
}

export interface LinearElement extends BaseElement {
  type: 'line' | 'arrow';
  points: [number, number][];
  startBinding: Binding | null;
  endBinding: Binding | null;
  lastCommittedPoint: [number, number] | null;
  startArrowhead: Arrowhead;
  endArrowhead: Arrowhead;
}

export interface FreeDrawElement extends BaseElement {
  type: 'freedraw';
  points: [number, number][];
  pressures: number[];
  simulatePressure: boolean;
}

export type ExcalidrawElement =
  | RectangleElement
  | EllipseElement
  | DiamondElement
  | TextElement
  | LinearElement
  | FreeDrawElement;

export type ElementType = ExcalidrawElement['type'];

export interface AppState {
  gridSize: number | null;
  viewBackgroundColor: string;
}

export interface ExcalidrawFile {
  type: 'excalidraw';
  version: number;
  source: string;
  elements: ExcalidrawElement[];
  appState: AppState;
  files: Record<string, unknown>;
}

// Input types (partial, for creating elements)
export interface ElementInput {
  id?: string;
  type: ElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  angle?: number;
  strokeColor?: string;
  backgroundColor?: string;
  fill?: string; // Alias for backgroundColor
  fillStyle?: FillStyle;
  strokeWidth?: number;
  strokeStyle?: StrokeStyle;
  roughness?: number;
  opacity?: number;
  groupIds?: string[];
  locked?: boolean;
  // Text-specific
  text?: string;
  fontSize?: number;
  fontFamily?: FontFamily;
  textAlign?: TextAlign;
  verticalAlign?: VerticalAlign;
  // Line/arrow-specific
  points?: [number, number][];
  startBinding?: Binding | null;
  endBinding?: Binding | null;
  startArrowhead?: Arrowhead;
  endArrowhead?: Arrowhead;
  // Freedraw-specific
  pressures?: number[];
}
