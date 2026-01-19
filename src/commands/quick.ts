import { Command } from 'commander';
import { createEmptyFile, writeFile } from '../utils/file.js';
import { createElement } from '../utils/element.js';
import { outputJson, verbose } from '../utils/output.js';
import type { ExcalidrawElement, ElementType } from '../types/excalidraw.js';

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

      // Create node elements
      const nodeElements: ExcalidrawElement[] = [];
      
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
          nodeElements.push(textEl);
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
          nodeElements.push(shapeEl);

          // Add label
          const textEl = createElement({
            type: 'text',
            x: baseX + 10,
            y: baseY + height / 2 - 10,
            text: node.label,
            fontSize: 16,
            strokeColor: isBlueprint ? '#ffffff' : '#1e1e1e'
          });
          nodeElements.push(textEl);
        }
      }

      file.elements.push(...nodeElements);

      // Create connections
      for (const conn of connections) {
        const fromNode = nodeElements[conn.from * 2]; // *2 because each node has shape + text
        const toNode = nodeElements[conn.to * 2];

        if (!fromNode || !toNode) continue;

        let startX: number, startY: number, endX: number, endY: number;

        if (isVertical) {
          startX = fromNode.x + fromNode.width / 2;
          startY = fromNode.y + fromNode.height;
          endX = toNode.x + toNode.width / 2;
          endY = toNode.y;
        } else {
          startX = fromNode.x + fromNode.width;
          startY = fromNode.y + fromNode.height / 2;
          endX = toNode.x;
          endY = toNode.y + toNode.height / 2;
        }

        const arrowEl = createElement({
          type: 'arrow',
          x: startX,
          y: startY,
          points: [[0, 0], [endX - startX, endY - startY]],
          strokeColor: isBlueprint ? '#ffffff' : '#1e1e1e',
          strokeStyle: conn.dashed ? 'dashed' : 'solid',
          endArrowhead: 'arrow'
        });
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
