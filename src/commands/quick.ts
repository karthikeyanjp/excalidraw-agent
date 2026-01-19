import { Command } from 'commander';
import { createEmptyFile, writeFile } from '../utils/file.js';
import { createElement } from '../utils/element.js';
import { generateVersionNonce } from '../utils/id.js';
import { outputJson, verbose } from '../utils/output.js';
import type { ExcalidrawElement, ElementType, Binding } from '../types/excalidraw.js';

export interface QuickOptions {
  output: string;
  direction?: 'horizontal' | 'vertical' | 'h' | 'v';
  spacing?: string;
  style?: 'default' | 'colorful' | 'minimal' | 'blueprint';
  force?: boolean;
}

interface ParsedNode {
  type: ElementType;
  label: string;
  id?: string;
}

interface ParsedConnection {
  from: number;
  to: number;
  label?: string;
  dashed?: boolean;
}

// Color palettes for styles
const PALETTES = {
  default: ['#a5d8ff', '#b2f2bb', '#ffec99', '#ffc9c9', '#d0bfff'],
  colorful: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'],
  minimal: ['#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd'],
  blueprint: ['#1e3a5f', '#2d5a87', '#3d7ab0', '#4d9ad8', '#5dbaff']
};

/**
 * Parse quick DSL syntax:
 * - [Label] = rectangle
 * - (Label) = ellipse
 * - {Label} = diamond
 * - <Label> = text only
 * - -> = arrow
 * - --> = dashed arrow
 * - -- = line
 * - "label" after arrow = connection label
 */
function parseQuickDSL(input: string): { nodes: ParsedNode[]; connections: ParsedConnection[] } {
  const nodes: ParsedNode[] = [];
  const connections: ParsedConnection[] = [];
  
  // Split by arrows/lines while preserving them
  const parts = input.split(/(\s*(?:-->|->|--)\s*(?:"[^"]*"\s*(?:-->|->|--)?\s*)?)/);
  
  let lastNodeIndex = -1;
  let pendingConnection: { type: 'arrow' | 'dashedArrow' | 'line'; label?: string } | null = null;

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Check if it's a connection
    const connMatch = trimmed.match(/^(-->|->|--)(?:\s*"([^"]*)")?/);
    if (connMatch) {
      const connType = connMatch[1] === '-->' ? 'dashedArrow' : 
                       connMatch[1] === '->' ? 'arrow' : 'line';
      pendingConnection = { type: connType, label: connMatch[2] };
      continue;
    }

    // Parse node
    let type: ElementType = 'rectangle';
    let label = trimmed;

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      type = 'rectangle';
      label = trimmed.slice(1, -1);
    } else if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      type = 'ellipse';
      label = trimmed.slice(1, -1);
    } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      type = 'diamond';
      label = trimmed.slice(1, -1);
    } else if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
      type = 'text';
      label = trimmed.slice(1, -1);
    }

    nodes.push({ type, label });
    const nodeIndex = nodes.length - 1;

    // If there was a pending connection, create it
    if (pendingConnection && lastNodeIndex >= 0) {
      connections.push({
        from: lastNodeIndex,
        to: nodeIndex,
        label: pendingConnection.label,
        dashed: pendingConnection.type === 'dashedArrow'
      });
      pendingConnection = null;
    }

    lastNodeIndex = nodeIndex;
  }

  return { nodes, connections };
}

/**
 * Add a bound element reference to an element
 */
function addBoundElement(
  element: ExcalidrawElement,
  boundId: string,
  boundType: string
): ExcalidrawElement {
  const currentBoundElements = element.boundElements ?? [];
  
  return {
    ...element,
    boundElements: [...currentBoundElements, { id: boundId, type: boundType }],
    version: element.version + 1,
    versionNonce: generateVersionNonce(),
    updated: Date.now()
  };
}

export function quickCommand(): Command {
  return new Command('quick')
    .description('Create a quick diagram from simple text DSL')
    .argument('<dsl>', 'Diagram DSL: "[Start] -> [Process] -> {Decision?} -> [End]"')
    .requiredOption('-o, --output <file>', 'Output file path')
    .option('-d, --direction <dir>', 'Layout direction: horizontal (h) or vertical (v)', 'horizontal')
    .option('-s, --spacing <px>', 'Spacing between elements', '100')
    .option('--style <name>', 'Style preset: default, colorful, minimal, blueprint', 'default')
    .option('-f, --force', 'Overwrite existing file')
    .action((dsl: string, options: QuickOptions) => {
      verbose(`Creating quick diagram: ${dsl}`);

      const { nodes, connections } = parseQuickDSL(dsl);
      
      if (nodes.length === 0) {
        console.error('Error: No nodes found in DSL');
        process.exit(1);
      }

      const file = createEmptyFile();
      const spacing = parseInt(options.spacing ?? '100', 10);
      const isVertical = options.direction === 'vertical' || options.direction === 'v';
      const palette = PALETTES[options.style as keyof typeof PALETTES] ?? PALETTES.default;
      const isMinimal = options.style === 'minimal';
      const isBlueprint = options.style === 'blueprint';

      // Track shape elements for binding (index -> shape element)
      const shapeElements: Map<number, ExcalidrawElement> = new Map();
      const shapeIndices: Map<number, number> = new Map(); // node index -> file.elements index

      // Create node elements
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const color = palette[i % palette.length];
        
        const baseX = isVertical ? 100 : 100 + i * (150 + spacing);
        const baseY = isVertical ? 100 + i * (80 + spacing) : 100;

        if (node.type === 'text') {
          // Text-only node
          const textEl = createElement({
            type: 'text',
            x: baseX,
            y: baseY + 20,
            text: node.label,
            fontSize: 18,
            strokeColor: isBlueprint ? '#ffffff' : '#1e1e1e'
          });
          shapeIndices.set(i, file.elements.length);
          shapeElements.set(i, textEl);
          file.elements.push(textEl);
        } else {
          // Shape + text
          const width = node.type === 'diamond' ? 120 : 150;
          const height = node.type === 'diamond' ? 80 : 60;
          
          const shapeEl = createElement({
            type: node.type,
            x: baseX,
            y: baseY,
            width,
            height,
            backgroundColor: color,
            fillStyle: isMinimal ? 'solid' : 'solid',
            strokeColor: isBlueprint ? '#ffffff' : '#1e1e1e',
            strokeWidth: isMinimal ? 1 : 2,
            roughness: isMinimal ? 0 : 1
          });
          
          shapeIndices.set(i, file.elements.length);
          shapeElements.set(i, shapeEl);
          file.elements.push(shapeEl);

          // Add centered label
          const fontSize = 16;
          const estimatedTextWidth = node.label.length * fontSize * 0.6;
          const estimatedTextHeight = fontSize * 1.25;
          
          const textEl = createElement({
            type: 'text',
            x: baseX + (width - estimatedTextWidth) / 2,
            y: baseY + (height - estimatedTextHeight) / 2,
            text: node.label,
            fontSize,
            textAlign: 'center',
            strokeColor: isBlueprint ? '#ffffff' : '#1e1e1e'
          });
          file.elements.push(textEl);
        }
      }

      // Create connections with bindings
      for (const conn of connections) {
        const fromShape = shapeElements.get(conn.from);
        const toShape = shapeElements.get(conn.to);
        const fromIdx = shapeIndices.get(conn.from);
        const toIdx = shapeIndices.get(conn.to);

        if (!fromShape || !toShape || fromIdx === undefined || toIdx === undefined) continue;

        let startX: number, startY: number, endX: number, endY: number;

        if (isVertical) {
          startX = fromShape.x + fromShape.width / 2;
          startY = fromShape.y + fromShape.height;
          endX = toShape.x + toShape.width / 2;
          endY = toShape.y;
        } else {
          startX = fromShape.x + fromShape.width;
          startY = fromShape.y + fromShape.height / 2;
          endX = toShape.x;
          endY = toShape.y + toShape.height / 2;
        }

        // Create bindings
        const startBinding: Binding = {
          elementId: fromShape.id,
          focus: 0,
          gap: 1
        };
        const endBinding: Binding = {
          elementId: toShape.id,
          focus: 0,
          gap: 1
        };

        const arrowEl = createElement({
          type: 'arrow',
          x: startX,
          y: startY,
          points: [[0, 0], [endX - startX, endY - startY]],
          strokeColor: isBlueprint ? '#ffffff' : '#1e1e1e',
          strokeStyle: conn.dashed ? 'dashed' : 'solid',
          startBinding,
          endBinding,
          endArrowhead: 'arrow'
        });

        // Update shape elements with boundElements
        file.elements[fromIdx] = addBoundElement(file.elements[fromIdx], arrowEl.id, 'arrow');
        file.elements[toIdx] = addBoundElement(file.elements[toIdx], arrowEl.id, 'arrow');
        
        // Update our tracking maps
        shapeElements.set(conn.from, file.elements[fromIdx]);
        shapeElements.set(conn.to, file.elements[toIdx]);

        file.elements.push(arrowEl);

        // Add label if present
        if (conn.label) {
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;
          const labelEl = createElement({
            type: 'text',
            x: midX - 15,
            y: midY - 15,
            text: conn.label,
            fontSize: 12,
            strokeColor: isBlueprint ? '#ffffff' : '#1e1e1e'
          });
          file.elements.push(labelEl);
        }
      }

      // Set background for blueprint style
      if (isBlueprint) {
        file.appState.viewBackgroundColor = '#0d1b2a';
      }

      writeFile(options.output, file, { force: options.force });

      outputJson({
        success: true,
        file: options.output,
        nodeCount: nodes.length,
        connectionCount: connections.length,
        style: options.style,
        direction: isVertical ? 'vertical' : 'horizontal'
      });
    });
}
